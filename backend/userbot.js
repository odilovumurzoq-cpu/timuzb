const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

let client = null;
let isConnecting = false;

const initUserbot = async () => {
  try {
    const apiId = parseInt(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const sessionStr = process.env.TELEGRAM_SESSION;

    if (!apiId || !apiHash || !sessionStr) {
      // console.log("Userbot yopiq: API_ID, API_HASH yoki SESSION yo'q.");
      return;
    }

    if (isConnecting) return;
    isConnecting = true;

    const stringSession = new StringSession(sessionStr);
    client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 1000,
      useWSS: false,
    });

    await client.connect();
    isConnecting = false;
    console.log("✅ Userbot muvaffaqiyatli ulandi! Endi xabarlar sizning nomingizdan ketadi.");
  } catch (err) {
    isConnecting = false;
    console.error("❌ Userbot ulanishida xatolik (Avto-qayta ulanish kutilmoqda):", err.message || err);
  }
};

const sendUserbotMessage = async (username, message, contactName = "Mijoz") => {
  try {
    if (!client || !client.connected) {
      console.log("⚠️ Userbot ulanmagan yoki uzilgan. Qayta ulanmoqda...");
      await initUserbot();
    }

    if (!client || !client.connected) {
      console.log("❌ Qayta ulanib bo'lmadi. Xabar yuborilmadi.");
      return;
    }

    let target = username.trim();
    if (target.includes('t.me/')) target = target.split('t.me/')[1];
    if (target.includes('telegram.me/')) target = target.split('telegram.me/')[1];
    if (!target.startsWith('@') && !target.startsWith('+')) {
      target = target.match(/^\d+$/) ? '+' + target : '@' + target;
    }
    
    try {
      await client.sendMessage(target, { message });
    } catch (err) {
      if (err.message && err.message.includes("Cannot find any entity") && target.startsWith('+')) {
        console.log(`⚠️ Kontakt topilmadi. Avval kontaktga qo'shilmoqda: ${target}`);
        await client.invoke(
          new Api.contacts.ImportContacts({
            contacts: [
              new Api.InputPhoneContact({
                clientId: BigInt(Math.floor(Math.random() * 10000000)),
                phone: target,
                firstName: contactName,
                lastName: ""
              })
            ]
          })
        );
        // Retry
        await client.sendMessage(target, { message });
      } else {
        throw err;
      }
    }
    console.log(`✅ Xabar muvaffaqiyatli yuborildi -> ${target}`);
  } catch (err) {
    console.error(`❌ Xabar yuborishda xatolik (${username}):`, err.message || err);
    // Agar ulanish uzilgan bo'lsa, qayta ulanishni harakat qildiramiz
    if (err.message && (err.message.includes("disconnect") || err.message.includes("connection") || err.message.includes("socket"))) {
      try {
        await initUserbot();
      } catch (e) {}
    }
  }
};

const getTelegramMessages = async (usernameOrPhone, limit = 50, contactName = "Mijoz") => {
  try {
    if (!client || !client.connected) {
      await initUserbot();
    }
    let target = usernameOrPhone.trim();
    if (target.includes('t.me/')) target = target.split('t.me/')[1];
    if (target.includes('telegram.me/')) target = target.split('telegram.me/')[1];
    if (!target.startsWith('@') && !target.startsWith('+')) {
      target = target.match(/^\d+$/) ? '+' + target : '@' + target;
    }
    
    try {
      const messages = await client.getMessages(target, { limit: limit });
      return messages.map(m => ({
        id: m.id,
        text: m.message,
        out: m.out,
        date: m.date,
        senderId: m.senderId ? m.senderId.toString() : null
      }));
    } catch (err) {
      if (err.message && err.message.includes("Cannot find any entity") && target.startsWith('+')) {
        console.log(`⚠️ Kontakt topilmadi. Avval kontaktga qo'shilmoqda: ${target}`);
        const result = await client.invoke(
          new Api.contacts.ImportContacts({
            contacts: [
              new Api.InputPhoneContact({
                clientId: BigInt(Math.floor(Math.random() * 10000000)),
                phone: target,
                firstName: contactName,
                lastName: ""
              })
            ]
          })
        );
        
        let newTarget = target;
        if (result && result.users && result.users.length > 0) {
          newTarget = result.users[0].id;
        }

        // Retry
        const messages = await client.getMessages(newTarget, { limit: limit });
        return messages.map(m => ({
          id: m.id,
          text: m.message,
          out: m.out,
          date: m.date,
          senderId: m.senderId ? m.senderId.toString() : null
        }));
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(`❌ Xabarlarni olishda xatolik (${usernameOrPhone}):`, err.message || err);
    throw err;
  }
};

const createWeddingGroup = async (title, clientPhone, contactName, operatorUsernames) => {
  try {
    if (!client || !client.connected) {
      await initUserbot();
    }
    
    // Import client to contacts first
    let clientTarget = clientPhone.match(/^\d+$/) ? '+' + clientPhone : clientPhone;
    await client.invoke(
      new Api.contacts.ImportContacts({
        contacts: [
          new Api.InputPhoneContact({
            clientId: BigInt(Math.floor(Math.random() * 10000000)),
            phone: clientTarget,
            firstName: contactName,
            lastName: ""
          })
        ]
      })
    );

    // Prepare users list (operators + client)
    let users = operatorUsernames.filter(u => u).map(u => {
      let un = u.trim();
      if (!un.startsWith('@')) un = '@' + un;
      return un;
    });
    users.push(clientTarget);

    const result = await client.invoke(new Api.messages.CreateChat({
        users: users,
        title: title
    }));

    if (result && result.chats && result.chats.length > 0) {
      const chatId = result.chats[0].id;
      console.log(`✅ Guruh yaratildi: ${title} (ID: ${chatId})`);
      return chatId.toString();
    }
    return null;
  } catch (err) {
    console.error(`❌ Guruh yaratishda xatolik:`, err.message || err);
    return null;
  }
};

const kickUserFromGroup = async (chatId, username) => {
  try {
    if (!client || !client.connected) {
      await initUserbot();
    }
    
    let target = username.trim();
    if (!target.startsWith('@')) target = '@' + target;

    await client.invoke(new Api.messages.DeleteChatUser({
        chatId: BigInt(chatId),
        userId: target
    }));
    console.log(`✅ ${target} guruhdan chiqarildi (ChatID: ${chatId})`);
    return true;
  } catch (err) {
    console.error(`❌ Guruhdan chiqarishda xatolik (${username}):`, err.message || err);
    return false;
  }
};


const deleteWeddingGroup = async (chatId) => {
  try {
    if (!client || !client.connected) {
      await initUserbot();
    }
    await client.invoke(new Api.messages.DeleteChat({
        chatId: BigInt(chatId)
    }));
    console.log('✅ Guruh ochirildi (ChatID: ' + chatId + ')');
    return true;
  } catch (err) {
    console.error('❌ Guruhni ochirishda xatolik:', err.message || err);
    return false;
  }
};

module.exports = { initUserbot, sendUserbotMessage, getTelegramMessages, createWeddingGroup, kickUserFromGroup, deleteWeddingGroup };
