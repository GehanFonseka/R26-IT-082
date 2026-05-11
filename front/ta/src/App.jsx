import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthSession } from './shared/context/AuthSessionContext'
import CandidateWorkspacePage from './members/member_2_resume_parser/CandidateWorkspacePage'
import HrCandidateReviewPage from './members/member_1_attrition_risk/HrCandidateReviewPage'
import HrWorkspacePage from './members/member_3_job_matching/HrWorkspacePage'
import PortalLoginPage from './shared/pages/PortalLoginPage'
import NotFoundPage from './shared/pages/NotFoundPage'

function CandidateOnlyRoute({ children }) {
  const { isAuthenticated } = useAuthSession()
  if (!isAuthenticated('candidate')) {
    return <Navigate to="/candidate" replace />
  }
  return children
}

function HrOnlyRoute({ children }) {
  const { isAuthenticated } = useAuthSession()
  if (!isAuthenticated('hr')) {
    return <Navigate to="/hr" replace />
  }
  return children
}

function PortalRoute({ mode }) {
  const { isAuthenticated } = useAuthSession()
  if (isAuthenticated(mode)) {
    return <Navigate to={mode === 'hr' ? '/hr/dashboard' : '/candidate/dashboard'} replace />
  }
  return <PortalLoginPage portalMode={mode} />
}

function HomeRoute() {
  return <Navigate to="/candidate" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/candidate" element={<PortalRoute mode="candidate" />} />
      <Route
        path="/candidate/jobs/:jobId"
        element={(
          <CandidateOnlyRoute>
            <CandidateWorkspacePage />
          </CandidateOnlyRoute>
        )}
      />
      <Route
        path="/candidate/:section"
        element={(
          <CandidateOnlyRoute>
            <CandidateWorkspacePage />
          </CandidateOnlyRoute>
        )}
      />
      <Route path="/hr" element={<PortalRoute mode="hr" />} />
      <Route
        path="/hr/candidates/:applicationId"
        element={(
          <HrOnlyRoute>
            <HrCandidateReviewPage />
          </HrOnlyRoute>
        )}
      />
      <Route
        path="/hr/:section"
        element={(
          <HrOnlyRoute>
            <HrWorkspacePage />
          </HrOnlyRoute>
        )}
      />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
