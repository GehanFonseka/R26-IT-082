# TalentAI - AI-Powered Talent Acquisition System

A modern, production-ready React frontend for an intelligent talent acquisition and recruitment platform powered by AI.

## Features

### 🎯 Core Features
- **AI Matching**: Intelligent candidate-job matching algorithm
- **Interview AI**: AI-powered interview process with real-time analysis
- **Risk Prediction**: Predictive analytics for hiring risks and candidate retention
- **Role-Based Access**: Separate dashboards for Candidates, Recruiters, and Admins

### 📱 User Interfaces
- **Landing Page**: Hero section with features and CTAs
- **Authentication**: Secure login and registration with role selection
- **Candidate Dashboard**: Jobs, applications, interviews, profile management
- **Recruiter Dashboard**: Vacancy management, candidate screening, analytics
- **Admin Dashboard**: User management, system logs, settings

### 🎨 Design
- Clean, modern SaaS UI with glassmorphism design
- Fully responsive (mobile, tablet, desktop)
- Smooth animations with Framer Motion
- Color scheme: Primary #0172B2, Secondary #001645

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts & Analytics**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API

## Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable components (Navbar, Sidebar, Cards, etc.)
│   │   └── dashboard/        # Dashboard components (StatCard, Charts)
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── candidate/        # Candidate pages
│   │   ├── recruiter/        # Recruiter pages
│   │   └── admin/            # Admin pages
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── services/
│   │   └── api.ts            # API integration
│   ├── utils/
│   │   └── helpers.ts        # Utility functions
│   ├── data/
│   │   └── mockData.ts       # Mock data for development
│   ├── App.tsx               # Main app component with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install --legacy-peer-deps
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Test Credentials

The app uses mock authentication. Log in with any credentials and select a role:
- Role: **Candidate**, **Recruiter**, or **Admin**
- Email: any email
- Password: any password

## Components & Features

### Candidate Dashboard
- Browse and search jobs
- Apply to positions
- Track application status
- Schedule/attend interviews
- Manage profile and CV upload

### Recruiter Dashboard
- Create and manage vacancies
- Review and screen candidates
- Schedule interviews
- View hiring analytics
- Track candidate pipeline with AI matching

### Admin Dashboard
- User management
- System logs and monitoring
- Platform settings
- Role management

## Colors & Styling

- Primary: `#0172B2`
- Secondary: `#001645`
- Accent: `#00D4FF`
- Utility Classes: `.card`, `.btn-primary`, `.input-field`, `.badge`

## Production Ready Features

✅ TypeScript for type safety
✅ Responsive design (mobile-first)
✅ Authentication & authorization
✅ Role-based access control
✅ Mock API integration
✅ Charts & analytics
✅ Form validation
✅ Error handling
✅ Loading states
✅ Smooth animations

## Deployment

Ready to deploy to:
- Vercel (`vercel deploy`)
- Netlify (`netlify deploy`)
- Docker containers
- AWS, Azure, GCP

## Development

For issues or feature requests, refer to the project documentation.

---

**Built with modern React patterns and best practices**

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
