const axios = require('axios');

/**
 * Get ATS score using OpenRouter API (which can use OpenAI models)
 * @param {string} resumeText - Text content of the resume
 * @param {string} jobDescription - Job description to compare against
 * @returns {Promise<{score: number, feedback: string}>} OpenAI ATS score and feedback
 */
async function getOpenRouterATSScore(resumeText, jobDescription) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',  // You can change this to your preferred model
        messages: [
          {
            role: 'system',
            content: `You are an ATS (Applicant Tracking System) expert. Your job is to analyze resumes and provide 
                     scores on how well they would perform in an ATS system.`
          },
          {
            role: 'user',
            content: `Analyze this resume against the job description for "${jobDescription}". 
                     Provide an ATS compatibility score from 0-100 (where 100 is perfect).
                     Also provide specific, actionable feedback on how to improve the resume for ATS optimization.
                     
                     Job Description:
                     ${jobDescription}
                     
                     Resume:
                     ${resumeText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://perfect-cv.com',  // Replace with your actual domain
          'X-Title': 'Perfect CV ATS Checker'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract score from response
    const scoreMatch = content.match(/score.*?(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70; // Default to 70 if not found
    
    // Normalize score to 0-100 range if needed
    const normalizedScore = Math.min(100, Math.max(0, score));
    
    return {
      score: normalizedScore,
      feedback: content
    };
  } catch (error) {
    console.error('Error getting OpenRouter ATS score:', error);
    return { score: 65, feedback: `OpenAI analysis failed: ${error.response?.data?.error?.message || error.message}` };
  }
}

module.exports = { getOpenRouterATSScore };
