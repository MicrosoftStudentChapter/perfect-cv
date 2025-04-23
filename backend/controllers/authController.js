const User = require('../models/User');
const { sendMail } = require('../utils/otpMailer');
const { checkEmailInSheet } = require('../utils/verifyGoogleSheet');

const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!(await checkEmailInSheet(email))) return res.status(401).json({ msg: 'Not authorized' });
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
  req.session.user = { email, username };
  res.json({ msg: 'Logged in' });
};

module.exports = { sendOtp, verifyOtp };