require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cors = require('cors');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendUserbotMessage, getTelegramMessages } = require('./userbot');
const { sendSMS } = require('./sms');

// Global Anti-Crash Handlers (bot va server kutilmagan xatolarda o'chib qolmasligi uchun)
process.on('uncaughtException', (err) => {
  console.error('⚠️ [ANTI-CRUSH] Uncaught Exception:', err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [ANTI-CRUSH] Unhandled Rejection at promise:', reason);
});

// Mongoose re-connection resilience
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose ulanishida xatolik:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose ulanishi uzildi. Qayta ulanishga harakat qilinmoqda...');
});

const User = require('./models/User');
const Event = require('./models/Event');
const Expense = require('./models/Expense');
const { initUserbot } = require('./userbot');
const { initTelegramBot } = require('./telegramBot');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

const createDefaultAdmin = async () => {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin', 10);
        await User.create({ username: 'admin', password: hashedPassword, role: 'admin', fullName: 'Boshliq' });
        console.log('Default admin created.');
    }
};

const createDefaultOperator = async () => {
    const operatorExists = await User.findOne({ username: 'ali' });
    if (!operatorExists) {
        const operatorPassword = await bcrypt.hash('123', 10);
        await User.create({ username: 'ali', password: operatorPassword, role: 'operator', fullName: 'Ali Valiyev' });
        console.log('Default operator created.');
    }
};

const startDatabase = async () => {
  let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/timproduction';
  const PORT = process.env.PORT || 5000;
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    await createDefaultAdmin();
    await createDefaultOperator();
    
    initUserbot();
    initTelegramBot();
    

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log('Local MongoDB not found. Starting In-Memory MongoDB...');
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('Connected to In-Memory MongoDB');
    
    await createDefaultAdmin();
    await createDefaultOperator();
    
    initUserbot();
    initTelegramBot();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
  }
};
startDatabase();


// --- CRON JOB ---
const checkUpcomingEvents = async () => {
  console.log('Running cron job to check for upcoming events...');
  try {
    const now = new Date();
    // 24 soat ichida bo'ladigan barcha to'ylarni topish
    const targetDateMax = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingEvents = await Event.find({
      date: { $gte: now, $lte: targetDateMax },
      notified: false
    })
    .populate('assignedOperators')
    .populate('assignedRoninchis')
    .populate('assignedPhotographers');

    for (const event of upcomingEvents) {
      const formattedDate = new Date(event.date).toLocaleString('en-GB', { 
        timeZone: 'Asia/Tashkent', 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      });

      const text = `🔔 DIQQAT!\n` +
        `Sarlavha: ${event.title}\n` +
        `Loyiha turi: ${event.eventType}\n` +
        `🕒 Vaqti: ${formattedDate}\n` +
        `📍 To'yxona: ${event.venue}\n` +
        `🗺 Manzil: ${event.location}\n` +
        `📹 Kamera soni: ${event.cameraCount || 1}\n` +
        (event.comment ? `💬 Komment: ${event.comment}\n\n` : `\n`) +
        `Iltimos, tayyorgarlik ko'ring!`;

      const allEmployees = [
        ...(event.assignedOperators || []),
        ...(event.assignedRoninchis || []),
        ...(event.assignedPhotographers || [])
      ];

      const uniqueEmployeesMap = new Map();
      for (const emp of allEmployees) {
        if (emp && emp._id) {
          uniqueEmployeesMap.set(emp._id.toString(), emp);
        }
      }
      const uniqueEmployees = Array.from(uniqueEmployeesMap.values());

      for (const employee of uniqueEmployees) {
        if (employee.telegramUsername) {
            await sendUserbotMessage(employee.telegramUsername, text);
        } else if (employee.telegramChatId) {
            await sendUserbotMessage(employee.telegramChatId, text);
        }
      }
      console.log(`Cron job finished for event: ${event.title}`);
      event.notified = true;
      await event.save();
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
};

cron.schedule('*/5 * * * *', checkUpcomingEvents);
// Run immediately on server start in case it woke up from sleep
setTimeout(checkUpcomingEvents, 5000);

// --- CLIENT TRACKING ENDPOINT ---
app.get('/api/events/track/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Not found" });
    // Only return safe public data
    res.json({
      title: event.title,
      status: event.status,
      date: event.date,
      venue: event.venue,
      videoLink: event.videoLink,
      clientRating: event.clientRating,
      clientFeedback: event.clientFeedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/events/track/:id/rate', async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Not found" });
    
    event.clientRating = rating;
    event.clientFeedback = feedback;
    await event.save();
    res.json({ message: "Raxmat! Fikr-mulohazangiz qabul qilindi." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- AUTH ---
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const data = req.body;
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) return res.status(500).json({ message: "Bot token not configured" });

    const checkHash = data.hash;
    delete data.hash;

    const dataCheckArr = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        dataCheckArr.push(`${key}=${data[key]}`);
      }
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (hash !== checkHash) {
      return res.status(401).json({ message: "Telegram auth failed" });
    }

    let user = await User.findOne({ telegramId: data.id.toString() });
    
    if (!user && data.username) {
       user = await User.findOne({ telegramUsername: data.username.toLowerCase() });
       if (user) {
         user.telegramId = data.id.toString();
         await user.save();
       }
    }

    if (!user) {
      return res.status(403).json({ message: "Sizning profilingiz topilmadi. Admin sizni tizimga qo'shishi kerak." });
    }

    const token = jwt.sign({ id: user._id, role: user.role, profession: user.profession }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role, fullName: user.fullName, profession: user.profession } });

  } catch (err) {
    res.status(500).json({ message: "Server xatosi" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await User.findOne({ username });
    
    if (!user && username === 'admin' && password === 'admin') {
       const hashedPassword = await bcrypt.hash('admin', 10);
       user = new User({ username: 'admin', password: hashedPassword, role: 'admin', fullName: 'Boshliq' });
       await user.save();
    } else if (!user) {
      return res.status(401).json({ message: 'Noto\'g\'ri login yoki parol' });
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Noto\'g\'ri login yoki parol' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, fullName: user.fullName, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token topilmadi' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token noto\'g\'ri' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Ruxsat yo\'q' });
  next();
};

app.put('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { password, telegramUsername } = req.body;
    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin topilmadi' });

    if (password && password.trim() !== '') {
      admin.password = await bcrypt.hash(password, 10);
    }
    if (telegramUsername !== undefined) {
      admin.telegramUsername = telegramUsername.replace('@', '').toLowerCase();
    }
    
    await admin.save();
    res.json({ message: 'Sozlamalar saqlandi', user: admin });
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

app.post('/api/operators', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, fullName, telegramUsername, profession } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newOperator = new User({ username, password: hashedPassword, fullName, telegramUsername, role: 'operator', profession: profession || 'operator' });
    await newOperator.save();
    res.json(newOperator);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik yuz berdi. Balki bu username allaqachon mavjud.' });
  }
});



app.get('/api/operators', authMiddleware, adminMiddleware, async (req, res) => {
  const operators = await User.find({ role: 'operator' }).select('-password');
  res.json(operators);
});

app.delete('/api/operators/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'O\'chirildi' });
});

app.put('/api/operators/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, fullName, telegramUsername, profession } = req.body;
    let updateData = { username, fullName, telegramUsername };
    if (profession) updateData.profession = profession;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const operator = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(operator);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

app.post('/api/events', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();

    // Avtomatlashtirilgan xabarlarni yuborish
    if (event.clientPhone) {
      const formattedDate = new Date(event.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let messageText = `Assalomu alaykum, ${event.clientName || 'Mijoz'}!\nTim Production sizning buyurtmangizni qabul qildi.\n\n`;
      messageText += `Sarlavha: ${event.title}\n`;
      messageText += `Tadbir: ${event.eventType}\n`;
      messageText += `Sana: ${formattedDate}\n`;
      messageText += `Kamera soni: ${event.cameraCount || 1} ta\n`;
      
      if (event.assignedRoninchis && event.assignedRoninchis.length > 0) messageText += `Roninchi: Bor\n`;
      if (event.assignedPhotographers && event.assignedPhotographers.length > 0) messageText += `Fotograf: Bor\n`;
      if (event.album) messageText += `Albom: ${event.album}\n`;
      if (event.comment) messageText += `Qo'shimcha Izoh: ${event.comment}\n`;

      messageText += `\nUmumiy summa: ${event.budget ? event.budget.toLocaleString('ru-RU') : 0} so'm\n`;
      messageText += `Berilgan avans: ${event.advancePayment ? event.advancePayment.toLocaleString('ru-RU') : 0} so'm\n\n`;

      messageText += `Ishonchingiz uchun rahmat!\n\n`;
      messageText += `🎉 To'yingiz jarayonini kuzatib borish uchun maxsus havola:\n🔗 https://timuzbbukhara.onrender.com/track/${event._id}`;
      // Contact name yaratish: "Ali Valiyev 12/12/2026"
      const contactName = `${event.clientName || 'Mijoz'} ${formattedDate.split(',')[0]}`;
      // Telegram orqali yuborish
      sendUserbotMessage(event.clientPhone, messageText, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      // SMS avtomatik yuborilmaydi, faqat tahrirlanib manual yuboriladi
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

app.post('/api/sms/send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phone, message } = req.body;
    await sendSMS(phone, message);
    res.json({ success: true });
  } catch (error) {
    console.error("SMS yuborish xatosi:", error);
    res.status(500).json({ message: 'SMS yuborishda xatolik', details: error.message });
  }
});

app.get('/api/events', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const events = await Event.find()
        .populate('assignedOperators', '-password')
        .populate('assignedEditors', '-password')
        .populate('assignedRoninchis', '-password')
        .populate('assignedPhotographers', '-password')
        .sort({ date: 1 });
      res.json(events);
    } else {
      const events = await Event.find({ 
        $or: [{ assignedOperators: req.user.id }, { assignedEditors: req.user.id }, { assignedRoninchis: req.user.id }, { assignedPhotographers: req.user.id }] 
      })
        .populate('assignedOperators', '-password')
        .populate('assignedEditors', '-password')
        .populate('assignedRoninchis', '-password')
        .populate('assignedPhotographers', '-password')
        .sort({ date: 1 });
      res.json(events);
    }
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
});

app.delete('/api/events/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: 'O\'chirildi' });
});

app.post('/api/events/:id/send', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('assignedOperators')
      .populate('assignedEditors')
      .populate('assignedRoninchis')
      .populate('assignedPhotographers');
      
    if (!event) return res.status(404).json({ message: 'Topilmadi' });

    const text = `Ertaga to'y bor!\n\n` +
        `📍 To'yxona: ${event.venue}\n` +
        `🗺 Manzil: ${event.location}\n` +
        `📹 Kamera soni: ${event.cameraCount}\n` +
        `💬 Komment: ${event.comment || "Yo'q"}\n` +
        `🕒 Vaqti: ${new Date(event.date).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n\n` +
        `Iltimos, tayyorgarlik ko'ring!`;

    let sent = 0;
    const allStaff = [
      ...event.assignedOperators,
      ...event.assignedEditors,
      ...event.assignedRoninchis,
      ...event.assignedPhotographers
    ];

    // Remove duplicates if same person is assigned to multiple roles
    const uniqueStaff = Array.from(new Set(allStaff.map(s => s._id.toString())))
      .map(id => allStaff.find(s => s._id.toString() === id));

    for (const op of uniqueStaff) {
        if (op.telegramUsername) {
            await sendUserbotMessage(op.telegramUsername, `🔔 DIQQAT! Eslatma!\n\n` + text);
            sent++;
        }
    }
    
    if (sent === 0) {
      return res.status(400).json({ message: "Hech bir biriktirilgan xodimda Telegram username mavjud emas!" });
    }

    res.json({ message: `${sent} ta xodimga muvaffaqiyatli xabar yuborildi!` });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik yuz berdi' });
  }
});

app.put('/api/events/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const oldEvent = await Event.findById(req.params.id);
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (oldEvent && oldEvent.status !== 'Tayyor' && event.status === 'Tayyor') {
      if (event.clientPhone) {
        const contactName = `${event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning videongiz tayyor bo'ldi! 🎉\nIltimos, Tim Production ofisidan kelib olib keting.`;
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }

    if (oldEvent && oldEvent.status !== 'Topshirildi' && event.status === 'Topshirildi') {
      if (event.clientPhone) {
        const contactName = `${event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning buyurtmangiz muvaffaqiyatli topshirildi! ✅\nBizni tanlaganingiz uchun tashakkur! 🎥✨`;
        if (event.videoLink) {
           msg += `\n\nVideo uchun havola: ${event.videoLink}`;
        }
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

app.put('/api/events/:id/status', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Topilmadi' });
    
    if (req.user.role === 'operator' && !event.assignedOperators.includes(req.user.id)) {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }
    
    const oldStatus = event.status;
    if (req.body.status) event.status = req.body.status;
    if (req.body.videoLink !== undefined) event.videoLink = req.body.videoLink;
    
    await event.save();

    if (oldStatus !== 'Tayyor' && event.status === 'Tayyor') {
      if (event.clientPhone) {
        const contactName = `${event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning videongiz tayyor bo'ldi! 🎉\nIltimos, Tim Production ofisidan kelib olib keting.`;
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }

    if (oldStatus !== 'Topshirildi' && event.status === 'Topshirildi') {
      if (event.clientPhone) {
        const contactName = `${event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning buyurtmangiz muvaffaqiyatli topshirildi! ✅\nBizni tanlaganingiz uchun tashakkur! 🎥✨`;
        if (event.videoLink) {
           msg += `\n\nVideo uchun havola: ${event.videoLink}`;
        }
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

app.put('/api/events/:id/task', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Topilmadi' });
    
    const userId = req.user.id;
    // Check if already completed
    const existingTask = event.completedTasks.find(t => t.userId.toString() === userId);
    if (!existingTask) {
      event.completedTasks.push({ userId, role: req.user.profession || 'operator', completedAt: new Date() });
      await event.save();
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

app.get('/api/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const events = await Event.find();
    const expenses = await Expense.find();
    
    const monthlyStats = {};
    let totalBudget = 0;
    let totalAdvance = 0;
    let totalExpense = 0;
    
    events.forEach(e => {
      totalBudget += e.budget || 0;
      totalAdvance += e.advancePayment || 0;
      
      const month = new Date(e.date).toLocaleString('uz-UZ', { month: 'short', year: 'numeric' });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { month, count: 0, budget: 0, expense: 0, profit: 0 };
      }
      monthlyStats[month].count += 1;
      monthlyStats[month].budget += (e.budget || 0);
    });
    
    expenses.forEach(ex => {
      totalExpense += ex.amount || 0;
      const month = new Date(ex.date).toLocaleString('uz-UZ', { month: 'short', year: 'numeric' });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { month, count: 0, budget: 0, expense: 0, profit: 0 };
      }
      monthlyStats[month].expense += (ex.amount || 0);
    });
    
    // Calculate profit per month
    Object.keys(monthlyStats).forEach(m => {
      monthlyStats[m].profit = monthlyStats[m].budget - monthlyStats[m].expense;
    });
    
    res.json({
      totalEvents: events.length,
      totalBudget,
      totalAdvance,
      totalExpense,
      netProfit: totalBudget - totalExpense,
      debt: totalBudget - totalAdvance,
      monthlyChart: Object.values(monthlyStats)
    });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
});

// EXPENSES ROUTES
app.get('/api/expenses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
});

app.post('/api/expenses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

app.delete('/api/expenses/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "O'chirildi" });
  } catch (error) {
    res.status(400).json({ message: 'Xatolik' });
  }
});

// TELEGRAM CHAT API
app.get('/api/telegram/chat/:phone', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phone } = req.params;
    const messages = await getTelegramMessages(phone, 30); // Oxirgi 30 ta xabar
    res.json(messages);
  } catch (error) {
    console.error("Xabarlarni olish xatosi:", error);
    res.status(500).json({ message: 'Xabarlarni olishda xatolik', details: error.message });
  }
});

app.post('/api/telegram/chat/:phone', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phone } = req.params;
    const { message } = req.body;
    await sendUserbotMessage(phone, message);
    res.json({ success: true });
  } catch (error) {
    console.error("Xabar yuborish xatosi:", error);
    res.status(500).json({ message: 'Xabar yuborishda xatolik', details: error.message });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;

app.get('/api/ping', (req, res) => res.send('pong'));

// Self-ping to prevent Render from sleeping
const https = require('https');
const http = require('http');
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL || 'https://timproduction-crm-backend.onrender.com/api/ping'; 
  const client = url.startsWith('https') ? https : http;
  client.get(url, (resp) => {
    // Consume response data to free up memory
    resp.on('data', () => {});
    resp.on('end', () => console.log('Self-ping success to prevent sleep.'));
  }).on('error', (err) => {
    console.log('Self-ping failed:', err.message);
  });
}, 14 * 60 * 1000); // 14 daqiqa
