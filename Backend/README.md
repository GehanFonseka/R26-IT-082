# AI-Powered Intelligent Talent Acquisition System - Backend

A comprehensive Node.js/Express backend for an AI talent acquisition platform with MongoDB, JWT authentication, resume parsing, AI-powered matching, risk prediction, and interview management.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **Resume Parsing**: pdfparse, mammoth
- **Environment**: dotenv

## Project Structure

```
Backend/
├── config/
│   └── database.js          # MongoDB connection config
├── models/
│   ├── User.js              # User schema with roles
│   ├── CandidateProfile.js  # Candidate profile with skills
│   ├── Vacancy.js           # Job vacancy schema
│   ├── Application.js       # Application tracking
│   ├── Interview.js         # Interview scheduling & evaluation
│   └── RiskPrediction.js    # Risk assessment data
├── controllers/
│   ├── authController.js    # Auth logic (register, login)
│   ├── jobController.js     # Job management
│   ├── applicationController.js # Application tracking
│   ├── candidateController.js   # Candidate profiles
│   ├── interviewController.js   # Interview management
│   ├── riskController.js        # Risk prediction
│   └── dashboardController.js   # Dashboard stats
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   ├── applicationRoutes.js
│   ├── candidateRoutes.js
│   ├── interviewRoutes.js
│   ├── riskRoutes.js
│   └── dashboardRoutes.js
├── middlewares/
│   ├── auth.js              # JWT verification & role-based access
│   ├── errorHandler.js      # Centralized error handling
│   └── upload.js            # File upload configuration
├── services/
│   ├── resumeParserService.js   # PDF/DOCX parsing
│   ├── matchingService.js       # AI candidate-job matching
│   ├── interviewService.js      # Interview evaluation
│   └── riskService.js           # Risk prediction engine
├── utils/
│   └── helpers.js           # Utility functions
├── uploads/                 # Resume file storage
├── .env.example             # Environment template
├── package.json
├── server.js                # Entry point
└── README.md
```

## Installation

1. **Clone and navigate to Backend folder**:
```bash
cd Backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Setup environment**:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

4. **Ensure MongoDB is running**:
```bash
# Local MongoDB should be running on mongodb://localhost:27017
# Or use MongoDB Atlas and update MONGO_URI in .env
```

## Running the Server

### Development (with auto-restart):
```bash
npm run dev
```

### Production:
```bash
npm start
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Jobs
- `POST /api/jobs/create` - Create new vacancy (Recruiter/Admin)
- `GET /api/jobs/all` - Get all open vacancies
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (Recruiter/Admin)
- `DELETE /api/jobs/:id` - Delete job (Recruiter/Admin)

### Applications
- `POST /api/applications/apply` - Apply for job (Candidate)
- `GET /api/applications/all` - Get all applications (Recruiter/Admin)
- `GET /api/applications/candidate/all` - Get candidate's applications
- `PUT /api/applications/:id/status` - Update application status
- `PUT /api/applications/:id/reject` - Reject application

### Candidate Profiles
- `POST /api/candidate/profile` - Create/update profile
- `GET /api/candidate/profile` - Get own profile
- `GET /api/candidate/profile/:userId` - Get user profile
- `POST /api/candidate/resume/upload` - Upload resume

### Interviews
- `POST /api/interviews/start` - Start interview (Candidate)
- `POST /api/interviews/schedule` - Schedule interview (Recruiter/Admin)
- `POST /api/interviews/:interviewId/submit` - Submit answers
- `GET /api/interviews/:interviewId/results` - Get interview results
- `GET /api/interviews/all` - Get all interviews

### Risk Prediction
- `POST /api/risk/predict` - Predict candidate risk
- `GET /api/risk/:id` - Get risk assessment
- `GET /api/risk/all` - Get all risk predictions

### Dashboard
- `GET /api/dashboard/recruiter` - Recruiter statistics
- `GET /api/dashboard/admin` - Admin statistics
- `GET /api/dashboard/candidate` - Candidate statistics

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Candidate, Recruiter, Admin)
- Secure password hashing with bcryptjs

### Candidate Management
- Complete candidate profiles with skills
- Resume upload and parsing (PDF/DOCX)
- Automatic skill extraction from resumes
- Educational background tracking

### Job Management
- Create and manage job vacancies
- Filter by location, job type, experience
- Pagination support
- Applicant tracking

### Application Tracking
- Apply for jobs
- Automatic match scoring
- Application status workflow
- Rejection with reasons

### AI-Powered Features
- **Resume Parsing**: Extract text, skills, experience from PDF/DOCX
- **Smart Matching**: Calculate match scores based on skills, experience, location
- **Risk Prediction**: Identify overqualification, underqualification, skill mismatches
- **Interview Evaluation**: Score technical knowledge, communication, confidence

### Interview Management
- Schedule interviews
- Track interview progress
- Score candidate responses
- Generate interview feedback

### Analytics & Dashboard
- Recruiter dashboard with job statistics
- Admin dashboard with system-wide metrics
- Candidate dashboard with application tracking
- Application status distribution

## Environment Variables

```
MONGO_URI=mongodb://localhost:27017/talent-acquisition
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
PORT=3001
```

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "status": 400,
  "message": "Error description"
}
```

## Security Considerations

1. Always use HTTPS in production
2. Change JWT_SECRET in production
3. Use MongoDB authentication
4. Implement rate limiting
5. Validate all inputs
6. Use CORS appropriately
7. Keep dependencies updated

## Database Schemas

### User
- name, email, password (hashed), role, isActive, lastLogin

### CandidateProfile
- userId, skills[], education, experience, resumeUrl, parsedResume

### Vacancy
- title, description, requiredSkills[], experienceRequired, salary, location, jobType, createdBy

### Application
- candidateId, jobId, status, matchScore, interviewScore, riskScore

### Interview
- candidateId, jobId, status, scheduledAt, questions[], answers[], scores, feedback

### RiskPrediction
- candidateId, jobId, riskLevel, probability, factors[], prediction

## Future Enhancements

- [ ] Email notifications
- [ ] Video interview integration
- [ ] Advanced analytics with charts
- [ ] Candidate recommendations
- [ ] Bulk import/export
- [ ] Workflow automation
- [ ] Background checks integration
- [ ] Mobile app API
- [ ] GraphQL support
- [ ] WebSocket for real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
