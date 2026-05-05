import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/Dashboard';
import { CandidateJobs } from './pages/candidate/Jobs';
import { JobDetails } from './pages/candidate/JobDetails';
import { CandidateApplications } from './pages/candidate/Applications';
import { CandidateProfile } from './pages/candidate/Profile';
import { CandidateInterviews } from './pages/candidate/Interviews';

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/Dashboard';
import { RecruiterVacancies } from './pages/recruiter/Vacancies';
import { RecruiterCandidates } from './pages/recruiter/Candidates';
import { RecruiterInterviews } from './pages/recruiter/Interviews';
import { RecruiterAnalytics } from './pages/recruiter/Analytics';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminUsers } from './pages/admin/Users';
import { AdminLogs } from './pages/admin/Logs';
import { AdminSettings } from './pages/admin/Settings';

interface ProtectedRouteProps {
  element: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return element;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Navbar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // Candidate Routes
  {
    path: '/candidate/dashboard',
    element: (
      <ProtectedRoute
        allowedRoles={['candidate']}
        element={
          <DashboardLayout>
            <CandidateDashboard />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/candidate/jobs',
    element: (
      <ProtectedRoute
        allowedRoles={['candidate']}
        element={
          <DashboardLayout>
            <CandidateJobs />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/candidate/jobs/:id',
    element: (
      <ProtectedRoute
        allowedRoles={['candidate']}
        element={
          <DashboardLayout>
            <JobDetails />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/candidate/applications',
    element: (
      <ProtectedRoute
        allowedRoles={['candidate']}
        element={
          <DashboardLayout>
            <CandidateApplications />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/candidate/profile',
    element: (
      <ProtectedRoute
        allowedRoles={['candidate']}
        element={
          <DashboardLayout>
            <CandidateProfile />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/candidate/interviews',
    element: (
      <ProtectedRoute
        allowedRoles={['candidate']}
        element={
          <DashboardLayout>
            <CandidateInterviews />
          </DashboardLayout>
        }
      />
    ),
  },

  // Recruiter Routes
  {
    path: '/recruiter/dashboard',
    element: (
      <ProtectedRoute
        allowedRoles={['recruiter']}
        element={
          <DashboardLayout>
            <RecruiterDashboard />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/recruiter/vacancies',
    element: (
      <ProtectedRoute
        allowedRoles={['recruiter']}
        element={
          <DashboardLayout>
            <RecruiterVacancies />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/recruiter/candidates',
    element: (
      <ProtectedRoute
        allowedRoles={['recruiter']}
        element={
          <DashboardLayout>
            <RecruiterCandidates />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/recruiter/interviews',
    element: (
      <ProtectedRoute
        allowedRoles={['recruiter']}
        element={
          <DashboardLayout>
            <RecruiterInterviews />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/recruiter/analytics',
    element: (
      <ProtectedRoute
        allowedRoles={['recruiter']}
        element={
          <DashboardLayout>
            <RecruiterAnalytics />
          </DashboardLayout>
        }
      />
    ),
  },

  // Admin Routes
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute
        allowedRoles={['admin']}
        element={
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute
        allowedRoles={['admin']}
        element={
          <DashboardLayout>
            <AdminUsers />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/admin/logs',
    element: (
      <ProtectedRoute
        allowedRoles={['admin']}
        element={
          <DashboardLayout>
            <AdminLogs />
          </DashboardLayout>
        }
      />
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <ProtectedRoute
        allowedRoles={['admin']}
        element={
          <DashboardLayout>
            <AdminSettings />
          </DashboardLayout>
        }
      />
    ),
  },

  // Catch all - redirect to landing
  {
    path: '*',
    element: <Navigate to="/" />,
  },
],
{
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});
