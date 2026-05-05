# Getting Started Guide - AI Talent Acquisition System

## Quick Start (5 minutes)

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Start Backend Server
```bash
cd Backend
npm install
npm run dev
```
✅ Backend running on: **http://localhost:3001**

### 2. Start Frontend Server
```bash
cd Frontend
npm install
npm run dev
```
✅ Frontend running on: **http://localhost:5175**

### 3. Access the Application
Open browser: **http://localhost:5175**

---

## User Roles & Workflows

### Role 1: Candidate 🎓

#### Step 1: Register Account
1. Click "Register" on landing page
2. Fill in: Email, Password, Name
3. Select role: **Candidate**
4. Click "Sign Up"

#### Step 2: Upload Resume
1. Navigate to **Profile → Upload Resume**
2. Select your CV file (PDF/DOCX)
3. Click **Upload**
4. **AI automatically extracts**:
   - Personal details
   - Skills
   - Experience
   - Education
   - Professional summary

#### Step 3: Browse & Apply for Jobs
1. Go to **Browse Jobs**
2. View job listings with required skills
3. Click **Apply** on desired position
4. **AI instantly calculates**:
   - Match score (%)
   - Matched skills ✓
   - Missing skills ✗
   - Experience fit
   - Overall fit level

#### Step 4: Complete Interview (If Shortlisted)
1. Receive interview invitation
2. Go to **Interviews → Start Interview**
3. Answer interview questions:
   - Read question
   - Type your answer
   - Click **Next**
4. Submit all answers
5. **AI evaluates**:
   - Technical knowledge
   - Communication clarity
   - Confidence level
   - Overall performance

#### Step 5: Check Dashboard
1. View **My Dashboard**:
   - Applied jobs count
   - Shortlisted positions
   - Interview invitations
   - Skill analysis
   - AI recommendations for improvement

---

### Role 2: Recruiter 👔

#### Step 1: Register Account
1. Click "Register" on landing page
2. Fill in: Email, Password, Company Name
3. Select role: **Recruiter**
4. Click "Sign Up"

#### Step 2: Create Job Posting
1. Go to **Vacancies → Create New**
2. Fill in:
   - Job Title
   - Description
   - Required Skills
   - Experience Level
   - Salary Range
   - Location
3. Click **Post Job**

#### Step 3: Review Applications
1. Go to **Applications** (or Dashboard)
2. See incoming applications from candidates
3. Click on candidate name to view details
4. **View AI Insights**:
   - ✅ Match Score: Shows % match (0-100)
   - 📊 Skill Matching: Matched vs Missing Skills
   - 💼 Experience: Comparison with requirements
   - 📍 Location: Geographic match
   - 📈 Overall Fit: Excellent/Strong/Moderate/Weak/Poor

#### Step 4: Shortlist & Schedule Interview
1. Click **Shortlist** on promising candidates
2. Go to **Interviews → Schedule**
3. Select candidate and date/time
4. Send invitation
5. Candidate receives and completes interview

#### Step 5: View Interview Results
1. After candidate completes interview:
2. Click candidate name → **View Interview Results**
3. **See AI Evaluation**:
   - Technical Score (0-100)
   - Communication Score (0-100)
   - Confidence Score (0-100)
   - Overall Score (0-100)
   - Question-by-question feedback
   - Strengths identified
   - Improvement areas

#### Step 6: Check Risk Prediction
1. Before making final decision:
2. View **Risk Prediction Card**:
   - 🟢 Low Risk: Safe hire
   - 🟡 Medium Risk: Monitor carefully
   - 🔴 High Risk: Consider alternatives
3. See risk factors:
   - Skill gaps
   - Experience mismatch
   - Overqualification concerns
   - Job hopping history
4. Read AI recommendations

#### Step 7: Make Hiring Decision
1. Based on all AI insights:
   - Match Score
   - Interview Results
   - Risk Level
2. Click **Hire** or **Reject**
3. Send offer or rejection email

#### Step 8: Track Dashboard Metrics
1. Go to **Recruiter Dashboard**:
   - Open Positions: Active jobs
   - Total Applications: Received
   - Shortlisted: Under review
   - Hired: Accepted offers
2. View trends and analytics

---

## AI Insights Explained

### 1. Match Score (0-100%)

**What it means**:
- 90-100: Excellent match - Highly recommended
- 70-89: Strong match - Good candidate
- 50-69: Moderate match - Consider
- 30-49: Weak match - May struggle
- 0-29: Poor match - Not suitable

**How it's calculated**:
- Skills Match (40%) - Do they have required skills?
- Experience (30%) - Do they have needed years?
- Education (20%) - Do they have relevant degree?
- Location (10%) - Do they match location?

**Example**:
```
Position: Senior React Developer
Candidate: John (5 years, React, Node.js)

Match Score: 82% (Strong)
- ✅ Has React (required) - 20%
- ✅ Has 5+ years (required 3+) - 30%
- ✅ Has CS degree - 20%
- ❌ Located in different city - 5%
- Missing: Docker, AWS - 7%
→ Overall: 82% Strong Match
```

### 2. Interview Scores

**Technical Score (0-100)**
- Measures: Depth of knowledge, problem-solving, accuracy
- Good: 70+

**Communication Score (0-100)**
- Measures: Clarity, structure, articulation, examples
- Good: 70+

**Confidence Score (0-100)**
- Measures: Conviction, poise, professionalism
- Good: 60+

**Overall Score (0-100)**
- Average of above three scores
- Passing: 70+

---

### 3. Risk Prediction

**Risk Factors**:
1. **Skill Mismatch** - Missing important skills
2. **Experience Gap** - Too junior or too senior
3. **Location Issues** - Long commute, relocation
4. **Overqualification** - May leave for better role
5. **Job Hopping** - Pattern of short tenures

**Attrition Probability**:
- What percentage likelihood they leave within 1 year
- 0-20%: Very stable
- 20-50%: Moderate retention
- 50-100%: High attrition risk

**Prediction Example**:
```
Candidate: Jane Doe
Risk Level: MEDIUM (45/100)

Risk Factors:
1. Skill Mismatch (20) - Missing: Python, Docker
2. Overqualification (15) - 8 years vs required 3
3. Commute (10) - 1 hour daily

Attrition Risk: 45% likely to leave within 1 year
Recommendation: Consider salary raise, growth plan
```

---

## Common Questions

### Q: How accurate are the AI predictions?
**A**: The current system uses smart algorithms based on:
- Skill matching rules
- Experience weight calculations
- Education verification
- Interview response analysis

For 100% accuracy, we can integrate:
- Machine learning models trained on historical hiring data
- NLP for interview analysis
- Behavioral assessment algorithms

### Q: Can I modify the match score?
**A**: The scores are AI-generated for objectivity. However, you can:
- Adjust job requirements to change matching criteria
- Manually override hiring decisions
- Provide feedback to improve AI

### Q: What if a candidate doesn't upload a resume?
**A**: You can manually enter their information:
- Add skills
- Set experience
- Enter education
- Then calculate match score

### Q: Can I export candidate data?
**A**: Currently: View in dashboard and screenshots
- Coming soon: Export to CSV/Excel
- Coming soon: PDF reports

---

## Tips for Best Results

### For Candidates
1. **Upload a detailed resume** - More info = better matching
2. **Add relevant skills** - Be specific and honest
3. **Complete interviews thoroughly** - Quality answers = better scores
4. **Review feedback** - Improve for next opportunities

### For Recruiters
1. **Define clear job requirements** - Better matching = better candidates
2. **Review all AI metrics** - Don't rely on just match score
3. **Schedule interviews** - Verify with actual conversations
4. **Track hiring metrics** - Understand what works best

---

## Troubleshooting

### Problem: "Match score not calculating"
**Solution**: 
- Ensure candidate has uploaded resume
- Check job has required skills listed
- Refresh page and try again

### Problem: "Interview not starting"
**Solution**:
- Check if candidate is shortlisted first
- Ensure interview is scheduled
- Clear browser cache

### Problem: "Can't upload resume"
**Solution**:
- Check file size (max 10MB)
- Supported formats: PDF, DOCX
- Try different file name

### Problem: "Backend connection error"
**Solution**:
- Verify backend is running: `npm run dev` in Backend folder
- Check port 3001 is available
- Restart backend server

---

## API Reference

### Authentication
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John",
  "role": "candidate"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Calculate Match Score
```bash
POST /api/jobs/matching/calculate
{
  "candidateId": "...",
  "jobId": "..."
}

Response:
{
  "matchScore": 82,
  "explanation": {
    "matchedSkills": ["React", "Node.js"],
    "missingSkills": ["Docker", "Kubernetes"],
    "overallFit": "Strong"
  }
}
```

### Submit Interview
```bash
POST /api/interviews/{interviewId}/submit
{
  "answers": [
    {
      "questionIndex": 0,
      "answer": "My answer to question 1",
      "confidence": 8
    }
  ]
}

Response:
{
  "overallScore": 78,
  "scores": {
    "technical": 82,
    "communication": 75,
    "confidence": 77
  }
}
```

### Get Risk Prediction
```bash
POST /api/risk/predict
{
  "candidateId": "...",
  "jobId": "..."
}

Response:
{
  "overallRiskScore": 45,
  "riskLevel": "medium",
  "attritionProbability": 0.45,
  "topRiskFactors": [...]
}
```

---

## Next Steps

1. **Try the system**: Register and complete a full workflow
2. **Invite colleagues**: Have recruiters create accounts
3. **Post jobs**: Create real job postings
4. **Test with candidates**: Have candidates apply
5. **Gather feedback**: What features would help?
6. **Plan enhancements**: Based on usage patterns

---

## Support

- 📧 Email: support@example.com
- 💬 Chat: Available in dashboard
- 📚 Docs: [AI_MODULES_INTEGRATION_SUMMARY.md](AI_MODULES_INTEGRATION_SUMMARY.md)
- 🐛 Report bugs: GitHub Issues

---

**System Ready**: ✅
**Version**: 1.0.0
**Last Updated**: May 5, 2026
