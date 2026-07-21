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
const { initTelegramBot, sendNotification } = require('./telegramBot');
const path = require('path');

const notifyOperators = async (event, isUpdate = false) => {
  try {
    const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Tashkent' });
    const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
    
    // EXCLUDE assignedEditors
    const allOpIds = [
      ...(event.assignedOperators || []),
      ...(event.assignedRoninchis || []),
      ...(event.assignedPhotographers || [])
    ];
    
    if (allOpIds.length === 0) return;
    
    const uniqueOpIds = [...new Set(allOpIds.map(id => id.toString()))];
    const operators = await User.find({ _id: { $in: uniqueOpIds } });
    
    for (const op of operators) {
      if (op.telegramUsername) {
        let msg = `🔔 DIQQAT!\n` +
          `${event.eventType || "Nikoh oqshomi"}\n` +
          `${event.title || event.clientName || "Mijoz"}\n` +
          `🕒 Vaqti: ${formattedDate}, ${formattedTime}\n` +
          `📍 To'yxona: ${event.venue}\n` +
          `🗺 Manzil: ${event.location}\n` +
          `📹 Kamera soni: ${event.cameraCount || 1}\n` +
          `💬 Komment: ${event.comment || "Yo'q"}\n\n` +
          `Iltimos, tayyorgarlik ko'ring!`;
        sendUserbotMessage(op.telegramUsername, msg, op.fullName);
      }
    }
  } catch (err) {
    console.log('notifyOperators error:', err.message);
  }
};

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

// ========== TEMPORARY TELEGRAM AUTH ENDPOINTS ==========
const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

let authClient = null;
let authPhoneCodeHash = null;
let authPhone = null;

app.get('/api/tg-auth/step1', async (req, res) => {
  try {
    const apiId = 39554997;
    const apiHash = "545e97da4cb009d9b68a80b864496af8";
    authPhone = req.query.phone;
    if(!authPhone) return res.send("Nomer kiritilmadi. Misol: /api/tg-auth/step1?phone=+998901234567");
    
    authClient = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
    await authClient.connect();
    
    const result = await authClient.sendCode(
      {
        apiId,
        apiHash
      },
      authPhone
    );
    authPhoneCodeHash = result.phoneCodeHash;
    res.send(`<h1>Kod yuborildi!</h1> Endi brauzerda manzil qatoriga kodni qoshib quyidagicha kiring: <br><br> <b>https://timuzbukhara.onrender.com/api/tg-auth/step2?code=12345</b> <br><br> (12345 o'rniga telegramga kelgan 5 xonali kodni yozasiz)`);
  } catch (err) {
    res.send("Xatolik: " + err.message);
  }
});

app.get('/api/tg-auth/step2', async (req, res) => {
  try {
    const code = req.query.code;
    if(!code) return res.send("Kod kiritilmadi.");
    
    await authClient.invoke(
      new Api.auth.SignIn({
        phoneNumber: authPhone,
        phoneCodeHash: authPhoneCodeHash,
        phoneCode: code,
      })
    );
    const sessionStr = authClient.session.save();
    res.send("<h1>Sessiya kodi tayyor (Nusxalab oling va Renderga qoying):</h1><br><textarea rows=10 cols=80>" + sessionStr + "</textarea><br><p>Keyin ushbu kodni Renderdagi TELEGRAM_SESSION o'rniga saqlang.</p>");
  } catch (err) {
    res.send("Xatolik: " + err.message);
  }
});
// =======================================================

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
cron.schedule('0 * * * *', async () => {
  console.log('Running cron job to check for upcoming events...');
  try {
    const now = new Date();
    const targetDateMin = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const targetDateMax = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingEvents = await Event.find({
      date: { $gte: targetDateMin, $lte: targetDateMax },
      notified: false
    })
    .populate('assignedOperators')
    .populate('assignedRoninchis')
    .populate('assignedPhotographers');

    for (const event of upcomingEvents) {
      const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Tashkent' });
      const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
      const text = `🔔 DIQQAT!\n` +
        `${event.eventType || "Nikoh oqshomi"}\n` +
        `${event.title || event.clientName || "Mijoz"}\n` +
        `🕒 Vaqti: ${formattedDate}, ${formattedTime}\n` +
        `📍 To'yxona: ${event.venue}\n` +
        `🗺 Manzil: ${event.location}\n` +
        `📹 Kamera soni: ${event.cameraCount || 1}\n` +
        `💬 Komment: ${event.comment || "Yo'q"}\n\n` +
        `Iltimos, tayyorgarlik ko'ring!`;

      const allStaff = [
        ...(event.assignedOperators || []),
        ...(event.assignedRoninchis || []),
        ...(event.assignedPhotographers || [])
      ];
      // remove duplicates
      const uniqueStaff = Array.from(new Set(allStaff.map(s => s._id.toString())))
        .map(id => allStaff.find(s => s._id.toString() === id));

      for (const operator of uniqueStaff) {
        if (operator.telegramUsername) {
            await sendUserbotMessage(operator.telegramUsername, text);
        } else if (operator.telegramChatId) {
            await sendUserbotMessage(operator.telegramChatId, text);
        }
      }
      console.log("Cron job finished.");
      event.notified = true;
      await event.save();
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

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
    const newOperator = new User({ username, password: hashedPassword, fullName, telegramUsername, role: 'operator', profession: profession || ['operator'] });
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
    // ❌ Avtomatik xabar yuborilmaydi - admin o'zi "Xabar Yuborish" tugmasi bilan yuboradi
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

    const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Tashkent' });
    const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
    const text = `🔔 DIQQAT!\n` +
      `${event.eventType || "Nikoh oqshomi"}\n` +
      `${event.title || event.clientName || "Mijoz"}\n` +
      `🕒 Vaqti: ${formattedDate}, ${formattedTime}\n` +
      `📍 To'yxona: ${event.venue}\n` +
      `🗺 Manzil: ${event.location}\n` +
      `📹 Kamera soni: ${event.cameraCount || 1}\n` +
      `💬 Komment: ${event.comment || "Yo'q"}\n\n` +
      `Iltimos, tayyorgarlik ko'ring!`;

    let sent = 0;
    const allStaff = [
      ...event.assignedOperators,
      ...event.assignedRoninchis,
      ...event.assignedPhotographers
    ];

    // Remove duplicates if same person is assigned to multiple roles
    const uniqueStaff = Array.from(new Set(allStaff.map(s => s._id.toString())))
      .map(id => allStaff.find(s => s._id.toString() === id));

    for (const op of uniqueStaff) {
        if (op.telegramUsername) {
            await sendUserbotMessage(op.telegramUsername, text);
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

app.post('/api/events/:id/freelancer', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Topilmadi' });

    if (!event.freelancerToken) {
      const crypto = require('crypto');
      event.freelancerToken = crypto.randomBytes(16).toString('hex');
      await event.save();
    }
    
    res.json({ token: event.freelancerToken });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
});

app.get('/api/freelancer/:token', async (req, res) => {
  try {
    const event = await Event.findOne({ freelancerToken: req.params.token });
    if (!event) return res.status(404).json({ message: "Ruxsat yo'q yoki topilmadi" });

    res.json({
      title: event.title,
      eventType: event.eventType,
      date: event.date,
      venue: event.venue,
      location: event.location,
      cameraCount: event.cameraCount,
      status: event.status,
      clientName: event.clientName
    });
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
  }
});

app.post('/api/events/:id/chat', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Topilmadi' });
    
    event.chatMessages.push({
      senderName: req.user.username,
      senderRole: req.user.role,
      text: req.body.text
    });
    
    await event.save();
    res.json(event.chatMessages);
  } catch (error) {
    res.status(500).json({ message: 'Xatolik' });
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
        const contactName = `${event.title || event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning buyurtmangiz muvaffaqiyatli topshirildi! ✅\nBizni tanlaganingiz uchun tashakkur! 🎥✨\n\nSizning fikringiz biz uchun muhim! Iltimos, xizmat sifatini quyidagi havola orqali baholang:\n⭐ https://timuzbukhara.onrender.com/track/${event._id}`;
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
        const contactName = `${event.title || event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning videongiz tayyor bo'ldi! 🎉\nIltimos, Tim Production ofisidan kelib olib keting.`;
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }
    if (oldStatus !== 'Topshirildi' && event.status === 'Topshirildi') {
      if (event.clientPhone) {
        const contactName = `${event.title || event.clientName || 'Mijoz'} ${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        let msg = `Assalomu alaykum, ${event.clientName || 'Mijoz'}! 👋\n\nSizning buyurtmangiz muvaffaqiyatli topshirildi! ✅\nBizni tanlaganingiz uchun tashakkur! 🎥✨\n\nSizning fikringiz biz uchun muhim! Iltimos, xizmat sifatini quyidagi havola orqali baholang:\n⭐ https://timuzbukhara.onrender.com/track/${event._id}`;
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
    let contactName = "Mijoz";
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    const event = await Event.findOne({ clientPhone: { $regex: phone.replace('+', '') } }).sort({ date: -1 });
    if (event) {
      const formattedDate = new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' });
      // Sarlavhadan (kelin/kuyov ismi) olamiz, yo'q bo'lsa clientName
      contactName = `${event.title || event.clientName || 'Mijoz'} ${formattedDate}`;
    }
    const messages = await getTelegramMessages(phone, 30, contactName); // Oxirgi 30 ta xabar
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
    let contactName = "Mijoz";
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone.replace(/\D/g, '');
    const event = await Event.findOne({ clientPhone: { $regex: phone.replace('+', '') } }).sort({ date: -1 });
    if (event) {
      const formattedDate = new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' });
      contactName = `${event.title || event.clientName || 'Mijoz'} ${formattedDate}`;
    }
    await sendUserbotMessage(phone, message, contactName);
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

// 24-hour reminder job
setInterval(async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingEvents = await Event.find({
      date: { $gte: in24Hours, $lt: in25Hours },
      status: { $ne: 'Topshirildi' },
      reminderSent: { $ne: true }
    });

    for (const event of upcomingEvents) {
      const formattedDate = new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      // Notify client
      if (event.clientPhone) {
        const clientDisplayName = event.title || event.clientName || 'Mijoz';
        let msg = `Assalomu alaykum, ${clientDisplayName}!\nTimProduction sizga ertangi tadbiringizni eslatib o'tadi.\n\nTadbir: ${event.eventType}\nVaqt: ${formattedDate}\n\nXizmat ko'rsatuvchilarimiz o'z vaqtida yetib borishadi!`;
        const contactName = `${clientDisplayName} ${formattedDate.split(',')[0]}`;
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(e => console.log('Client reminder error:', e.message));
      }

      // Notify operators
      const allOpIds = [
        ...(event.assignedOperators || []),
        ...(event.assignedRoninchis || []),
        ...(event.assignedPhotographers || [])
      ];
      if (allOpIds.length > 0) {
        const uniqueOpIds = [...new Set(allOpIds.map(id => id.toString()))];
        const operators = await User.find({ _id: { $in: uniqueOpIds } });
        for (const op of operators) {
          if (op.telegramUsername) {
            const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Tashkent' });
            const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
            const text = `🔔 DIQQAT!\n` +
              `${event.eventType || "Nikoh oqshomi"}\n` +
              `${event.title || event.clientName || "Mijoz"}\n` +
              `🕒 Vaqti: ${formattedDate}, ${formattedTime}\n` +
              `📍 To'yxona: ${event.venue}\n` +
              `🗺 Manzil: ${event.location}\n` +
              `📹 Kamera soni: ${event.cameraCount || 1}\n` +
              `💬 Komment: ${event.comment || "Yo'q"}\n\n` +
              `Iltimos, tayyorgarlik ko'ring!`;
            sendUserbotMessage(op.telegramUsername, text, op.fullName).catch(e => console.log('Op reminder error:', e.message));
          }
        }
      }

      event.reminderSent = true;
      await event.save();
    }
  } catch (err) {
    console.log('Reminder error:', err.message);
  }
}, 60 * 60 * 1000); // Check every hour

