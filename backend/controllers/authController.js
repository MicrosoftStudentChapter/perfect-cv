const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/otpMailer');
const { checkEmailInSheet } = require('../utils/verifyGoogleSheet');

const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!(await checkEmailInSheet(email))) return res.status(401).json({ msg: 'Email not authorized. Please contact the administrator.' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await sendMail(email, otp);
  await User.findOneAndUpdate({ email }, { otp }, { upsert: true });
  res.json({ msg: 'OTP sent' });
};

const verifyOtp = async (req, res) => {
  const { email, otp, username } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp) return res.status(401).json({ msg: 'Invalid OTP' });
  user.username = username;
  user.otp = null;
  await user.save();
  
  // Create and sign JWT token
  const token = jwt.sign(
    { id: user._id, email, username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ msg: 'Logged in', token });
};

module.exports = { sendOtp, verifyOtp };