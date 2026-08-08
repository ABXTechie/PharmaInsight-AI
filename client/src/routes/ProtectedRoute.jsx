import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Wait until authentication state is restored
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">
          Loading...
        </p>
      </div>
    );
  }

  // User is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated
  return <Outlet />;
};

export default ProtectedRoute;