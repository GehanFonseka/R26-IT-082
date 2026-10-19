import { Navigate, Route, Routes } from "react-router-dom";
import CvMatcherPage from "../pages/matching/CvMatcherPage";
import CompanyAdminsPage from "../pages/company/CompanyAdminsPage";
import AuthPage from "../pages/auth/AuthPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ProfilePage from "../pages/profile/ProfilePage";
import AdminJobApplicantsPage from "../pages/admin/AdminJobApplicantsPage";
import ApplicantJobDashboard from "../pages/admin/ApplicantJobDashboard";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminApplicationAnalysisPage from "../pages/admin/AdminApplicationAnalysisPage";
import AdminApplicationSkillsPage from "../pages/admin/AdminApplicationSkillsPage";
import InterviewSchedulingPage from "../pages/admin/InterviewSchedulingPage";
import AdminAttritionPage from "../pages/admin/AdminAttritionPage";
import InterviewResultsPage from "../pages/admin/InterviewResultsPage";
import InterviewResultDetailPage from "../pages/admin/InterviewResultDetailPage";
import CandidateInterviewsPage from "../pages/interviews/CandidateInterviewsPage";
import InterviewRoomPage from "../pages/interviews/LiveKitInterviewRoomPage";
import JobsPage from "../pages/jobs/JobsPage";
import JobApplicationPage from "../pages/jobs/JobApplicationPage";
import JobAnalysisPage from "../pages/jobs/JobAnalysisPage";
import SkillAnalysisPage from "../pages/skill-analysis/SkillAnalysisPage";
import { useAuth } from "../context/AuthContext";

function ProfileEntry() {
  const { user } = useAuth();
  return user?.role === "admin" ? <Navigate to="/admin" replace /> : <ProfilePage />;
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "admin" ? "/admin" : "/jobs"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/matching/*" element={<CvMatcherPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/apply/:jobId" element={<JobApplicationPage />} />
        <Route path="/jobs/analyze/:jobId" element={<JobAnalysisPage />} />
        <Route path="/profile" element={<ProfileEntry />} />
        <Route path="/skill-analysis" element={<SkillAnalysisPage />} />
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboardPage mode="overview" />} />
          <Route path="/admin/jobs" element={<AdminDashboardPage mode="jobs" />} />
          <Route path="/admin/jobs/:jobId" element={<AdminJobApplicantsPage />} />
          <Route path="/admin/jobs/:jobId/applicants/:applicationId" element={<ApplicantJobDashboard />} />
          <Route path="/admin/applications" element={<AdminDashboardPage mode="applications" />} />
          <Route path="/admin/applications/:applicationId/skills" element={<AdminApplicationSkillsPage />} />
          <Route path="/admin/applications/:applicationId" element={<AdminApplicationAnalysisPage />} />
          <Route path="/admin/attrition" element={<AdminAttritionPage />} />
          <Route path="/admin/interviews" element={<InterviewSchedulingPage />} />
          <Route path="/admin/interview-results/:interviewId" element={<InterviewResultDetailPage />} />
          <Route path="/admin/interview-results" element={<InterviewResultsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["admin"]} />}><Route path="/company/admins" element={<CompanyAdminsPage />} /></Route>
        <Route path="/interviews" element={<CandidateInterviewsPage />} />
        <Route path="/interviews/:interviewId" element={<InterviewRoomPage />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default AppRoutes;
