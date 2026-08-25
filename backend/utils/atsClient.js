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
  const keyPoints = [];
  
  // Multiple regex patterns to catch various AI output formats
  const patterns = [
    /(?:^|\n)\s*[\u2022\u2023\u25E6\u25AA\u25AB\u2013\u2014•\-\*]\s+(.+)/g,   // Bullet points (•, -, *, etc.)
    /(?:^|\n)\s*\d+[\.\)]\s+(.+)/g,                                           // Numbered lists (1. or 1))
    /(?:^|\n)\s*\*\*(.+?)\*\*/g,                                               // **bold text** lines
    /(?:^|\n)\s*#{1,3}\s+(.+)/g,                                               // Markdown headers
  ];

  function extractFromText(text, maxPoints) {
    const found = [];
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const point = match[1].trim().replace(/\*\*/g, '').replace(/^\*\s*/, '');
        if (point.length > 10 && !containsSimilarPoint(new Set(found), point)) {
          found.push(point);
          if (found.length >= maxPoints) return found;
        }
      }
    }
    return found;
  }

  // Extract from first feedback (primary)
  const points1 = extractFromText(feedback1, 5);
  keyPoints.push(...points1);

  // Extract unique points from second feedback
  const points2 = extractFromText(feedback2, 4);
  for (const point of points2) {
    if (!containsSimilarPoint(new Set(keyPoints), point)) {
      keyPoints.push(point);
      if (keyPoints.length >= 7) break;
    }
  }

  // Fallback: if no structured points were extracted, use raw feedback paragraphs
  if (keyPoints.length === 0) {
    const fallbackLines = (feedback1 + '\n' + feedback2)
      .split('\n')
      .map(l => l.trim().replace(/\*\*/g, '').replace(/^#+\s*/, ''))
      .filter(l => l.length > 20 && !l.toLowerCase().startsWith('score'));
    
    for (const line of fallbackLines) {
      keyPoints.push(line);
      if (keyPoints.length >= 6) break;
    }
  }

  // Format as bullet points
  return keyPoints.map(point => `• ${point}`).join('\n\n');
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
