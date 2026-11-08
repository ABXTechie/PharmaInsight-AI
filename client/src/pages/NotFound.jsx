import { Link } from "react-router-dom";
import Logo from "../components/ui/Logo";
import Icon from "../components/ui/Icon";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <Logo tone="dark" className="mb-12" />

      <p className="eyebrow text-blue-700">Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link to="/dashboard" className="btn-primary mt-8">
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  );
};

export default NotFound;
