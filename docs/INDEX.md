# 📖 Documentation Index

Welcome to the Talent Acquisition System documentation!

## 🚀 Getting Started

- **[SETUP.md](../SETUP.md)** - Installation & environment setup
- **[DEVELOPMENT.md](../DEVELOPMENT.md)** - Development workflow & debugging
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Code standards & contribution guidelines

## 📋 System Documentation

### Architecture & Design
- [System Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [API Design Patterns](./API_PATTERNS.md)

### Features
- [Authentication & Authorization](./AUTH.md)
- [Resume Parsing](./RESUME_PARSING.md)
- [Candidate Matching Algorithm](./MATCHING_ALGORITHM.md)
- [Risk Prediction Model](./RISK_PREDICTION.md)
- [Interview Module](./INTERVIEW.md)

### Operations & DevOps
- [Deployment Guide](./DEPLOYMENT.md)
- [Docker Configuration](./DOCKER.md)
- [Monitoring & Logging](./MONITORING.md)
- [Scaling & Performance](./SCALING.md)

## 🔗 API Documentation

- **Base URL**: `http://localhost:5000/api`
- **Full API Docs**: See [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)

### Main Endpoints

#### Authentication
```
POST   /auth/register       - Register new user
POST   /auth/login          - User login
POST   /auth/logout         - User logout
POST   /auth/refresh        - Refresh JWT token
```

#### Candidates
```
GET    /candidates          - List all candidates
GET    /candidates/:id      - Get candidate details
PUT    /candidates/:id      - Update candidate profile
POST   /candidates/upload-resume - Upload resume
```

#### Jobs
```
GET    /jobs               - List job vacancies
GET    /jobs/:id           - Get job details
POST   /jobs               - Create job (recruiter only)
PUT    /jobs/:id           - Update job
DELETE /jobs/:id           - Delete job
```

#### Applications
```
GET    /applications       - List applications
POST   /applications       - Submit application
PUT    /applications/:id   - Update application status
GET    /applications/:id   - Get application details
```

#### Interviews
```
GET    /interviews         - List interviews
POST   /interviews         - Schedule interview
PUT    /interviews/:id     - Update interview status
GET    /interviews/:id     - Get interview details
```

#### Analytics & Dashboard
```
GET    /dashboard/stats    - Get dashboard statistics
GET    /dashboard/analytics - Analytics data
GET    /risk/predictions   - Risk prediction data
```

## 💾 Database Documentation

- [Schema Diagram](./diagrams/schema.md)
- [Data Models](./DATABASE.md)
- [Backup & Recovery](./BACKUP.md)

## 🧪 Testing Documentation

- [Testing Strategy](./TESTING.md)
- [Unit Testing Guide](./UNIT_TESTING.md)
- [Integration Testing Guide](./INTEGRATION_TESTING.md)

## 🔐 Security Documentation

- [Security Checklist](./SECURITY.md)
- [Authentication Flow](./AUTH.md)
- [Data Protection](./DATA_PROTECTION.md)

## 📊 Diagrams & Architecture

```
docs/
├── diagrams/
│   ├── system-architecture.png
│   ├── database-schema.png
│   ├── user-flow.png
│   └── deployment-architecture.png
```

## 🆘 Troubleshooting

- [Common Issues](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)
- [Performance Tuning](./PERFORMANCE.md)

## 📞 Support

- **Issues**: Create GitHub issue
- **Questions**: Check FAQ or TROUBLESHOOTING
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Last Updated**: May 2024 | **Version**: 1.0.0
