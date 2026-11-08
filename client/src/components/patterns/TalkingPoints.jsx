import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../ui/Icon";
import { Alert, Skeleton } from "../ui/Primitives";
import { getTalkingPoints } from "../../services/aiService";

/**
 * AI talking points for a call or visit with one customer, based on their
 * buying pattern and recent orders. Generated on demand.
 */
const TalkingPoints = ({ customerId, shopName }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");

    try {
      setData(await getTalkingPoints(customerId));
    } catch (err) {
      setError(err.response?.data?.message ||
          (err.code === "ECONNABORTED"
            ? "The AI took too long to respond. Please try again."
            : "Unable to generate talking points."));
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = `What should I discuss with ${shopName} on my next call?`;

  return (
    <div className="rounded-lg border border-mint-200/70 bg-linear-to-br from-white to-mint-50/60">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Icon name="sparkles" className="h-4 w-4 text-mint-600" />
          <h3 className="text-sm font-semibold text-slate-900">Talking points</h3>
          <span className="text-xs text-slate-400">for your next call or visit</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/ai?q=${encodeURIComponent(askQuestion)}`} className="btn-ghost px-2.5 py-1.5 text-xs">
            Ask AI <Icon name="arrowUpRight" className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="btn bg-ink-900 px-3 py-1.5 text-xs text-white shadow-sm hover:bg-ink-800"
          >
            <Icon name={data ? "refresh" : "sparkles"} className={`h-3.5 w-3.5 text-mint-400 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Preparing..." : data ? "Regenerate" : "Prepare talking points"}
          </button>
        </div>
      </div>

      {(loading || error || data) && (
        <div className="border-t border-mint-100 px-4 py-4" aria-live="polite" aria-busy={loading}>
          {error && <Alert>{error}</Alert>}

          {loading && (
            <div className="space-y-2.5" role="status" aria-label="Preparing talking points">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          )}

          {!loading && data && (
            <div className="space-y-4">
              {data.summary && <p className="text-sm leading-6 text-slate-700">{data.summary}</p>}

              <ul className="space-y-2">
                {data.points.map((point, index) => (
                  <li key={index} className="flex gap-2.5 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>

              {data.suggestedProducts?.length > 0 && (
                <div>
                  <p className="eyebrow mb-2">Products to mention</p>
                  <ul className="grid gap-2 sm:grid-cols-3">
                    {data.suggestedProducts.map((p) => (
                      <li key={p.productId}>
                        <Link
                          to={`/products/${p.productId}`}
                          className="block h-full rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 transition hover:border-mint-200"
                        >
                          <p className="text-sm font-medium text-slate-900">{p.name}</p>
                          {p.reason && <p className="mt-0.5 text-xs leading-5 text-slate-500">{p.reason}</p>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Icon name="info" className="h-3.5 w-3.5" />
                AI-written from this customer's buying pattern and recent orders.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TalkingPoints;
