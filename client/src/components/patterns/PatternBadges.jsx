import Icon from "../ui/Icon";
import { CUSTOMER_STATUS, PRODUCT_TREND } from "./patternMeta";

export const StatusBadge = ({ status, size = "sm" }) => {
  const meta = CUSTOMER_STATUS[status];
  if (!meta) return null;

  return (
    <span
      title={meta.help}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset ${meta.className} ${
        size === "lg" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
};

export const TrendBadge = ({ trend }) => {
  const meta = PRODUCT_TREND[trend?.status];
  if (!meta) return null;

  const showChange = trend.changePercent !== null && ["rising", "falling", "steady"].includes(trend.status);

  return (
    <span
      title={
        trend.windowDays
          ? `${trend.unitsRecent} units in the last ${trend.windowDays} days vs ${trend.unitsPrevious} in the ${trend.windowDays} before`
          : undefined
      }
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${meta.className}`}
    >
      <Icon name={meta.icon} className={`h-3 w-3 ${meta.flip ? "-scale-y-100" : ""}`} strokeWidth={2} />
      {meta.label}
      {showChange && (
        <span className="tabular">
          {trend.changePercent > 0 ? "+" : ""}
          {trend.changePercent}%
        </span>
      )}
    </span>
  );
};

// Small horizontal bar for shares/reach (value 0–100)
export const ShareBar = ({ value, className = "w-16" }) => (
  <span className={`inline-block h-1.5 overflow-hidden rounded-full bg-slate-100 align-middle ${className}`} aria-hidden="true">
    <span className="block h-full rounded-full bg-blue-500/80" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
  </span>
);
