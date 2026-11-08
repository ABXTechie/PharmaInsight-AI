import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/ui/Logo";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // Wait until authentication state is restored
  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50"
        role="status"
      >
        <Logo showText={false} tone="dark" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
          <div className="skeleton h-full w-full rounded-full bg-blue-200" />
        </div>
        <p className="text-sm text-slate-500">
          Restoring your session…
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