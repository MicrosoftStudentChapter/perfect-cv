const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { getATSScore } = require('../utils/atsClient');

const handleUpload = async (req, res) => {
  try {
    const { email } = req.user;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No resume file uploaded', 
        message: 'Please upload a resume file (PDF format)' 
      });
    }
    
    const fileBuffer = req.file.buffer;
    const jobDescription = req.body.jobDescription || 'Software developers';
    
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
      
      // Get ATS score and feedback from multiple providers
      const atsResult = await getATSScore(cloudinaryUrl, jobDescription);
      
      // Create a new ATS check record
      const atsCheckRecord = {
        date: new Date(),
        geminiScore: atsResult.geminiScore,
        openaiScore: atsResult.openaiScore,
        combinedScore: atsResult.combinedScore,
        feedback: atsResult.feedback,
        jobDescription: atsResult.jobDescription
      };
      
      // Add ATS check to history and decrement remaining checks
      await User.findOneAndUpdate(
        { email }, 
        { 
          atsChecksRemaining: user.atsChecksRemaining - 1,
          atsScore: atsResult.combinedScore,
          cloudinaryUrl,
          $push: { atsCheckHistory: atsCheckRecord }
        }
      );
      
      return res.json({
        msg: 'Resume analyzed with ATS',
        atsScore: atsResult.combinedScore,
        geminiScore: atsResult.geminiScore,
        openaiScore: atsResult.openaiScore,
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

// Get ATS check history for a user
const getATSCheckHistory = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email }).select('atsCheckHistory');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ atsCheckHistory: user.atsCheckHistory || [] });
  } catch (error) {
    console.error('Error getting ATS check history:', error);
    res.status(500).json({ error: 'Failed to get ATS check history' });
  }
};

module.exports = { handleUpload, getATSChecksRemaining, getATSCheckHistory };