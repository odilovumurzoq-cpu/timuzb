const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const User = require('./models/User');
const Event = require('./models/Event');

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

const getStatusEmoji = (status) => {
  switch (status) {
    case 'Kutilmoqda': return '🟡';
    case 'Syomka qilindi': return '🟣';
    case 'Montajda': return '🔵';
    case 'Tayyor': return '🟢';
    case 'Topshirildi': return '🏁';
    default: return '📌';
  }
};

const getInlineButtons = (eventId, currentStatus, profession) => {
  if (profession === 'editor') {
    return [
      [
        { text: (currentStatus === "Montajda" ? "🔵 [ Montajda ]" : "🔹 Montajda"), callback_data: `status_${eventId}_Montajda` },
        { text: (currentStatus === "Tayyor" ? "🟢 [ Tayyor ]" : "🔸 Tayyor"), callback_data: `status_${eventId}_Tayyor` }
      ],
      [
        { text: (currentStatus === "Topshirildi" ? "🏁 [ Topshirildi ]" : "▫️ Topshirildi"), callback_data: `status_${eventId}_Topshirildi` }
      ]
    ];
  } else {
    return [
      [
        { text: (currentStatus === "Kutilmoqda" ? "🟡 [ Kutilmoqda ]" : "🔸 Kutilmoqda"), callback_data: `status_${eventId}_Kutilmoqda` },
        { text: (currentStatus === "Syomka qilindi" ? "🟣 [ Syomka qilindi ]" : "🔹 Syomka qilindi"), callback_data: `status_${eventId}_Syomka qilindi` }
      ]
    ];
  }
};

const initTelegramBot = () => {
  if (token && token !== 'YOUR_TELEGRAM_BOT_TOKEN') {
    bot = new TelegramBot(token, { polling: true });
    
    bot.on('polling_error', (error) => {
      console.error('⚠️ [TELEGRAM POLLING ERROR]:', error.message || error);
    });

    console.log("🤖 Telegram Bot (@TimProductionBot) faollashdi!");

    const mainMenu = {
      reply_markup: {
        keyboard: [
          [{ text: "🔴 📅 Mening To'ylarim" }, { text: "🟢 👤 Kabinet" }],
          [{ text: "💰 📊 Mening Oyligim" }, { text: "🔵 📞 Boshliq bilan aloqa" }],
          [{ text: "🟡 ℹ️ Ma'lumotnoma" }]
        ],
        resize_keyboard: true,
        persistent: true
      }
    };

    bot.onText(/\/start (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const username = match[1].trim();

      try {
        const user = await User.findOne({ username });
        if (!user) {
          return bot.sendMessage(chatId, "❌ <b>Kechirasiz, bunday foydalanuvchi topilmadi.</b>\nSaytdan berilgan maxsus ulanish linkini tekshirib qaytadan urinib ko'ring.", { parse_mode: 'HTML' });
        }

        user.telegramChatId = chatId.toString();
        await user.save();

        bot.sendMessage(chatId, `🎉 <b>Assalomu alaykum, ${user.fullName}!</b>\n\n✅ <b>Hisobingiz muvaffaqiyatli ulandi!</b>\nEndi barcha syomka vazifalaringizni, to'ylarni va ularning holatini aynan shu bot orqali, chiroyli tugmalar yordamida boshqarishingiz mumkin.\n\nQuyidagi menyudan kerakli bo'limni tanlang: 👇`, { parse_mode: 'HTML', ...mainMenu });
      } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      }
    });
    
    bot.onText(/\/start$/, async (msg) => {
      const user = await User.findOne({ telegramChatId: msg.chat.id.toString() });
      if (user) {
        bot.sendMessage(msg.chat.id, `🌟 <b>TimProduction CRM</b> tizimiga xush kelibsiz, <b>${user.fullName}</b>!\n\nQuyidagi rang-barang menyu orqali o'z vazifalaringizni boshqaring: 👇`, { parse_mode: 'HTML', ...mainMenu });
      } else {
        bot.sendMessage(msg.chat.id, `👋 <b>Assalomu alaykum! TimProduction CRM botiga xush kelibsiz.</b>\n\n⚠️ Tizimdan to'liq foydalanish va to'ylarni ko'rish uchun saytdagi shaxsiy profilingiz orqali berilgan ulanish linkini bosing yoki loginingizni kiriting.\n(Masalan: <code>/start loginingiz</code>)`, { parse_mode: 'HTML', ...mainMenu });
      }
    });

    bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;

      const text = msg.text.trim();

      if (text.includes("Kabinet") || text.includes("Profil")) {
        const user = await User.findOne({ telegramChatId: msg.chat.id.toString() });
        if (user) {
          bot.sendMessage(msg.chat.id, `👤 <b>SHAXSIY KABINET</b>\n\n👑 <b>To'liq ismingiz:</b> ${user.fullName}\n🔗 <b>Tizimdagi loginingiz:</b> @${user.username}\n🛡 <b>Rolingiz:</b> ${user.role.toUpperCase()}\n💼 <b>Kasbingiz:</b> ${(user.profession || 'operator').toUpperCase()}\n\n📡 <i>Bot bilan ulanish holati: Aktiv ✅</i>`, { parse_mode: 'HTML', ...mainMenu });
        } else {
          bot.sendMessage(msg.chat.id, "❌ Siz hali tizimga ulanmagansiz. Sayt orqali ulanish tugmasini bosing.", { parse_mode: 'HTML', ...mainMenu });
        }
      }

      if (text.includes("Boshliq bilan aloqa")) {
        bot.sendMessage(msg.chat.id, `📞 <b>TIM PRODUCTION STUDIYASI</b>\n\nBiron savol, texnik muammo yoki syomka bo'yicha tezkor aloqa kerak bo'lsa, studiya ma'muriyatiga bog'laning:\n\n📱 <b>Telefon:</b> +998 88 055 60 66\n📍 <b>Manzil:</b> Buxoro shahar, Markaziy studiya`, { parse_mode: 'HTML', ...mainMenu });
      }

      if (text.includes("Mening Oyligim") || text.includes("Oyligim")) {
        const user = await User.findOne({ telegramChatId: msg.chat.id.toString() });
        if (user) {
          const isEditor = user.profession === 'editor';
          const isRoninchi = user.profession === 'roninchi';
          const isFotograf = user.profession === 'fotograf';
          
          let events;
          if (isEditor) {
            events = await Event.find({ assignedEditors: user._id });
          } else if (isRoninchi) {
            events = await Event.find({ assignedRoninchis: user._id });
          } else if (isFotograf) {
            events = await Event.find({ assignedPhotographers: user._id });
          } else {
            events = await Event.find({ assignedOperators: user._id });
          }

          const completedEvents = events.filter(e => e.status === 'Topshirildi');
          
          const totalEarned = completedEvents.reduce((sum, e) => sum + (isEditor ? (e.editorFee || 0) : (isRoninchi ? (e.roninFee || 0) : (isFotograf ? (e.photoFee || 0) : (e.operatorFee || 0)))), 0);
          
          bot.sendMessage(msg.chat.id, `💰 <b>Sizning moliyaviy va ish statistikangiz:</b>\n\n💼 <b>Soha:</b> ${(user.profession || 'operator').toUpperCase()}\n📌 <b>Jami qatnashgan loyihalar:</b> ${events.length} ta\n🏁 <b>Topshirilgan (tugagan) loyihalar:</b> ${completedEvents.length} ta\n⏳ <b>Jarayondagi loyihalar:</b> ${events.length - completedEvents.length} ta\n\n💵 <b>ISHLAB TOPILGAN DAROMAD:</b> ${totalEarned.toLocaleString()} UZS\n\n💸 <i>Sizning ishlagan loyihalaringiz soni va oyligingiz studiya rahbari tomonidan xar bir loyiha budjetiga qarab hisoblanadi. Eng zo'rlar qatoridasiz!</i> 🚀`, { parse_mode: 'HTML', ...mainMenu });
        }
      }

      if (text.includes("Ma'lumotnoma")) {
        bot.sendMessage(msg.chat.id, `ℹ️ <b>BOTDAN FOYDALANISH QO'LLANMASI</b>\n\n1️⃣ <b>📅 Mening To'ylarim</b> — Sizga biriktirilgan barcha to'ylar ro'yxatini ko'rish.\n2️⃣ To'y xabarining ostidagi <b>rangli tugmalar</b> orqali syomka jarayonini belgilashingiz mumkin (Kutilmoqda 🟡, Syomka qilindi 🟣, Montajda 🔵, Tayyor 🟢, Topshirildi 🏁).\n3️⃣ Har bir o'zgartirgan holatingiz darhol studiya boshlig'ining saytidagi CRM jadvalida avtomat yangilanadi!`, { parse_mode: 'HTML', ...mainMenu });
      }

      if (text.includes("Mening To'ylarim")) {
        const user = await User.findOne({ telegramChatId: msg.chat.id.toString() });
        if (!user) return bot.sendMessage(msg.chat.id, "❌ Siz hali tizimga ulanmagansiz. Sayt orqali ulanish linkini bosing.");

        const isEditor = user.profession === 'editor';
        const isRoninchi = user.profession === 'roninchi';
        const isFotograf = user.profession === 'fotograf';
        
        let events;
        if (isEditor) {
          events = await Event.find({ assignedEditors: user._id }).sort({ date: 1 });
        } else if (isRoninchi) {
          events = await Event.find({ assignedRoninchis: user._id }).sort({ date: 1 });
        } else if (isFotograf) {
          events = await Event.find({ assignedPhotographers: user._id }).sort({ date: 1 });
        } else {
          events = await Event.find({ assignedOperators: user._id }).sort({ date: 1 });
        }
        
        if (events.length === 0) {
          return bot.sendMessage(msg.chat.id, `☕️ <b>Hozircha sizga biriktirilgan loyihalar yo'q!</b>\n\nYangi loyihalar belgilanishini kuting yoki dam oling 😊`, { parse_mode: 'HTML', ...mainMenu });
        }

        await bot.sendMessage(msg.chat.id, `📋 <b>Sizga biriktirilgan loyihalar ro'yxati: (Jami: ${events.length} ta)</b>\n<i>Holatni o'zgartirish uchun xabar ostidagi rangli tugmalardan birini bosing:</i>`, { parse_mode: 'HTML', ...mainMenu });

        for (const e of events) {
          const dateStr = new Date(e.date).toLocaleString('uz-UZ', { dateStyle: 'full', timeStyle: 'short' });
          const emoji = getStatusEmoji(e.status);
          const mapLink = `https://yandex.com/maps/?text=${encodeURIComponent(e.location)}`;
          const textMsg = `🎉 <b>${e.title.toUpperCase()}</b>\n\n` +
                          `📌 <b>Loyiha turi:</b> ${e.eventType || "To'y"}\n` +
                          `📅 <b>Sana:</b> ${dateStr}\n` +
                          `🏛 <b>O'tkazilish joyi:</b> ${e.venue}\n` +
                          `📍 <b>Manzil:</b> ${e.location} (<a href="${mapLink}">Xaritada ko'rish 🗺</a>)\n` +
                          `📹 <b>Kamera soni:</b> ${e.cameraCount || 1} ta\n` +
                          `💰 <b>Xizmatingiz haqi:</b> ${isEditor ? (e.editorFee || 0) : (isRoninchi ? (e.roninFee || 0) : (isFotograf ? (e.photoFee || 0) : (e.operatorFee || 0)))} UZS\n` +
                          `💬 <b>Izoh/Komment:</b> <i>${e.comment || "Yo'q"}</i>\n\n` +
                          `📊 <b>Hozirgi holat:</b> ${emoji} <b>${e.status}</b>`;
          
          const opts = {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: getInlineButtons(e._id, e.status, user.profession)
            }
          };

          await bot.sendMessage(msg.chat.id, textMsg, opts);
        }
      }
    });

    bot.on('callback_query', async (query) => {
      const data = query.data;
      if (data.startsWith('status_')) {
        const parts = data.split('_');
        const eventId = parts[1];
        const newStatus = parts[2];

        try {
          const event = await Event.findById(eventId);
          if (event) {
            event.status = newStatus;
            await event.save();
            
            const emoji = getStatusEmoji(newStatus);
            bot.answerCallbackQuery(query.id, { text: `${emoji} Holat "${newStatus}" ga yangilandi!`, show_alert: false });
            
            const dateStr = new Date(event.date).toLocaleString('uz-UZ', { dateStyle: 'full', timeStyle: 'short' });
            const mapLink = `https://yandex.com/maps/?text=${encodeURIComponent(event.location)}`;
            const textMsg = `🎉 <b>${event.title.toUpperCase()}</b>\n\n` +
                            `📌 <b>Loyiha turi:</b> ${event.eventType || "To'y"}\n` +
                            `📅 <b>Sana:</b> ${dateStr}\n` +
                            `🏛 <b>O'tkazilish joyi:</b> ${event.venue}\n` +
                            `📍 <b>Manzil:</b> ${event.location} (<a href="${mapLink}">Xaritada ko'rish 🗺</a>)\n` +
                            `📹 <b>Kamera soni:</b> ${event.cameraCount || 1} ta\n` +
                            `💬 <b>Izoh/Komment:</b> <i>${event.comment || "Yo'q"}</i>\n\n` +
                            `📊 <b>Hozirgi holat:</b> ${emoji} <b>${event.status}</b>`;
            
            const user = await User.findOne({ telegramChatId: query.message.chat.id.toString() });
            const opts = {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: getInlineButtons(event._id, event.status, user ? user.profession : 'operator')
              }
            };
            bot.editMessageText(textMsg, opts);
            
            if (newStatus === 'Topshirildi') {
              const admins = await User.find({ role: 'admin' });
              const appUrl = 'http://localhost:5173';
              const link = `${appUrl}/track/${event._id}`;
              const msgToAdmin = `🎉 <b>Montaj yakunlandi!</b>\n\nTo'y: <b>${event.title}</b>\n\n⬇️ Mijozga yuborish uchun tayyor matn (Forward qiling):\n\n🎉 <i>Hurmatli Mijoz! Sizning unutilmas onlaringiz Tim Production jamoasi tomonidan muvaffaqiyatli montaj qilindi! Videoni yuklab olish va o'z fikringizni qoldirish uchun ssilka:</i>\n👉 ${link}\n\nBIZNI TANLAGANINGIZ UCHUN RAXMAT!`;
              admins.forEach(admin => {
                if (admin.telegramChatId) {
                  bot.sendMessage(admin.telegramChatId, msgToAdmin, { parse_mode: 'HTML' });
                }
              });
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    });

  } else {
    // console.log("Telegram bot token not provided. Bot is disabled.");
  }
};

const sendNotification = async (chatId, message) => {
  if (bot && chatId) {
    try {
      await bot.sendMessage(chatId, `🔔 <b>DIQQAT! SYOMKA ESLATMASI!</b>\n\n${message}`, { parse_mode: 'HTML' });
    } catch (error) {
      console.error(`Failed to send message to ${chatId}:`, error);
    }
  }
};

// CRON JOB: Har kuni 09:00 da ertangi to'ylarni eslatish
cron.schedule('0 9 * * *', async () => {
  try {
    console.log("Running daily reminder check...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0,0,0,0));
    const tomorrowEnd = new Date(tomorrow.setHours(23,59,59,999));
    
    const events = await Event.find({
      date: { $gte: tomorrowStart, $lte: tomorrowEnd }
    }).populate('assignedOperators').populate('assignedRoninchis').populate('assignedPhotographers');

    for (const event of events) {
      const allCrew = [...(event.assignedOperators || []), ...(event.assignedRoninchis || []), ...(event.assignedPhotographers || [])];
      for (const op of allCrew) {
        if (op.telegramChatId) {
          const time = new Date(event.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
          const message = `Ertaga soat ${time} da <b>${event.title}</b> loyihasida syomkangiz bor!\n📍 <b>O'tkazilish joyi:</b> ${event.venue}\nManzil: ${event.location}\n\nTayyorgarlik ko'ring! 📸`;
          sendNotification(op.telegramChatId, message);
        }
      }
    }
  } catch (error) {
    console.error("Cron error", error);
  }
});

module.exports = { initTelegramBot, sendNotification };
