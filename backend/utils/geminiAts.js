const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Get ATS score using Google Gemini API
 * @param {string} resumeText - Text content of the resume
 * @param {string} jobDescription - Job description text
 * @returns {Promise<{score: number, feedback: string}>} Gemini ATS score and feedback
 */
async function getGeminiATSScore(resumeText, jobDescription) {
  try {
    // Initialize Google Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create prompt for ATS scoring
    const prompt = `
    You are an ATS (Applicant Tracking System) expert. Analyze the following resume and provide:
    1. An ATS compatibility score from 0-100 (where 100 is perfect)
    2. Specific feedback on how to improve the resume for ATS optimization
    3. Key missing keywords or sections
    4. Format and structure issues
    
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Analyze how well the resume matches this specific job description.
    `;

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
    console.error('Error getting Gemini ATS score:', error);
    return { score: 65, feedback: `Gemini API analysis failed: ${error.message}` };
  }
}

module.exports = { getGeminiATSScore };
