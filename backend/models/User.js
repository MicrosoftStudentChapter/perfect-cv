const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  otp: String,
  atsScore: Number,
  cloudinaryUrl: String,
  atsChecksRemaining: { type: Number, default: 2 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);