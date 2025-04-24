# Perfect CV - Backend

## ATS Checker Feature

### Overview
The ATS (Applicant Tracking System) checker uses both Google Gemini API and OpenRouter API (for OpenAI models) to analyze resumes and provide feedback on how well they would perform against typical ATS systems used by employers. Each user gets 2 ATS checks before final submission.

The system:
1. Calculates scores from both Gemini and OpenAI
2. Provides the average as a combined score
3. Stores comprehensive feedback in the database
4. Maintains a history of ATS checks per user

### Setup

1. Install dependencies:
```
npm install
```

2. Add the following environment variables to your `.env` file:
```
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# OpenRouter API Key (for OpenAI models)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### API Endpoints

#### Upload Resume for ATS Analysis
```
POST /api/resume/upload?atsCheck=true
```
- Headers: 
  - Authorization: Bearer [token]
- Body: 
  - Form-data with key "resume" and your PDF file
  - Optional: key "jobDescription" with text of job description (defaults to "Software developers")

Response:
```json
{
  "msg": "Resume analyzed with ATS",
  "atsScore": 85,
  "geminiScore": 82,
  "openaiScore": 88,
  "atsFeedback": "Detailed feedback from the ATS analysis...",
  "checksRemaining": 1
}
```

#### Final Resume Submission
```
POST /api/resume/upload
```
- Headers: 
  - Authorization: Bearer [token]
- Body: 
  - Form-data with key "resume" and your PDF file

#### Check Remaining ATS Checks
```
GET /api/resume/ats-checks
```
- Headers: 
  - Authorization: Bearer [token]

Response:
```json
{
  "checksRemaining": 2
}
```

#### Get ATS Check History
```
GET /api/resume/ats-history
```
- Headers: 
  - Authorization: Bearer [token]

Response:
```json
{
  "atsCheckHistory": [
    {
      "date": "2023-07-15T10:30:45.123Z",
      "geminiScore": 78,
      "openaiScore": 82,
      "combinedScore": 80,
      "feedback": "Detailed feedback...",
      "jobDescription": "Software developers"
    },
    ...
  ]
}
```

### Feature Feasibility

The current implementation allows each user to check their resume twice before final submission. This should be sufficient for most users to iterate and improve their resume. With 100 users, this would mean a maximum of 200 API calls to each AI provider (Gemini and OpenRouter), which is a reasonable load.

To manage costs:
- Each user is limited to 2 checks
- The system tracks usage per user
- API calls are only made when explicitly requested 

## Implementation Guide

### Step 1: Set Up Environment Variables

Create a `.env` file in the root of your backend directory with the following content:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Database
MONGODB_URI=mongodb://localhost:27017/perfect-cv
# For production, use your MongoDB Atlas URI
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/perfect-cv

# JWT Authentication
JWT_SECRET=your_very_secure_secret_key
JWT_EXPIRY=7d

# Cloudinary Configuration (for resume storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Email Configuration (for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Step 2: Install Required Packages

Make sure you have all required packages installed:

```bash
npm install @google/generative-ai axios cloudinary dotenv express jsonwebtoken mongoose multer pdf-parse
```

### Step 3: Test Your API Keys

Before proceeding with full implementation, test your API keys to make sure they work:

```javascript
// Test Gemini API Key
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const result = await model.generateContent("Test prompt");
console.log(result.response.text());

// Test OpenRouter API Key
const axios = require('axios');
const response = await axios.post(
  'https://openrouter.ai/api/v1/chat/completions',
  {
    model: 'openai/gpt-4o',
    messages: [{ role: 'user', content: 'Test message' }],
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://perfect-cv.com'
    }
  }
);
console.log(response.data);
```

### Step 4: Test with Postman

To test the complete ATS checker flow:

1. Register/Login to get a JWT token
2. Make a request to the ATS check endpoint:

```
POST http://localhost:5000/resume/upload?atsCheck=true
```

Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Body (form-data):
- Key: resume, Value: [Select your PDF resume file]
- Key: jobDescription, Value: Software developers (or your custom job description)

3. View your ATS check history:

```
GET http://localhost:5000/resume/ats-history
```

Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Troubleshooting

1. **API Key Issues**:
   - Make sure both API keys are valid and have necessary permissions
   - For Gemini, verify you have access to the gemini-1.5-pro model

2. **PDF Parsing Issues**:
   - If PDF parsing fails, check if the PDF is text-based (not scanned)
   - Try converting the PDF to text using other tools if needed

3. **Score Extraction Issues**:
   - If scores aren't being extracted correctly, you may need to adjust the regex pattern
   - Default scores (65-70) will be used if extraction fails 