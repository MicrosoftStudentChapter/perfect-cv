const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { getATSScore } = require('../utils/atsApiClient');

const handleUpload = async (req, res) => {
  const { email } = req.session.user;
  const fileBuffer = req.file.buffer;
  const cloudinaryUrl = await uploadToCloudinary(fileBuffer);
  const atsScore = await getATSScore(cloudinaryUrl);
  await User.findOneAndUpdate({ email }, { atsScore, cloudinaryUrl });
  res.json({ msg: 'Resume uploaded', atsScore });
};

module.exports = { handleUpload };