const axios = require('axios');
const pdfParse = require('pdf-parse');
const { getGeminiATSScore } = require('./geminiAts');
const { getOpenRouterATSScore } = require('./openrouterAts');

/**
 * Generate formatted feedback from both ATS systems but keep it concise
 * @param {object} geminiResult - Gemini API result
 * @param {object} openaiResult - OpenRouter API result
 * @param {number} combinedScore - Combined average score
 * @returns {string} Formatted feedback
 */
function generateFeedback(geminiResult, openaiResult, combinedScore) {
  return `
## ATS Compatibility Score: ${combinedScore}/100

## Key Recommendations:

${extractMainPoints(geminiResult.feedback, openaiResult.feedback)}
  `;
}

/**
 * Extract main points from AI feedback to keep it concise
 * @param {string} feedback1 - First feedback text
 * @param {string} feedback2 - Second feedback text
 * @returns {string} Concise combined feedback
 */
function extractMainPoints(feedback1, feedback2) {
  // Combine and extract most important points from both feedbacks
  // This is a simplified approach - we're using the first feedback as primary
  // and adding unique insights from the second feedback
  
  // Find bullet points, numbered lists, or key sections from feedback
  const keyPointsRegex = /\n[•\-\*\d]+\s+([^\n]+)/g;
  const keyPoints = new Set();
  
  // Extract points from first feedback
  let match;
  while ((match = keyPointsRegex.exec(feedback1)) !== null) {
    keyPoints.add(match[1].trim());
    if (keyPoints.size >= 4) break; // Limit to top points
  }
  
  // Add unique points from second feedback
  keyPointsRegex.lastIndex = 0; // Reset regex
  while ((match = keyPointsRegex.exec(feedback2)) !== null) {
    const point = match[1].trim();
    if (!containsSimilarPoint(keyPoints, point)) {
      keyPoints.add(point);
      if (keyPoints.size >= 6) break; // Add up to 2 more unique points
    }
  }
  
  // Format as bullet points
  return Array.from(keyPoints).map(point => `• ${point}`).join('\n\n');
}

/**
 * Checks if a collection of points contains something similar to the new point
 * @param {Set} existingPoints - Set of existing points
 * @param {string} newPoint - New point to check
 * @returns {boolean} True if similar point exists
 */
function containsSimilarPoint(existingPoints, newPoint) {
  // Simple check for similar content based on keywords
  const newWords = new Set(newPoint.toLowerCase().split(/\s+/).filter(w => w.length > 4));
  
  for (const existing of existingPoints) {
    const existingWords = existing.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    let matchCount = 0;
    
    for (const word of existingWords) {
      if (newWords.has(word)) matchCount++;
    }
    
    // If 30% of significant words match, consider it similar
    if (matchCount >= existingWords.length * 0.3) return true;
  }
  
  return false;
}

/**
 * Get combined ATS score from multiple providers
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

    // Get scores from both APIs in parallel
    const [geminiResult, openaiResult] = await Promise.all([
      getGeminiATSScore(resumeText, jobDescription),
      getOpenRouterATSScore(resumeText, jobDescription)
    ]);
    
    // Calculate combined score (average)
    let combinedScore = Math.round((geminiResult.score + openaiResult.score) / 2);
    
    // Apply small random reduction for perceived legitimacy
    const reduction = Math.floor(Math.random() * 3) + 1; // Random number between 1-3
    combinedScore = Math.max(1, combinedScore - reduction); // Ensure score doesn't go below 1
    
    // Generate comprehensive feedback
    const feedback = generateFeedback(geminiResult, openaiResult, combinedScore);
    
    return {
      geminiScore: geminiResult.score,
      openaiScore: openaiResult.score,
      combinedScore,
      feedback,
      jobDescription
    };
  } catch (error) {
    console.error('Error getting combined ATS score:', error);
    throw new Error('Failed to analyze resume with ATS: ' + error.message);
  }
};

module.exports = { getATSScore };
