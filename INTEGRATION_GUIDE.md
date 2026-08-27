# Frontend-Backend Integration Guide

## Overview

This document describes the complete integration between React Frontend and Express Backend for the AI Talent Acquisition System.

## Architecture

```
Frontend (React + Vite)              Backend (Express.js)
http://localhost:5174        ←→     http://localhost:3001
       ↓                                    ↓
  Axios Services              MongoDB Database (Atlas)
  (authService,               (Users, Jobs, Applications,
   jobService, etc.)          Candidates, Interviews, Risk)
```

## Environment Configuration

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Talent Acquisition System
```

### Backend (.env)


## API Services Layer

### 1. Authentication Service (`authService.ts`)
Handles user authentication and session management.

**Key Methods:**
```typescript
// Login
await authService.login(email, password)
// Returns: { token, user }

// Register
await authService.register({ name, email, password, role })
// Returns: { token, user }

// Logout
authService.logout()

// Get current user
authService.getCurrentUser()

// Check if authenticated
authService.isAuthenticated()
```

**Storage:**
- Token: `localStorage.token`
- User: `localStorage.user`

### 2. Job Service (`jobService.ts`)
Manages job vacancies and listings.

**Key Methods:**
```typescript
// Get all jobs
await jobService.getAllJobs(page, limit, search, location, jobType)

// Get job details
await jobService.getJobById(jobId)

// Create job (Recruiter only)
await jobService.createJob(jobData)

// Update job
await jobService.updateJob(jobId, jobData)

// Delete job
await jobService.deleteJob(jobId)
```

### 3. Application Service (`applicationService.ts`)
Handles job applications and application tracking.

**Key Methods:**
```typescript
// Apply for job
await applicationService.applyForJob(jobId)

// Get all applications (Recruiter/Admin)
await applicationService.getApplications(page, limit, candidateId, jobId, status)

// Get candidate's applications
await applicationService.getCandidateApplications()

// Update application status
await applicationService.updateApplicationStatus(appId, status, notes)

// Reject application
await applicationService.rejectApplication(appId, rejectionReason)
```

### 4. Candidate Service (`candidateService.ts`)
Manages candidate profiles and resumes.

**Key Methods:**
```typescript
// Get own profile
await candidateService.getProfile()

// Get other profile
await candidateService.getProfileById(userId)

// Update profile
await candidateService.updateProfile(profileData)

// Upload resume
await candidateService.uploadResume(file)

// Add skill
await candidateService.addSkill(skill)

// Remove skill
await candidateService.removeSkill(skill)
```

### 5. Interview Service (`interviewService.ts`)
Manages interviews and evaluations.

**Key Methods:**
```typescript
// Start interview
await interviewService.startInterview(appId, jobId, questions)

// Schedule interview
await interviewService.scheduleInterview(candidateId, jobId, appId, scheduledAt)

// Submit answers
await interviewService.submitAnswers(interviewId, answers)

// Get results
await interviewService.getInterviewResults(interviewId)

// Get interviews
await interviewService.getInterviews(page, limit, candidateId, jobId, status)
```

### 6. Risk Service (`riskService.ts`)
Provides risk prediction for candidates.

**Key Methods:**
```typescript
// Predict risk
await riskService.predictRisk(candidateId, jobId, appId)

// Get risk details
await riskService.getRiskPrediction(riskId)

// Get all predictions
await riskService.getRiskPredictions(page, limit, candidateId, jobId, riskLevel)

// Get risk color
riskService.getRiskColor(level) // Returns: #10b981 (low), #f59e0b (medium), #ef4444 (high)

// Get risk label
riskService.getRiskLabel(level) // Returns: 'Low Risk', 'Medium Risk', 'High Risk'
```

### 7. Dashboard Service (`dashboardService.ts`)
Role-specific dashboard data.

**Key Methods:**
```typescript
// Recruiter dashboard
await dashboardService.getRecruiterDashboard()
// Returns: { totalJobs, totalApplications, shortlisted, hired, recentJobs }

// Admin dashboard
await dashboardService.getAdminDashboard()
// Returns: { totalUsers, totalJobs, totalApplications, roleCount, applicationStatus }

// Candidate dashboard
await dashboardService.getCandidateDashboard()
// Returns: { applied, shortlisted, interviews, offers, recentApplications }
```

## Authentication Flow

### 1. Login Flow
```
User enters credentials
    ↓
LoginPage calls authService.login(email, password)
    ↓
Backend validates credentials, returns JWT token + user
    ↓
Frontend stores token in localStorage
    ↓
AuthContext updates user state
    ↓
Auto-redirect to role-based dashboard
```

### 2. Authorization
**Every API request automatically includes:**
```
Authorization: Bearer <token>
```

**Axios Interceptor (in axiosConfig.ts):**
- Adds token to Authorization header
- Handles 401 responses (expired token)
- Auto-redirects to login if unauthorized

### 3. Protected Routes
```typescript
<ProtectedRoute
  element={<CandidateDashboard />}
  allowedRoles={['candidate']}
/>
```

Routes check:
1. User exists
2. User role matches allowed roles
3. Token is valid

## Integration Examples

### Example 1: Display Jobs List
```typescript
import jobService from '../services/jobService';

const CandidateJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getAllJobs(1, 10);
        setJobs(data.vacancies);
      } catch (error) {
        console.error('Failed to fetch jobs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div>
      {jobs.map(job => (
        <JobCard key={job._id} job={job} />
      ))}
    </div>
  );
};
```

### Example 2: Apply for Job
```typescript
import applicationService from '../services/applicationService';

const ApplyButton = ({ jobId }) => {
  const handleApply = async () => {
    try {
      await applicationService.applyForJob(jobId);
      alert('Application submitted!');
    } catch (error) {
      alert('Failed to apply: ' + error.message);
    }
  };

  return <button onClick={handleApply}>Apply Now</button>;
};
```

### Example 3: Upload Resume
```typescript
import candidateService from '../services/candidateService';

const ResumeUpload = () => {
  const handleUpload = async (file) => {
    try {
      const result = await candidateService.uploadResume(file);
      console.log('Resume uploaded:', result);
      alert('Resume uploaded successfully!');
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
  };

  return (
    <input 
      type="file"
      onChange={(e) => handleUpload(e.target.files[0])}
    />
  );
};
```

### Example 4: Get Dashboard Data
```typescript
import dashboardService from '../services/dashboardService';

const CandidateDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getCandidateDashboard();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard', error);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div>
      <p>Applied: {stats?.applied}</p>
      <p>Shortlisted: {stats?.shortlisted}</p>
      <p>Interviews: {stats?.interviews}</p>
      <p>Offers: {stats?.offers}</p>
    </div>
  );
};
```

## Error Handling

### Global Error Handling
Axios interceptor in `axiosConfig.ts` handles:
- 401 (Unauthorized) - Clears token and redirects to login
- 400 (Bad Request) - Validation errors
- 500 (Server Error) - Server errors

### Local Error Handling
```typescript
try {
  await authService.login(email, password);
} catch (error: any) {
  const message = error.response?.data?.message || 'Login failed';
  setError(message);
}
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Jobs
- `GET /api/jobs/all` - Get all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/create` - Create job (Recruiter)
- `PUT /api/jobs/:id` - Update job (Recruiter)
- `DELETE /api/jobs/:id` - Delete job (Recruiter)

### Applications
- `POST /api/applications/apply` - Apply for job
- `GET /api/applications/all` - Get all applications (Recruiter)
- `GET /api/applications/candidate/all` - Get candidate's applications
- `PUT /api/applications/:id/status` - Update status
- `PUT /api/applications/:id/reject` - Reject application

### Candidates
- `GET /api/candidate/profile` - Get own profile
- `GET /api/candidate/profile/:userId` - Get other profile
- `POST /api/candidate/profile` - Create/update profile
- `POST /api/candidate/resume/upload` - Upload resume

### Interviews
- `POST /api/interviews/start` - Start interview
- `POST /api/interviews/schedule` - Schedule interview
- `POST /api/interviews/:id/submit` - Submit answers
- `GET /api/interviews/:id/results` - Get results
- `GET /api/interviews/all` - Get all interviews

### Risk
- `POST /api/risk/predict` - Predict risk
- `GET /api/risk/:id` - Get risk details
- `GET /api/risk/all` - Get all predictions

### Dashboard
- `GET /api/dashboard/recruiter` - Recruiter stats
- `GET /api/dashboard/admin` - Admin stats
- `GET /api/dashboard/candidate` - Candidate stats

## Running Both Servers

### Start Backend
```bash
cd Backend
npm run dev
# Server: http://localhost:3001
```

### Start Frontend
```bash
cd Frontend
npm run dev
# Server: http://localhost:5174
```

## Testing the Integration

### Test 1: User Registration
1. Go to http://localhost:5174/register
2. Fill in details
3. Click "Create Account"
4. Should redirect to dashboard

### Test 2: Apply for Job
1. Login as candidate
2. Go to Jobs page
3. Click Apply on a job
4. Should see "Applied" status

### Test 3: View Dashboard
1. Login (any role)
2. Dashboard should load with real data from backend
3. Stats should update dynamically

### Test 4: Upload Resume
1. Login as candidate
2. Go to Profile page
3. Upload a PDF/DOCX file
4. Resume should be saved

## Debugging

### Check Token
```javascript
// In browser console
localStorage.getItem('token')
localStorage.getItem('user')
```

### Check API Response
Use browser DevTools → Network tab to inspect API requests/responses

### Check Backend Logs
```bash
# Terminal where Backend is running
# Should show all API requests
```

## Security Notes

1. **JWT Token**: Stored in localStorage (consider using httpOnly cookies in production)
2. **Password**: Never stored in localStorage
3. **CORS**: Configured for localhost:5174 on backend
4. **API Base URL**: Environment variable - change for production
5. **JWT_SECRET**: Change in production `.env`

## Next Steps

1. ✅ Backend running on port 3001
2. ✅ Frontend running on port 5174
3. ✅ API services configured
4. ✅ Authentication integrated
5. ⏳ Update remaining pages with API calls
6. ⏳ Add real-time notifications
7. ⏳ Implement file upload progress
8. ⏳ Add pagination
9. ⏳ Add search/filter

## Support

For issues:
1. Check API endpoint logs
2. Verify token exists in localStorage
3. Check network requests in DevTools
4. Verify MongoDB connection in Backend
5. Check environment variables
