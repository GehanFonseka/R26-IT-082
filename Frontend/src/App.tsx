import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Candidate Routes */}
      <Route
        path="/candidate/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={['candidate']}
            element={
              <DashboardLayout>
                <CandidateDashboard />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/candidate/jobs"
        element={
          <ProtectedRoute
            allowedRoles={['candidate']}
            element={
              <DashboardLayout>
                <CandidateJobs />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/candidate/jobs/:id"
        element={
          <ProtectedRoute
            allowedRoles={['candidate']}
            element={
              <DashboardLayout>
                <JobDetails />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/candidate/applications"
        element={
          <ProtectedRoute
            allowedRoles={['candidate']}
            element={
              <DashboardLayout>
                <CandidateApplications />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/candidate/profile"
        element={
          <ProtectedRoute
            allowedRoles={['candidate']}
            element={
              <DashboardLayout>
                <CandidateProfile />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/candidate/interviews"
        element={
          <ProtectedRoute
            allowedRoles={['candidate']}
            element={
              <DashboardLayout>
                <CandidateInterviews />
              </DashboardLayout>
            }
          />
        }
      />

      {/* Recruiter Routes */}
      <Route
        path="/recruiter/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={['recruiter']}
            element={
              <DashboardLayout>
                <RecruiterDashboard />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/recruiter/vacancies"
        element={
          <ProtectedRoute
            allowedRoles={['recruiter']}
            element={
              <DashboardLayout>
                <RecruiterVacancies />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/recruiter/candidates"
        element={
          <ProtectedRoute
            allowedRoles={['recruiter']}
            element={
              <DashboardLayout>
                <RecruiterCandidates />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/recruiter/interviews"
        element={
          <ProtectedRoute
            allowedRoles={['recruiter']}
            element={
              <DashboardLayout>
                <RecruiterInterviews />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/recruiter/analytics"
        element={
          <ProtectedRoute
            allowedRoles={['recruiter']}
            element={
              <DashboardLayout>
                <RecruiterAnalytics />
              </DashboardLayout>
            }
          />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={['admin']}
            element={
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute
            allowedRoles={['admin']}
            element={
              <DashboardLayout>
                <AdminUsers />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute
            allowedRoles={['admin']}
            element={
              <DashboardLayout>
                <AdminLogs />
              </DashboardLayout>
            }
          />
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute
            allowedRoles={['admin']}
            element={
              <DashboardLayout>
                <AdminSettings />
              </DashboardLayout>
            }
          />
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
