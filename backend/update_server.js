const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverPath, 'utf8');

// 1. Update notifyOperators
code = code.replace(/const notifyOperators = async \([\s\S]*?};/m, 
`const notifyOperators = async (event, isUpdate = false) => {
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
        let msg = \`🔔 DIQQAT! Sizga eslatma bor!\\n\` +
          \`\${event.eventType || "Nikoh oqshomi"}\\n\` +
          \`\${event.clientName || "Mijoz"}\\n\` +
          \`📍 To'yxona: \${event.venue}\\n\` +
          \`🗺 Manzil: \${event.location}\\n\` +
          \`📹 Kamera soni: \${event.cameraCount || 1}\\n\` +
          \`💬 Komment: \${event.comment || "Yo'q"}\\n\` +
          \`🕒 Vaqti: \${formattedDate}, \${formattedTime}\\n\\n\` +
          \`Iltimos, tayyorgarlik ko'ring!\`;
        sendUserbotMessage(op.telegramUsername, msg, op.fullName);
      }
    }
  } catch (err) {
    console.log('notifyOperators error:', err.message);
  }
};`);

// 2. Update /api/events/:id/send
code = code.replace(/const text = \`Ertaga to'y bor![\s\S]*?tayyorgarlik ko'ring!\`;/, 
`    const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Tashkent' });
    const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
    const text = \`🔔 DIQQAT! Sizga eslatma bor!\\n\` +
      \`\${event.eventType || "Nikoh oqshomi"}\\n\` +
      \`\${event.clientName || "Mijoz"}\\n\` +
      \`📍 To'yxona: \${event.venue}\\n\` +
      \`🗺 Manzil: \${event.location}\\n\` +
      \`📹 Kamera soni: \${event.cameraCount || 1}\\n\` +
      \`💬 Komment: \${event.comment || "Yo'q"}\\n\` +
      \`🕒 Vaqti: \${formattedDate}, \${formattedTime}\\n\\n\` +
      \`Iltimos, tayyorgarlik ko'ring!\`;`);

code = code.replace(/const allStaff = \[[\s\S]*?\];/, 
`const allStaff = [
      ...event.assignedOperators,
      ...event.assignedRoninchis,
      ...event.assignedPhotographers
    ];`);

code = code.replace(/await sendUserbotMessage\(op\.telegramUsername, \`\?\? DIQQAT! Eslatma!\\n\\n\` \+ text\);/, 
`await sendUserbotMessage(op.telegramUsername, text);`);

// 3. Update app.put('/api/events/:id')
code = code.replace(/if \(oldEvent && oldEvent\.status !== 'Topshirildi' && event\.status === 'Topshirildi'\) \{[\s\S]*?notifyOperators\(event, true\);/m, 
`if (oldEvent) {
      if (oldEvent.status !== 'Tayyor' && event.status === 'Tayyor') {
        if (event.clientPhone) {
          const contactName = \`\${event.clientName || 'Mijoz'} \${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}\`;
          let msg = \`Assalomu alaykum, \${event.clientName || 'Mijoz'}! 👋\\n\\nSizning videongiz tayyor bo'ldi! 🎉\\nIltimos, Tim Production ofisidan kelib olib keting.\`;
          sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
        }
      }
      if (oldEvent.status !== 'Topshirildi' && event.status === 'Topshirildi') {
        if (event.clientPhone) {
          const contactName = \`\${event.clientName || 'Mijoz'} \${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}\`;
          let msg = \`Assalomu alaykum, \${event.clientName || 'Mijoz'}! 👋\\n\\nBizni tanlaganingiz uchun tashakkur! 🎥✨\`;
          if (event.videoLink) {
             msg += \`\\n\\nVideo uchun havola: \${event.videoLink}\`;
          }
          sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
        }
      }
    }`); // Notice: Removed notifyOperators(event, true);

// 4. Update app.put('/api/events/:id/status')
code = code.replace(/if \(oldStatus !== 'Topshirildi' && event\.status === 'Topshirildi'\) \{[\s\S]*?res\.json\(event\);/m, 
`if (oldStatus !== 'Tayyor' && event.status === 'Tayyor') {
      if (event.clientPhone) {
        const contactName = \`\${event.clientName || 'Mijoz'} \${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}\`;
        let msg = \`Assalomu alaykum, \${event.clientName || 'Mijoz'}! 👋\\n\\nSizning videongiz tayyor bo'ldi! 🎉\\nIltimos, Tim Production ofisidan kelib olib keting.\`;
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }
    if (oldStatus !== 'Topshirildi' && event.status === 'Topshirildi') {
      if (event.clientPhone) {
        const contactName = \`\${event.clientName || 'Mijoz'} \${new Date(event.date).toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' })}\`;
        let msg = \`Assalomu alaykum, \${event.clientName || 'Mijoz'}! 👋\\n\\nBizni tanlaganingiz uchun tashakkur! 🎥✨\`;
        if (event.videoLink) {
           msg += \`\\n\\nVideo uchun havola: \${event.videoLink}\`;
        }
        sendUserbotMessage(event.clientPhone, msg, contactName).catch(err => console.log('Telegram xabar ketmadi:', err.message));
      }
    }

    res.json(event);`);

// 5. Update Cron job texts and arrays
code = code.replace(/const text = \`Ertaga to'y bor!\\n\\n\` \+[\s\S]*?tayyorgarlik ko'ring!\`;/g, 
`const formattedDate = new Date(event.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Tashkent' });
      const formattedTime = new Date(event.date).toLocaleTimeString('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' });
      const text = \`🔔 DIQQAT! Sizga eslatma bor!\\n\` +
        \`\${event.eventType || "Nikoh oqshomi"}\\n\` +
        \`\${event.clientName || "Mijoz"}\\n\` +
        \`📍 To'yxona: \${event.venue}\\n\` +
        \`🗺 Manzil: \${event.location}\\n\` +
        \`📹 Kamera soni: \${event.cameraCount || 1}\\n\` +
        \`💬 Komment: \${event.comment || "Yo'q"}\\n\` +
        \`🕒 Vaqti: \${formattedDate}, \${formattedTime}\\n\\n\` +
        \`Iltimos, tayyorgarlik ko'ring!\`;`);

code = code.replace(/await sendUserbotMessage\(operator\.telegramUsername, \`\?\? DIQQAT! Eslatma!\\n\\n\` \+ text\);/g, 
`await sendUserbotMessage(operator.telegramUsername, text);`);

code = code.replace(/await sendUserbotMessage\(operator\.telegramChatId, \`\?\? \*Eslatma!\* \` \+ text\);/g, 
`await sendUserbotMessage(operator.telegramChatId, text);`);

// The 24h cron job also needs fixing its allOpIds.
code = code.replace(/const allOpIds = \[[\s\S]*?\];/g, 
`const allOpIds = [
        ...(event.assignedOperators || []),
        ...(event.assignedRoninchis || []),
        ...(event.assignedPhotographers || [])
      ];`);

code = code.replace(/let opMsg = \`⏰ DIQQAT ESLATMA![\s\S]*?Kech qolmang!\`;/g, 
`let opMsg = text;`); // Use the same text for the 24h cron

fs.writeFileSync(serverPath, code);
console.log('server.js updated successfully!');
