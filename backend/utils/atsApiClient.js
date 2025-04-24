const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

/**
 * Get ATS score using Google Gemini API
 * @param {string} pdfUrl - URL of the resume PDF
 * @param {string} jobDescription - Optional job description to compare against
 * @returns {Promise<{score: number, feedback: string}>} ATS score and feedback
 */
const getATSScore = async (pdfUrl, jobDescription = '') => {
  try {
    // Get PDF content
    const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfData = await pdfParse(pdfResponse.data);
    const resumeText = pdfData.text;

    // Initialize Google Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create prompt for ATS scoring
    let prompt = `
    You are an ATS (Applicant Tracking System) expert. Analyze the following resume and provide:
    1. An ATS compatibility score from 0-100 (where 100 is perfect)
    2. Specific feedback on how to improve the resume for ATS optimization
    3. Key missing keywords or sections
    4. Format and structure issues
    
    Resume:
    ${resumeText}
    `;
    
    // Add job description comparison if provided
    if (jobDescription) {
      prompt += `
      Job Description:
      ${jobDescription}
      
      Additionally, analyze how well the resume matches this specific job description.
      `;
    }

    // Get response from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract score from response (this pattern matching may need refinement)
    const scoreMatch = responseText.match(/score.*?(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70; // Default to 70 if not found
    
    // Normalize score to 0-100 range if needed
    const normalizedScore = Math.min(100, Math.max(0, score));
    
    return {
      score: normalizedScore,
      feedback: responseText
    };
  } catch (error) {
    console.error('Error getting ATS score:', error);
    throw new Error('Failed to analyze resume with ATS');
  }
};

module.exports = { getATSScore };