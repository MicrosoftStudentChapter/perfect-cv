const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

/**
 * Extract PDF text from URL
 * @param {string} pdfUrl - URL of the resume PDF
 * @returns {Promise<string>} Extracted text from PDF
 */
const extractPdfText = async (pdfUrl) => {
  const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
  const pdfData = await pdfParse(pdfResponse.data);
  return pdfData.text;
};

/**
 * Get ATS score using Google Gemini API
 * @param {string} pdfUrl - URL of the resume PDF
 * @param {string} jobDescription - Job description to compare against
 * @returns {Promise<{geminiScore: number, openaiScore: number, combinedScore: number, feedback: string}>} Combined ATS results
 */
const getATSScore = async (pdfUrl, jobDescription = 'Software developers') => {
  try {
    // Download PDF and extract text
    const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfData = await pdfParse(pdfResponse.data);
    const resumeText = pdfData.text;

    // Get Gemini score
    const geminiScore = await getGeminiScore(resumeText, jobDescription);
    
    // Get OpenAI score via OpenRouter
    const openaiScore = await getOpenRouterScore(resumeText, jobDescription);
    
    // Calculate the combined score
    const combinedScore = Math.round((geminiScore.score + openaiScore.score) / 2);
    
    // Generate comprehensive feedback
    const feedback = generateFeedback(geminiScore, openaiScore, combinedScore);
    
    return {
      geminiScore: geminiScore.score,
      openaiScore: openaiScore.score,
      combinedScore,
      feedback
    };
  } catch (error) {
    console.error('Error getting ATS score:', error);
    throw new Error('Failed to analyze resume with ATS');
  }
};

/**
 * Get ATS score from Gemini API
 * @param {string} resumeText - Text content of the resume
 * @param {string} jobDescription - Job description text
 * @returns {Promise<{score: number, feedback: string}>} Gemini ATS score and feedback
 */
async function getGeminiScore(resumeText, jobDescription) {
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
    return { score: 65, feedback: "Gemini API analysis failed. Please try again later." };
  }
}

/**
 * Get ATS score from OpenRouter API
 * @param {string} resumeText - Text content of the resume
 * @param {string} jobDescription - Job description text
 * @returns {Promise<{score: number, feedback: string}>} OpenAI ATS score and feedback
 */
async function getOpenRouterScore(resumeText, jobDescription) {
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
    return { score: 65, feedback: "OpenAI analysis failed. Please try again later." };
  }
}

/**
 * Generate formatted feedback from both ATS systems
 * @param {object} geminiResult - Gemini API result
 * @param {object} openaiResult - OpenRouter API result
 * @param {number} combinedScore - Combined average score
 * @returns {string} Formatted feedback
 */
function generateFeedback(geminiResult, openaiResult, combinedScore) {
  return `
## ATS Analysis Summary

Combined ATS Score: ${combinedScore}/100

- Gemini Score: ${geminiResult.score}/100
- OpenAI Score: ${openaiResult.score}/100

## Feedback from Gemini:

${geminiResult.feedback}

## Feedback from OpenAI:

${openaiResult.feedback}

## Recommendations:

To improve your ATS score, focus on the common feedback points from both systems.
Ensure your resume includes relevant keywords from the job description and follows
a clean, parsable format that ATS systems can easily read.
  `;
}

module.exports = { getATSScore };