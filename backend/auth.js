const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
require("dotenv").config();

const apiId = 34837536; // user provided
const apiHash = "d60a3e17713c83845c447d32e2c9f51d"; // user provided
const stringSession = new StringSession("");

(async () => {
  console.log("Qabul qilinayotgan API ID:", apiId);
  console.log("Iltimos kuting, Telegramga ulanmoqdamiz...");

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Telegram raqamingizni kiriting (+998901234567 formatida): "),
    password: async () => await input.text("2-bosqichli parol (agar bo'lsa, bo'lmasa bo'sh qoldiring): "),
    phoneCode: async () => await input.text("Telegramga kelgan 5 xonali kodni kiriting: "),
    onError: (err) => console.log(err),
  });

  console.log("\n✅ TABRIKLAYMIZ! Siz tizimga muvaffaqiyatli ulandingiz!");
  console.log("\n================ KODINGIZ ===================");
  console.log(client.session.save());
  console.log("===============================================\n");
  console.log("Tepadagi uzun kodni nusxalab, .env fayliga TELEGRAM_SESSION=kodingiz deb saqlang yoki dasturchiga yuboring.");
  
  process.exit();
})();
