import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { Skeleton } from "../ui/Primitives";

const TONE = {
  risk: {
    high: { icon: "alert", chip: "bg-red-50 text-red-600 ring-red-100", label: "Needs action" },
    medium: { icon: "alert", chip: "bg-amber-50 text-amber-700 ring-amber-100", label: "Watch" },
    low: { icon: "info", chip: "bg-slate-50 text-slate-500 ring-slate-200", label: "Note" },
  },
  opportunity: { icon: "trend", chip: "bg-blue-50 text-blue-700 ring-blue-100", label: "Opportunity" },
  info: { icon: "rupee", chip: "bg-slate-50 text-slate-500 ring-slate-200", label: "Note" },
};

const toneFor = (item) =>
  item.tone === "risk" ? TONE.risk[item.severity] || TONE.risk.medium : TONE[item.tone] || TONE.info;

const linkFor = (item) => {
  if (item.customerId) return `/customers/${item.customerId}`;
  if (item.productId) return `/products/${item.productId}`;
  return null;
};

/**
 * Ranked feed of pattern signals. Each row links to the customer or product
 * it is about. Messages are generated server-side from real sales figures.
 */
const AttentionList = ({
  items,
  loading,
  limit,
  emptyText = "Nothing needs attention right now.",
  getLink = linkFor, // override on detail pages to avoid linking to the current page
}) => {
  if (loading) {
    return (
      <div className="divide-y divide-slate-100" role="status" aria-label="Loading patterns">
        {[0, 1, 2].map((key) => (
          <div key={key} className="flex gap-3 px-5 py-4 sm:px-6">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visible = limit ? items.slice(0, limit) : items;

  if (!visible.length) {
    return (
      <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500 sm:px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon name="shield" className="h-4 w-4" />
        </span>
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {visible.map((item) => {
        const tone = toneFor(item);
        const href = getLink(item);
        const body = (
          <>
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${tone.chip}`}>
              <Icon name={tone.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                  {tone.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>
            </div>
            {href && (
              <Icon
                name="chevronRight"
                className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500"
              />
            )}
          </>
        );

        return (
          <li key={item.id}>
            {href ? (
              <Link to={href} className="group flex gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/80 sm:px-6">
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 px-5 py-3.5 sm:px-6">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default AttentionList;
