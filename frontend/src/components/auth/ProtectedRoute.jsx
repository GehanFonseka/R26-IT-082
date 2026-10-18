import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ roles, accountTypes }) {
  const { user, sessionLoading } = useAuth();
  const location = useLocation();
  if (sessionLoading) return null;
  if (user && ((roles && !roles.includes(user.role)) || (accountTypes && !accountTypes.includes(user.accountType)))) return <Navigate to={user.role === "admin" ? "/admin" : "/jobs"} replace />;
  return user ? <Outlet /> : <Navigate to="/auth" replace state={{ from: location.pathname }} />;
}

export default ProtectedRoute;
