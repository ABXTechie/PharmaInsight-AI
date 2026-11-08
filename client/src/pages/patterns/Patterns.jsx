import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import usePatterns from "../../hooks/usePatterns";
import Icon from "../../components/ui/Icon";
import { Alert, EmptyState, PageHeader, Section, Skeleton } from "../../components/ui/Primitives";
import AttentionList from "../../components/patterns/AttentionList";
import WeeklyBrief from "../../components/patterns/WeeklyBrief";
import { StatusBadge } from "../../components/patterns/PatternBadges";
import { STATUS_ORDER } from "../../components/patterns/patternMeta";
import { formatDate, formatINR, formatINRCompact, formatNumber } from "../../utils/format";

const FEED_FILTERS = [
  { value: "all", label: "All" },
  { value: "risk", label: "Risks" },
  { value: "opportunity", label: "Opportunities" },
  { value: "info", label: "Notes" },
];

const Segmented = ({ options, value, onChange, label }) => (
  <div role="group" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
          value === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        {option.label}
        {option.count !== undefined && <span className="tabular ml-1 text-slate-400">{option.count}</span>}
      </button>
    ))}
  </div>
);

/* Customer × product grid --------------------------------------------- */
const BuyingGrid = ({ patterns }) => {
  const [metric, setMetric] = useState("revenue");

  const { rows, columns, columnMax, lapsed } = useMemo(() => {
    const productsWithSales = patterns.products.filter((p) => p.sales > 0);
    const max = new Map(
      productsWithSales.map((p) => [
        p.productId,
        Math.max(
          ...Object.values(patterns.matrix.cells).map((row) => row[p.productId]?.[metric] || 0),
          1
        ),
      ])
    );
    const lapsedSet = new Set(
      patterns.customers.flatMap((c) => c.stoppedBuying.map((s) => `${c.customerId}:${s.productId}`))
    );
    return { rows: patterns.customers, columns: productsWithSales, columnMax: max, lapsed: lapsedSet };
  }, [patterns, metric]);

  if (!rows.length || !columns.length) {
    return <EmptyState compact icon="activity" title="No sales recorded yet" />;
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-blue-600" aria-hidden="true" /> Buys the most
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-blue-100" aria-hidden="true" /> Buys a little
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-dashed border-slate-300" aria-hidden="true" /> Never ordered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm ring-2 ring-red-400" aria-hidden="true" /> Stopped buying
          </span>
        </div>
        <Segmented
          label="Grid metric"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "revenue", label: "Revenue" },
            { value: "units", label: "Units" },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs">
          <caption className="sr-only">
            Customer by product purchases. Colour intensity shows how much each customer buys of each product relative
            to that product's biggest buyer.
          </caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[180px] border-b border-slate-200 bg-white px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                Customer
              </th>
              {columns.map((p) => (
                <th key={p.productId} className="min-w-[96px] border-b border-slate-200 px-2 py-3 text-left align-bottom font-medium text-slate-600">
                  <Link to={`/products/${p.productId}`} className="line-clamp-2 hover:text-blue-700" title={p.name}>
                    {p.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.customerId}>
                <th scope="row" className="sticky left-0 z-10 border-b border-slate-100 bg-white px-5 py-2 text-left font-normal sm:px-6">
                  <Link to={`/customers/${c.customerId}`} className="block truncate text-sm font-medium text-slate-900 hover:text-blue-700">
                    {c.shopName || c.name}
                  </Link>
                  <StatusBadge status={c.status} />
                </th>
                {columns.map((p) => {
                  const cell = patterns.matrix.cells[c.customerId]?.[p.productId];
                  const isLapsed = lapsed.has(`${c.customerId}:${p.productId}`);
                  const value = cell?.[metric] || 0;
                  const intensity = value / columnMax.get(p.productId);
                  const label = cell
                    ? `${c.shopName || c.name} — ${p.name}: ${formatINR(cell.revenue)}, ${formatNumber(cell.units)} units, last ${formatDate(cell.lastBought)}${
                        isLapsed ? " (stopped buying)" : ""
                      }`
                    : `${c.shopName || c.name} has never ordered ${p.name}`;

                  return (
                    <td key={p.productId} className="border-b border-slate-100 px-1.5 py-1.5">
                      {cell ? (
                        <div
                          title={label}
                          aria-label={label}
                          className={`tabular flex h-9 items-center justify-center rounded-md text-[11px] font-medium ${
                            isLapsed ? "ring-2 ring-inset ring-red-400" : ""
                          } ${intensity > 0.55 ? "text-white" : "text-blue-900"}`}
                          style={{ backgroundColor: `rgb(8 122 96 / ${0.1 + intensity * 0.85})` }}
                        >
                          {metric === "revenue" ? formatINRCompact(value) : formatNumber(value)}
                        </div>
                      ) : (
                        <div
                          title={label}
                          aria-label={label}
                          className="flex h-9 items-center justify-center rounded-md border border-dashed border-slate-200 text-slate-300"
                        >
                          ·
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* Page ----------------------------------------------------------------- */
const Patterns = () => {
  const { patterns, loading, error, refresh } = usePatterns();
  const [feedFilter, setFeedFilter] = useState("all");

  const attention = patterns?.attention || [];
  const filtered = feedFilter === "all" ? attention : attention.filter((a) => a.tone === feedFilter);
  const counts = {
    all: attention.length,
    risk: attention.filter((a) => a.tone === "risk").length,
    opportunity: attention.filter((a) => a.tone === "opportunity").length,
    info: attention.filter((a) => a.tone === "info").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Buying patterns"
        description="Who's ordering less, what's selling more, and where the next sale is — worked out from your recorded sales."
        actions={
          <button type="button" onClick={refresh} disabled={loading} className="btn-secondary">
            <Icon name="refresh" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {/* Customer status overview */}
      {loading ? (
        <Skeleton className="h-16 rounded-xl" />
      ) : (
        patterns && (
          <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
            {STATUS_ORDER.filter((s) => patterns.summary.statusCounts[s]).map((status) => (
              <Link key={status} to={`/customers?status=${status}`} className="flex items-center gap-2 transition hover:opacity-80">
                <span className="tabular text-xl font-semibold text-slate-900">{patterns.summary.statusCounts[status]}</span>
                <StatusBadge status={status} />
              </Link>
            ))}
            {patterns.summary.neverOrdered > 0 && (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <span className="tabular text-xl font-semibold text-slate-900">{patterns.summary.neverOrdered}</span>
                never ordered
              </span>
            )}
          </div>
        )
      )}

      <WeeklyBrief />

      <Section
        title="Needs attention"
        description="Ranked: risks first, then opportunities, then notes."
        bodyClassName=""
        actions={
          <Segmented
            label="Filter signals"
            value={feedFilter}
            onChange={setFeedFilter}
            options={FEED_FILTERS.map((f) => ({ ...f, count: loading ? undefined : counts[f.value] }))}
          />
        }
      >
        <AttentionList
          items={filtered}
          loading={loading}
          emptyText={feedFilter === "all" ? "Nothing needs attention right now." : "Nothing in this category right now."}
        />
      </Section>

      <Section
        title="Who buys what"
        description="Customers × products. Gaps and red outlines show where to follow up."
        bodyClassName=""
      >
        {loading ? (
          <div className="p-5 sm:p-6">
            <Skeleton className="h-64 rounded-lg" />
          </div>
        ) : patterns ? (
          <BuyingGrid patterns={patterns} />
        ) : null}
      </Section>

      {patterns && (
        <p className="flex items-start gap-1.5 text-xs text-slate-400">
          <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Patterns need about 3 orders per customer to be reliable. Customers with less history are marked "Not enough
          history" instead of being guessed.
        </p>
      )}
    </div>
  );
};

export default Patterns;
