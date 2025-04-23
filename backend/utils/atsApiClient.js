const axios = require('axios');

const getATSScore = async (pdfUrl) => {
  const response = await axios.post('https://api.unified.to/ats/score', {
    resumeUrl: pdfUrl
  }, {
    headers: {
      Authorization: `Bearer ${process.env.UNIFIED_API_KEY}`,
    },
  });
  return response.data.score;
};

module.exports = { getATSScore };