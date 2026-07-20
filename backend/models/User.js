const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'operator'], default: 'operator' },
  professions: [{ type: String, enum: ['operator', 'editor', 'roninchi', 'fotograf'] }],
  fullName: { type: String, required: true },
  telegramId: { type: String, default: null },
  telegramChatId: { type: String, default: null },
  telegramUsername: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
