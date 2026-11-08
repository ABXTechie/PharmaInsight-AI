import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";
import { getBreadcrumbs } from "./navigation";
import { initials } from "../../utils/format";

const UserMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full p-0.5 pr-1.5 transition hover:bg-slate-100 sm:pr-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-mint-600 text-xs font-semibold text-white">
          {initials(user?.name)}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:block">
          {user?.name}
        </span>
        <Icon name="chevronDown" className="hidden h-4 w-4 text-slate-400 sm:block" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-64 origin-top-right animate-fade-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Icon name="logout" className="h-4 w-4 text-slate-400" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

const Topbar = ({ onOpenMobileNav, user, onLogout }) => {
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);
  // Sales pages carry their own primary action
  const showRecordSale = !pathname.startsWith("/sales");

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="-ml-1 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
      >
        <Icon name="menu" className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          <li className="hidden text-slate-400 sm:block">Workspace</li>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={crumb.name} className="flex min-w-0 items-center gap-1.5">
                <Icon
                  name="chevronRight"
                  className={`h-3.5 w-3.5 shrink-0 text-slate-300 ${index === 0 ? "hidden sm:block" : ""}`}
                />
                {isLast || !crumb.path ? (
                  <span aria-current="page" className="truncate font-medium text-slate-900">
                    {crumb.name}
                  </span>
                ) : (
                  <NavLink to={crumb.path} className="truncate text-slate-500 transition hover:text-slate-900">
                    {crumb.name}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        {showRecordSale && (
          <Link to="/sales/new" className="btn-primary hidden px-3 sm:inline-flex">
            <Icon name="plus" className="h-4 w-4" />
            Record sale
          </Link>
        )}
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Topbar;
