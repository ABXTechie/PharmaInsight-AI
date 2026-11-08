import { Link } from "react-router-dom";
import Icon from "./Icon";

/* Page header ---------------------------------------------------------- */
export const PageHeader = ({ eyebrow, title, description, actions, backTo, backLabel }) => (
  <header className="mb-7 animate-fade-in">
    {backTo && (
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        {backLabel}
      </Link>
    )}

    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px] sm:leading-9">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>
        )}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>
);

/* Section card --------------------------------------------------------- */
export const Section = ({ title, description, actions, children, className = "", bodyClassName = "p-5 sm:p-6", as: Tag = "section" }) => (
  <Tag className={`card ${className}`}>
    {(title || actions) && (
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </Tag>
);

/* Alerts --------------------------------------------------------------- */
export const Alert = ({ children, tone = "error", className = "" }) => {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${tones[tone]} ${className}`}
    >
      <Icon name={tone === "error" ? "alert" : "info"} className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

/* Empty state ---------------------------------------------------------- */
export const EmptyState = ({ icon = "package", title, description, action, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-14"}`}>
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
      <Icon name={icon} className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* Skeletons ------------------------------------------------------------ */
export const Skeleton = ({ className = "h-4 w-full" }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const TableSkeleton = ({ rows = 5, label = "Loading" }) => (
  <div className="card divide-y divide-slate-100" role="status" aria-label={label}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center gap-4 px-6 py-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/5" />
        </div>
        <Skeleton className="h-3.5 w-20" />
      </div>
    ))}
    <span className="sr-only">{label}…</span>
  </div>
);

/* KPI card ------------------------------------------------------------- */
export const KpiCard = ({ label, value, icon, hint, loading, accent = "neutral" }) => {
  const accents = {
    brand: "bg-blue-50 text-blue-700 ring-blue-100",
    neutral: "bg-slate-50 text-slate-600 ring-slate-200/70",
  };

  return (
    <div className="card group relative overflow-hidden p-5 transition duration-200 hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {icon && (
          <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 sm:flex ${accents[accent]}`}>
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-8 w-32" />
      ) : (
        <p className="tabular mt-2 truncate text-[26px] font-semibold leading-9 tracking-tight text-slate-900">
          {value}
        </p>
      )}

      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

/* Small stat tile used inside mobile cards ---------------------------- */
export const StatTile = ({ label, children }) => (
  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className="tabular mt-0.5 text-sm font-semibold text-slate-900">{children}</p>
  </div>
);
