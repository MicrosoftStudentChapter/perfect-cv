const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { getATSScore } = require('../utils/atsApiClient');

const handleUpload = async (req, res) => {
  try {
    const { email } = req.user;
    const fileBuffer = req.file.buffer;
    const jobDescription = req.body.jobDescription || '';
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Upload resume to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(fileBuffer);
    
    // Check if this is an ATS check request
    const isATSCheck = req.query.atsCheck === 'true';
    
    if (isATSCheck) {
      // Check if user has ATS checks remaining
      if (user.atsChecksRemaining <= 0) {
        return res.status(403).json({
          error: 'No ATS checks remaining',
          message: 'You have used all your available ATS checks'
        });
      }
      
      // Get ATS score and feedback
      const atsResult = await getATSScore(cloudinaryUrl, jobDescription);
      
      // Decrement remaining checks
      await User.findOneAndUpdate(
        { email }, 
        { 
          atsChecksRemaining: user.atsChecksRemaining - 1,
          atsScore: atsResult.score,
          cloudinaryUrl
        }
      );
      
      return res.json({
        msg: 'Resume analyzed with ATS',
        atsScore: atsResult.score,
        atsFeedback: atsResult.feedback,
        checksRemaining: user.atsChecksRemaining - 1
      });
    } else {
      // This is a final submission
      await User.findOneAndUpdate(
        { email }, 
        { cloudinaryUrl }
      );
      
      return res.json({ 
        msg: 'Resume uploaded successfully',
        cloudinaryUrl
      });
    }
  } catch (error) {
    console.error('Error in resume upload:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
};

// Get remaining ATS checks for a user
const getATSChecksRemaining = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ checksRemaining: user.atsChecksRemaining });
  } catch (error) {
    console.error('Error getting ATS checks:', error);
    res.status(500).json({ error: 'Failed to get ATS check information' });
  }
};

module.exports = { handleUpload, getATSChecksRemaining };