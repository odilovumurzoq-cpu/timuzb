const axios = require('axios');

/**
 * SMS jo'natish funksiyasi (Android SMS Gateway uchun)
 * @param {string} phone - Qabul qiluvchi raqam (masalan: +998901234567)
 * @param {string} message - SMS matni
 */
const sendSMS = async (phone, message) => {
  try {
    // .env dan SMS Gateway ma'lumotlarini olish (masalan, SMS Gateway API ilovasidan)
    const gatewayUrl = process.env.SMS_GATEWAY_URL; // misol: http://192.168.1.100:8080/v1/sms/send
    const gatewayToken = process.env.SMS_GATEWAY_TOKEN; // agar API kalit kerak bo'lsa
    
    if (!gatewayUrl) {
      console.log('⚠️ [SMS] SMS_GATEWAY_URL sozlanmagan. SMS yuborilmadi:', phone, message);
      return;
    }

    let fromNumber = null;
    
    // InfiniReach talabiga binoan "from" (jo'natuvchi) raqamini olishimiz kerak
    if (gatewayUrl.includes('infinireach.io')) {
      try {
        const devs = await axios.get('https://api.infinireach.io/api/v1/devices', {
          headers: { 'X-API-Key': gatewayToken }
        });
        if (devs.data && devs.data.devices && devs.data.devices[0] && devs.data.devices[0].simSlots && devs.data.devices[0].simSlots[0]) {
          fromNumber = devs.data.devices[0].simSlots[0].phoneNumber;
        }
      } catch (err) {}
    }

    // InfiniReach / SMS Relay API formati
    const payload = {
      phone: phone,      // Eski versiya uchun
      to: phone,         // InfiniReach API uchun
      message: message,
      text: message,     // Boshqa turlari uchun
      channel: "sms"
    };
    
    if (fromNumber) {
      payload.from = fromNumber;
    }

    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (gatewayToken) {
      // Har xil auth turlarini qo'shib yuboramiz (qaysi biri ishlasa)
      headers['Authorization'] = `Bearer ${gatewayToken}`;
      headers['X-API-Key'] = gatewayToken;
    }

    console.log(`[SMS] Yuborilmoqda: ${gatewayUrl}`);

    await axios.post(gatewayUrl, payload, { headers });
    console.log(`✅ [SMS] ${phone} raqamiga xabar muvaffaqiyatli yuborildi.`);
  } catch (err) {
    console.error(`❌ [SMS] Xatolik (${phone}):`, err.message || err);
    if (err.response && err.response.data) {
      console.error(`❌ [SMS] Server javobi:`, err.response.data);
    }
  }
};

module.exports = { sendSMS };
