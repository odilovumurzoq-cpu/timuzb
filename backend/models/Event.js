const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  eventType: { type: String, enum: ['To\'y', 'Fotiha', 'Fotosessiya', 'Love Story', 'Boshqa'], default: 'To\'y' },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  venue: { type: String, required: true },
  cameraCount: { type: Number, required: true, default: 1 },
  assignedOperators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedEditors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedRoninchis: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedPhotographers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  clientName: { type: String, default: '' },
  clientPhone: { type: String, default: '' },
  budget: { type: Number, default: 0 },
  advancePayment: { type: Number, default: 0 },
  operatorFee: { type: Number, default: 0 },
  editorFee: { type: Number, default: 0 },
  roninFee: { type: Number, default: 0 },
  photoFee: { type: Number, default: 0 },
  clientRating: { type: Number, default: 0 },
  clientFeedback: { type: String, default: '' },
  album: { type: String, default: '' },
  caseType: { type: String, default: '' },
  status: { type: String, enum: ['Kutilmoqda', 'Syomka qilindi', 'Montajda', 'Tayyor', 'Topshirildi'], default: 'Kutilmoqda' },
  videoLink: { type: String, default: '' },
  comment: { type: String, default: '' },
  notified: { type: Boolean, default: false },
  completedTasks: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    completedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
