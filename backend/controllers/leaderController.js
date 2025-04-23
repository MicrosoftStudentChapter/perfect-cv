const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  const topUsers = await User.find({ atsScore: { $ne: null } })
    .sort({ atsScore: -1 })
    .select('username atsScore -_id')
    .limit(10);
  res.json(topUsers);
};

module.exports = { getLeaderboard };