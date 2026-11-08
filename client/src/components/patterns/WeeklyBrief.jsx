import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { Alert, Skeleton } from "../ui/Primitives";
import { getWeeklyBrief } from "../../services/aiService";
import { useAuth } from "../../context/AuthContext";
import { friendlyApiError } from "../../utils/apiError";

const ACTION_META = {
  call: { label: "Call", icon: "users", chip: "bg-red-50 text-red-700 ring-red-100" },
  pitch: { label: "Pitch", icon: "trend", chip: "bg-blue-50 text-blue-700 ring-blue-100" },
  watch: { label: "Watch", icon: "eye", chip: "bg-amber-50 text-amber-700 ring-amber-100" },
  price: { label: "Price", icon: "rupee", chip: "bg-slate-50 text-slate-600 ring-slate-200" },
};

// One brief per user per day, kept for the browser session (no repeat AI calls).
const cacheKey = (user) =>
  `pi.brief.${user?._id || user?.email || "me"}.${new Date().toISOString().slice(0, 10)}`;

const readCache = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || null;
  } catch {
    return null;
  }
};

/**
 * AI-written weekly brief on top of the deterministic pattern signals.
 * Generated on demand so opening the dashboard never spends AI quota.
 */
const WeeklyBrief = () => {
  const { user } = useAuth();
  const key = cacheKey(user);
  const [brief, setBrief] = useState(() => readCache(key));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getWeeklyBrief();
      setBrief(data);
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      setError(friendlyApiError(err, "Unable to generate the weekly brief."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="weekly-brief-heading"
      className="overflow-hidden rounded-xl border border-mint-200/70 bg-linear-to-br from-white via-white to-mint-50/70 shadow-card"
    >
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-mint-400">
            <Icon name="sparkles" className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id="weekly-brief-heading" className="text-[15px] font-semibold text-slate-900">
              This week's brief
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Who to call and what to pitch, written by AI from your buying patterns.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {brief?.generatedAt && !loading && (
            <span className="hidden text-xs text-slate-400 md:block">
              {brief.source === "rules" ? "Checked" : "Generated"}{" "}
              {new Date(brief.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="btn bg-ink-900 text-white shadow-sm hover:bg-ink-800"
          >
            <Icon
              name={brief ? "refresh" : "sparkles"}
              className={`h-4 w-4 text-mint-400 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Writing..." : brief ? "Refresh brief" : "Write this week's brief"}
          </button>
        </div>
      </div>

      {(loading || error || brief) && (
        <div className="border-t border-mint-100 px-5 py-4 sm:px-6" aria-live="polite" aria-busy={loading}>
          {error && <Alert>{error}</Alert>}

          {loading && (
            <div className="space-y-3" role="status" aria-label="Writing brief">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid gap-2 pt-1 md:grid-cols-2">
                {[0, 1, 2, 3].map((k) => (
                  <Skeleton key={k} className="h-16 rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {!loading && brief && (
            <>
              <p className="text-sm leading-6 text-slate-700">{brief.summary}</p>

              {brief.actions?.length > 0 && (
                <ol className="mt-4 grid gap-2.5 md:grid-cols-2">
                  {brief.actions.map((action, index) => {
                    const meta = ACTION_META[action.type] || ACTION_META.watch;
                    const href = action.customerId
                      ? `/customers/${action.customerId}`
                      : action.productId
                        ? `/products/${action.productId}`
                        : null;
                    const body = (
                      <>
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ${meta.chip}`}>
                          <Icon name={meta.icon} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            <span className="sr-only">{meta.label}: </span>
                            {action.title}
                          </p>
                          {action.detail && <p className="mt-0.5 text-xs leading-5 text-slate-500">{action.detail}</p>}
                        </div>
                        {href && <Icon name="chevronRight" className="mt-1.5 h-4 w-4 shrink-0 text-slate-300" />}
                      </>
                    );

                    return (
                      <li
                        key={`${action.type}-${index}`}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {href ? (
                          <Link
                            to={href}
                            className="flex h-full gap-3 rounded-lg border border-slate-200/80 bg-white p-3 transition hover:border-mint-200"
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className="flex h-full gap-3 rounded-lg border border-slate-200/80 bg-white p-3">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}

              {brief.source === "ai" && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Icon name="info" className="h-3.5 w-3.5" />
                  AI-written from the pattern signals below. Figures come from your recorded sales.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default WeeklyBrief;
