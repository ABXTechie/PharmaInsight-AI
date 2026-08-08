import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Customers", path: "/customers" },
    { name: "Medicines", path: "/medicines" },
    { name: "Sales", path: "/sales" },
    { name: "Reports", path: "/reports" },
    { name: "AI", path: "/ai" },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Brand */}
        <NavLink
          to="/dashboard"
          className="text-xl font-bold text-slate-900"
        >
          PharmaInsight <span className="text-blue-600">AI</span>
        </NavLink>

        {/* Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-900"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">
              {user?.name}
            </p>

            <p className="text-xs text-slate-500">
              {user?.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;