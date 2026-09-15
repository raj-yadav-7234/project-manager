import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContent";

const ProtectedRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;