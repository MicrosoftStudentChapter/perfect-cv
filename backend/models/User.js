const mongoose = require('mongoose');

const atsCheckSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  geminiScore: Number,
  openaiScore: Number,
  combinedScore: Number,
  feedback: String,
  jobDescription: String
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  otp: String,
  atsScore: Number,
  cloudinaryUrl: String,
  atsChecksRemaining: { type: Number, default: 2 },
  atsCheckHistory: [atsCheckSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);