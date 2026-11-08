import { Suspense, useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { Skeleton } from "../components/ui/Primitives";
import { useAuth } from "../context/AuthContext";

const COLLAPSE_KEY = "pi.sidebarCollapsed";

const PageFallback = () => (
  <div className="space-y-6" role="status" aria-label="Loading page">
    <Skeleton className="h-8 w-56" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((key) => (
        <Skeleton key={key} className="h-28 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-72 rounded-xl" />
  </div>
);

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1");
      return !value;
    });
  };

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Escape closes mobile drawer and lock body scroll while open
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMobile();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-pop focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 ease-out lg:block ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 animate-fade-in bg-ink-950/60 backdrop-blur-[2px]"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className="relative h-full w-72 max-w-[85vw] animate-fade-in shadow-pop">
            <Sidebar mobile onNavigate={closeMobile} user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ease-out ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-64"
        }`}
      >
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} user={user} onLogout={handleLogout} />

        <main id="main-content" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
