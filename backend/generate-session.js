const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");

const apiId = 39554997;
const apiHash = "545e97da4cb009d9b68a80b864496af8";
const stringSession = new StringSession("");

(async () => {
  console.log("Telegram akkauntga ulanish jarayoni boshlandi...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => await input.text("Iltimos, telefon raqamingizni kiriting (masalan +998880556066): "),
    password: async () => await input.text("Agar akkautda 2-bosqichli (2FA) parol bo'lsa kiriting (bo'lmasa Enter bosing): "),
    phoneCode: async () => await input.text("Telegramga kelgan 5 xonali kodni kiriting: "),
    onError: (err) => console.log(err),
  });
  console.log("\n✅ Muvaffaqiyatli ulandik!");
  console.log("\nSizning TELEGRAM_SESSION kodingiz tayyor. (Buni Render'dagi Environment variables ga qoshasiz):\n");
  console.log(client.session.save());
  process.exit(0);
})();
