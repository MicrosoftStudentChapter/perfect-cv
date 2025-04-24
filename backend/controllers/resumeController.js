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
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Upload resume to Cloudinary
  const cloudinaryUrl = await uploadToCloudinary(fileBuffer);
    
    // Update user with new resume URL
    await User.findOneAndUpdate(
      { email }, 
      { cloudinaryUrl }
    );
    
    return res.json({ 
      msg: 'Resume uploaded successfully',
      cloudinaryUrl
    });
  } catch (error) {
    console.error('Error in resume upload:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
};

// Run ATS check on the current resume
const runATSCheck = async (req, res) => {
  try {
    const { email } = req.user;
    const jobDescription = req.body.jobDescription || 'Software developers';
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has a resume
    if (!user.cloudinaryUrl) {
      return res.status(400).json({ 
        error: 'No resume found', 
        message: 'Please upload a resume first' 
      });
    }
    
    // Check if user has ATS checks remaining
    if (user.atsChecksRemaining <= 0) {
      return res.status(403).json({
        error: 'No ATS checks remaining',
        message: 'You have used all your available ATS checks'
      });
    }
    
    // Check if this is the same resume as the last check
    if (user.atsCheckHistory && user.atsCheckHistory.length > 0) {
      const lastCheck = user.atsCheckHistory[user.atsCheckHistory.length - 1];
      
      // If this is the second check (user has 1 check remaining from the initial 2)
      if (user.atsChecksRemaining === 1) {
        // Compare the current resume URL with the one used in the last check
        if (lastCheck.resumeUrl && lastCheck.resumeUrl === user.cloudinaryUrl) {
          return res.status(400).json({
            error: 'Same resume detected',
            message: 'Please upload a different or improved resume before using your final ATS check.'
          });
        }
      }
    }
    
    // Get ATS score and feedback from multiple providers
    const atsResult = await getATSScore(user.cloudinaryUrl, jobDescription);
    
    // Create a new ATS check record
    const atsCheckRecord = {
      date: new Date(),
      geminiScore: atsResult.geminiScore,
      openaiScore: atsResult.openaiScore,
      combinedScore: atsResult.combinedScore,
      feedback: atsResult.feedback,
      jobDescription: atsResult.jobDescription,
      resumeUrl: user.cloudinaryUrl // Store the resume URL with the check for future comparison
    };
    
    // Add ATS check to history and decrement remaining checks
    await User.findOneAndUpdate(
      { email }, 
      { 
        atsChecksRemaining: user.atsChecksRemaining - 1,
        atsScore: atsResult.combinedScore,
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
  } catch (error) {
    console.error('Error in ATS check:', error);
    res.status(500).json({ error: 'Failed to process ATS check' });
  }
};

// Get current resume URL
const getCurrentResume = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email }).select('cloudinaryUrl hasSubmitted');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      cloudinaryUrl: user.cloudinaryUrl,
      hasSubmitted: user.hasSubmitted || false
    });
  } catch (error) {
    console.error('Error getting current resume:', error);
    res.status(500).json({ error: 'Failed to get resume information' });
  }
};

// Get remaining ATS checks for a user
const getATSChecksRemaining = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email }).select('atsChecksRemaining hasSubmitted');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      checksRemaining: user.atsChecksRemaining,
      hasSubmitted: user.hasSubmitted || false
    });
  } catch (error) {
    console.error('Error getting ATS checks:', error);
    res.status(500).json({ error: 'Failed to get ATS check information' });
  }
};

// Final submission of resume
const finalSubmit = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.hasSubmitted) {
      return res.status(400).json({ error: 'You have already submitted your final resume. Cannot submit again.' });
    }
    
    if (!user.cloudinaryUrl) {
      return res.status(400).json({ error: 'No resume found. Please upload a resume first.' });
    }
    
    await User.findOneAndUpdate(
      { email },
      { hasSubmitted: true }
    );
    
    res.json({ 
      msg: 'Final resume submitted successfully',
      success: true
    });
  } catch (error) {
    console.error('Error in final submission:', error);
    res.status(500).json({ error: 'Failed to submit final resume' });
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

module.exports = { 
  handleUpload, 
  runATSCheck,
  getCurrentResume,
  getATSChecksRemaining, 
  finalSubmit,
  getATSCheckHistory
};