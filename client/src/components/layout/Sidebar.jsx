import { NavLink } from "react-router-dom";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";
import { navGroups } from "./navigation";
import { initials } from "../../utils/format";

const Sidebar = ({ collapsed, onToggleCollapse, onNavigate, user, onLogout, mobile = false }) => {
  const isCollapsed = collapsed && !mobile;

  return (
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      {/* Brand */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-white/[0.06] ${
          isCollapsed ? "justify-center px-0" : "justify-between px-5"
        }`}
      >
        <NavLink to="/dashboard" onClick={onNavigate} aria-label="PharmaInsight AI home">
          <Logo showText={!isCollapsed} />
        </NavLink>

        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="scroll-dark flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            {isCollapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/[0.08]" aria-hidden="true" />
            ) : (
              <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                {group.label}
              </p>
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onNavigate}
                    title={isCollapsed ? item.name : undefined}
                    aria-label={isCollapsed ? item.name : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition duration-150 ${
                        isCollapsed ? "justify-center px-0" : "px-3"
                      } ${
                        isActive
                          ? "bg-white/[0.07] text-white"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-blue-400"
                            aria-hidden="true"
                          />
                        )}
                        <Icon
                          name={item.icon}
                          className={`h-[18px] w-[18px] shrink-0 ${
                            isActive ? "text-blue-300" : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />
                        {!isCollapsed && (
                          <>
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span className="ml-auto rounded-md bg-mint-500/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-mint-400">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse control (desktop only) */}
      {!mobile && (
        <div className={`px-3 pb-2 ${isCollapsed ? "flex justify-center" : ""}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            className={`flex items-center gap-3 rounded-lg py-2 text-sm text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200 ${
              isCollapsed ? "justify-center px-2" : "w-full px-3"
            }`}
          >
            <Icon name={isCollapsed ? "chevronRight" : "chevronLeft"} className="h-[18px] w-[18px]" />
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* User */}
      <div className="border-t border-white/[0.06] p-3">
        <div className={`flex items-center gap-3 rounded-lg ${isCollapsed ? "flex-col" : "px-2 py-1.5"}`}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-mint-600 text-xs font-semibold text-white"
            title={isCollapsed ? user?.name : undefined}
          >
            {initials(user?.name)}
          </span>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
          >
            <Icon name="logout" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
