import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const isAuthenticated =
    localStorage.getItem("isAuthenticated") === "true";

  const userRole =
    localStorage.getItem("userRole");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRole &&
    userRole !== allowedRole
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;