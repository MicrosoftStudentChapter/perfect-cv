# Perfect CV - Backend

## ATS Checker Feature

### Overview
The ATS (Applicant Tracking System) checker uses Google Gemini API to analyze resumes and provide feedback on how well they would perform against typical ATS systems used by employers. Each user gets 2 ATS checks before final submission.

### Setup

1. Install dependencies:
```
npm install
```

2. Add the following environment variables to your `.env` file:
```
# Google Gemini API Key (required for ATS checking)
GEMINI_API_KEY=your_gemini_api_key
```

### API Endpoints

#### Upload Resume with ATS Check
```
POST /api/resume/upload?atsCheck=true
```
- Headers: 
  - Authorization: Bearer [token]
- Body: 
  - resume: [PDF file]
  - jobDescription: [optional] Job description text to compare against

Response:
```json
{
  "msg": "Resume analyzed with ATS",
  "atsScore": 85,
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
  - resume: [PDF file]

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

### Feature Feasibility

The current implementation allows each user to check their resume twice before final submission. This should be sufficient for most users to iterate and improve their resume. With 100 users, this would mean a maximum of 200 API calls to Gemini, which is a reasonable load.

To manage costs:
- Each user is limited to 2 checks
- The system tracks usage per user
- API calls are only made when explicitly requested 