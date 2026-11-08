import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Icon from "../ui/Icon";
import { Alert, EmptyState, Skeleton } from "../ui/Primitives";
import AttentionList from "./AttentionList";
import TalkingPoints from "./TalkingPoints";
import { ShareBar, StatusBadge } from "./PatternBadges";
import { formatDate, formatINR, formatINRCompact } from "../../utils/format";

const Stat = ({ label, value, sub, tone = "default" }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p
      className={`tabular mt-1 text-lg font-semibold tracking-tight ${
        tone === "bad" ? "text-red-700" : tone === "good" ? "text-blue-700" : "text-slate-900"
      }`}
    >
      {value}
    </p>
    {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
  </div>
);

const ListCard = ({ title, icon, hint, children, empty }) => (
  <div className="rounded-lg border border-slate-200/80">
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
      <Icon name={icon} className="h-4 w-4 text-slate-400" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    </div>
    {hint && <p className="px-4 pt-3 text-xs text-slate-400">{hint}</p>}
    {children || <p className="px-4 py-4 text-sm text-slate-500">{empty}</p>}
  </div>
);

const SpendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="tabular text-sm font-semibold text-slate-900">{formatINR(payload[0].value)}</p>
    </div>
  );
};

/**
 * "How this customer buys": rhythm, trend, regular products, dropped
 * products and cross-sell ideas — all from recorded sales.
 */
const CustomerPatternPanel = ({ customerId, sales, salesLoading, patterns, patternsLoading, patternsError }) => {
  const pattern = patterns?.customers?.find((c) => c.customerId === customerId);
  const alerts = (patterns?.attention || []).filter((a) => a.customerId === customerId);

  // Monthly spend for the last 12 months, from this customer's sales
  const monthly = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }), spend: 0 };
    });
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const sale of sales || []) {
      const d = new Date(sale.saleDate);
      const bucket = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.spend += Number(sale.totalAmount || 0);
    }
    return months;
  }, [sales]);

  const hasSpend = monthly.some((m) => m.spend > 0);

  return (
    <section className="card" aria-labelledby="buying-pattern-heading">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 id="buying-pattern-heading" className="text-[15px] font-semibold text-slate-900">
            Buying pattern
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">How this customer orders, what they buy, and what's changed.</p>
        </div>
        {pattern && <StatusBadge status={pattern.status} size="lg" />}
      </div>

      {patternsError ? (
        <div className="p-5 sm:p-6">
          <Alert>{patternsError}</Alert>
        </div>
      ) : patternsLoading ? (
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4" role="status" aria-label="Loading buying pattern">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : !pattern ? (
        <EmptyState
          compact
          icon="activity"
          title="No orders yet"
          description="Buying patterns appear once this customer has a few orders."
        />
      ) : (
        <>
          {alerts.length > 0 && (
            <div className="border-b border-slate-100 bg-slate-50/40">
              <AttentionList
                items={alerts}
                getLink={(item) => (item.productId ? `/products/${item.productId}` : null)}
              />
            </div>
          )}

          <div className="space-y-6 p-5 sm:p-6">
            {/* Rhythm & trend */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="Orders"
                value={pattern.usualGapDays ? `Every ${Math.round(pattern.usualGapDays)} days` : "—"}
                sub={
                  pattern.usualGapDays
                    ? `${pattern.orders} orders since ${formatDate(pattern.firstOrder, { month: "short", year: "numeric" })}`
                    : "Needs 3+ order days to learn a rhythm"
                }
              />
              <Stat
                label="Last order"
                value={
                  pattern.daysSinceLastOrder === 0
                    ? "Today"
                    : `${pattern.daysSinceLastOrder} ${pattern.daysSinceLastOrder === 1 ? "day" : "days"} ago`
                }
                sub={pattern.overdue ? `Overdue by ${pattern.overdueByDays} days` : formatDate(pattern.lastOrder)}
                tone={pattern.overdue ? "bad" : "default"}
              />
              <Stat
                label="Next order expected"
                value={
                  pattern.expectedNextOrder
                    ? pattern.overdue
                      ? "Overdue"
                      : formatDate(pattern.expectedNextOrder, { day: "numeric", month: "short" })
                    : "—"
                }
                sub={pattern.expectedNextOrder ? `Based on their usual gap` : undefined}
                tone={pattern.overdue ? "bad" : "default"}
              />
              <Stat
                label="Spending trend"
                value={
                  pattern.trend.changePercent === null
                    ? "—"
                    : `${pattern.trend.changePercent > 0 ? "+" : ""}${pattern.trend.changePercent}%`
                }
                sub={
                  pattern.trend.changePercent === null
                    ? "Needs 5+ order days to compare"
                    : `${formatINR(pattern.trend.recentMonthlyRate)}/mo vs ${formatINR(pattern.trend.previousMonthlyRate)}/mo`
                }
                tone={
                  pattern.trend.changePercent === null
                    ? "default"
                    : pattern.trend.changePercent <= -25
                      ? "bad"
                      : pattern.trend.changePercent >= 25
                        ? "good"
                        : "default"
                }
              />
            </div>

            <TalkingPoints customerId={customerId} shopName={pattern.shopName || pattern.name} />

            {/* Monthly spend */}
            <div>
              <p className="eyebrow mb-3">Monthly spend · last 12 months</p>
              {salesLoading ? (
                <Skeleton className="h-44 rounded-lg" />
              ) : hasSpend ? (
                <figure className="h-44">
                  <figcaption className="sr-only">
                    Monthly spend: {monthly.map((m) => `${m.month} ${formatINR(m.spend)}`).join(", ")}.
                  </figcaption>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#eef0f4" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#939cad", fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#939cad", fontSize: 11 }} tickFormatter={formatINRCompact} width={52} />
                      <Tooltip content={<SpendTooltip />} cursor={{ fill: "#f6f7f9" }} />
                      <Bar dataKey="spend" fill="#129977" radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={600} />
                    </BarChart>
                  </ResponsiveContainer>
                </figure>
              ) : (
                <p className="text-sm text-slate-500">No spend in the last 12 months.</p>
              )}
            </div>

            {/* Products */}
            <div className="grid gap-4 lg:grid-cols-3">
              <ListCard
                title="Usually buys"
                icon="pill"
                empty={pattern.orders < 2 ? "Needs at least 2 orders." : "No product appears in 40% or more of their orders."}
              >
                {pattern.usuallyBuys.length > 0 && (
                  <ul className="divide-y divide-slate-100">
                    {pattern.usuallyBuys.map((p) => (
                      <li key={p.productId} className="px-4 py-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <Link to={`/products/${p.productId}`} className="truncate text-sm font-medium text-slate-900 hover:text-blue-700">
                            {p.name}
                          </Link>
                          <span className="tabular shrink-0 text-xs text-slate-500">{Math.round(p.share * 100)}% of orders</span>
                        </div>
                        <ShareBar value={p.share * 100} className="mt-1.5 w-full" />
                        <p className="mt-1.5 text-xs text-slate-400">
                          ~{p.averageQuantity} units at {formatINR(p.averagePrice)} · last {formatDate(p.lastBought, { day: "numeric", month: "short" })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ListCard>

              <ListCard title="Stopped buying" icon="alert" empty="Nothing they used to buy regularly has dropped off.">
                {pattern.stoppedBuying.length > 0 && (
                  <ul className="divide-y divide-slate-100">
                    {pattern.stoppedBuying.map((p) => (
                      <li key={p.productId} className="px-4 py-3">
                        <Link to={`/products/${p.productId}`} className="text-sm font-medium text-slate-900 hover:text-blue-700">
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-red-700">
                          Bought {p.purchases}× · missing from last {p.ordersSince} orders
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Last bought {formatDate(p.lastBought)} — worth asking if they switched supplier.
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ListCard>

              <ListCard
                title="Pitch next"
                icon="sparkles"
                empty="No suggestions yet — needs other shops with similar buying."
              >
                {pattern.pitchNext.length > 0 && (
                  <ul className="divide-y divide-slate-100">
                    {pattern.pitchNext.map((p) => (
                      <li key={p.productId} className="px-4 py-3">
                        <Link to={`/products/${p.productId}`} className="text-sm font-medium text-slate-900 hover:text-blue-700">
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {p.similarCustomersBuying} similar {p.similarCustomersBuying === 1 ? "shop buys" : "shops buy"} this · never ordered here
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ListCard>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default CustomerPatternPanel;
