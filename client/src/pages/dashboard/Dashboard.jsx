import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardAnalytics } from "../../services/analyticsService";
import { getAIInsights } from "../../services/aiService";
import { useAuth } from "../../context/AuthContext";
import Icon from "../../components/ui/Icon";
import usePatterns from "../../hooks/usePatterns";
import AttentionList from "../../components/patterns/AttentionList";
import WeeklyBrief from "../../components/patterns/WeeklyBrief";
import { StatusBadge } from "../../components/patterns/PatternBadges";
import { STATUS_ORDER } from "../../components/patterns/patternMeta";
import {
  Alert,
  EmptyState,
  KpiCard,
  Section,
  Skeleton,
} from "../../components/ui/Primitives";
import {
  formatDate,
  formatINR,
  formatINRCompact,
  formatNumber,
  initials,
} from "../../utils/format";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-slate-900">
        {formatINR(payload[0].value)}
      </p>
    </div>
  );
};

const RankedList = ({ items, loading, emptyTitle, emptyIcon, getKey, getTitle, getSubtitle, getValue, getMeta, valueOf }) => {
  if (loading) {
    return (
      <div className="space-y-5 p-5 sm:p-6">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return <EmptyState compact icon={emptyIcon} title={emptyTitle} />;
  }

  const max = Math.max(...items.map(valueOf), 1);

  return (
    <ol className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <li key={getKey(item)} className="px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="tabular w-5 shrink-0 text-xs font-semibold text-slate-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-900">{getTitle(item)}</p>
                <p className="tabular shrink-0 text-sm font-semibold text-slate-900">{getValue(item)}</p>
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-3">
                <p className="truncate text-xs text-slate-500">{getSubtitle(item)}</p>
                <p className="shrink-0 text-xs text-slate-400">{getMeta(item)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-blue-500/80 transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max((valueOf(item) / max) * 100, 2)}%` }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { patterns, loading: patternsLoading, error: patternsError } = usePatterns();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiInsights, setAIInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiGeneratedAt, setAiGeneratedAt] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getDashboardAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleGenerateAIInsights = async () => {
    setAiLoading(true);
    setAiError("");

    try {
      const insights = await getAIInsights();
      setAIInsights(insights);
      setAiGeneratedAt(new Date());
    } catch (error) {
      setAiError(
        error.response?.data?.message ||
          "Unable to generate AI insights."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const stats = [
    {
      label: "Revenue Today",
      value: formatINR(analytics?.revenueToday),
      icon: "rupee",
      accent: "brand",
    },
    {
      label: "Revenue This Month",
      value: formatINR(analytics?.revenueThisMonth),
      icon: "calendar",
      accent: "brand",
    },
    {
      label: "Average Order Value",
      value: formatINR(analytics?.averageOrderValue),
      icon: "trend",
      accent: "brand",
      hint: "This month",
    },
    {
      label: "Total Sales",
      value: formatNumber(analytics?.totalSales),
      icon: "cart",
      hint: "All recorded orders",
    },
    {
      label: "Customers",
      value: formatNumber(analytics?.customerCount),
      icon: "store",
      hint: "Active accounts",
    },
    {
      label: "Products",
      value: formatNumber(analytics?.productCount),
      icon: "pill",
      hint: "In catalog",
    },
  ];

  // Derived only from the 12 months the API returns — no estimation.
  const revenueSummary = useMemo(() => {
    const months = analytics?.monthlyRevenue || [];
    if (!months.length) return null;

    const total = months.reduce((sum, m) => sum + Number(m.revenue || 0), 0);
    const peak = months.reduce((best, m) => (m.revenue > best.revenue ? m : best), months[0]);

    return { total, peak };
  }, [analytics]);

  const hasRevenue = analytics?.monthlyRevenue?.some((m) => m.revenue > 0);
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex animate-fade-in flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px] sm:leading-9">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Your pharmaceutical business intelligence, all in one place.
          </p>
        </div>

        <div className="flex gap-2">
          <NavLink to="/ai" className="btn-secondary">
            <Icon name="sparkles" className="h-4 w-4 text-mint-600" />
            Ask AI
          </NavLink>
          <NavLink to="/sales/new" className="btn-primary sm:hidden">
            <Icon name="plus" className="h-4 w-4" />
            Record Sale
          </NavLink>
        </div>
      </header>

      {error && <Alert>{error}</Alert>}

      {/* KPI Cards */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <KpiCard key={stat.label} loading={loading} {...stat} />
        ))}
      </section>

      {/* AI weekly brief (on demand) */}
      <WeeklyBrief />

      {/* Needs attention — pattern signals */}
      <Section
        title="Needs attention"
        description="Customers and products whose buying pattern has changed."
        bodyClassName=""
        actions={
          <Link to="/patterns" className="btn-ghost px-2 py-1 text-xs">
            All patterns <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {patterns?.summary?.statusCounts && Object.keys(patterns.summary.statusCounts).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6">
            <span className="mr-1 text-xs text-slate-400">Customers:</span>
            {STATUS_ORDER.filter((status) => patterns.summary.statusCounts[status]).map((status) => (
              <Link
                key={status}
                to={`/customers?status=${status}`}
                className="inline-flex items-center gap-1 rounded-full transition hover:opacity-80"
              >
                <StatusBadge status={status} />
                <span className="tabular text-xs font-semibold text-slate-700">
                  {patterns.summary.statusCounts[status]}
                </span>
              </Link>
            ))}
          </div>
        )}

        {patternsError ? (
          <div className="px-5 py-4 sm:px-6">
            <Alert>{patternsError}</Alert>
          </div>
        ) : (
          <AttentionList
            items={patterns?.attention || []}
            loading={patternsLoading}
            limit={5}
            emptyText="Every customer is ordering on their usual rhythm."
          />
        )}

        {!patternsLoading && patterns?.attention?.length > 5 && (
          <Link
            to="/patterns"
            className="block border-t border-slate-100 px-5 py-3 text-center text-sm font-medium text-blue-700 transition hover:bg-slate-50 sm:px-6"
          >
            View {patterns.attention.length - 5} more
          </Link>
        )}
      </Section>

      {/* Monthly Revenue */}
      <Section
        title="Monthly Revenue"
        description="Revenue performance over the last 12 months."
        bodyClassName="px-2 pb-4 pt-5 sm:px-4"
        actions={
          revenueSummary && hasRevenue ? (
            <dl className="flex gap-6 text-right">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">12-mo total</dt>
                <dd className="tabular text-sm font-semibold text-slate-900">{formatINR(revenueSummary.total)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Peak month</dt>
                <dd className="text-sm font-semibold text-slate-900">{revenueSummary.peak.month}</dd>
              </div>
            </dl>
          ) : null
        }
      >
        {loading ? (
          <div className="px-3 pb-2">
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        ) : hasRevenue ? (
          <figure className="h-72 w-full">
            <figcaption className="sr-only">
              Area chart of monthly revenue for the last 12 months:{" "}
              {analytics.monthlyRevenue.map((m) => `${m.month} ${formatINR(m.revenue)}`).join(", ")}.
            </figcaption>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.monthlyRevenue}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#129977" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#129977" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="#eef0f4" />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#939cad", fontSize: 12 }}
                  dy={8}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#939cad", fontSize: 12 }}
                  tickFormatter={formatINRCompact}
                  width={64}
                />

                <Tooltip
                  content={<RevenueTooltip />}
                  cursor={{ stroke: "#cdd3dd", strokeDasharray: "3 3" }}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#087a60"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#087a60" }}
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        ) : (
          <EmptyState icon="activity" title="No sales data yet" description="Record a sale to start tracking revenue trends." />
        )}
      </Section>

      {/* AI Business Insights */}
      <section
        aria-labelledby="ai-insights-heading"
        className="relative overflow-hidden rounded-xl border border-mint-200/70 bg-linear-to-br from-white via-white to-mint-50/70 shadow-card"
      >
        <div className="flex flex-col gap-4 border-b border-mint-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-mint-400">
              <Icon name="sparkles" className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 id="ai-insights-heading" className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                AI Business Insights
                <span className="rounded-md bg-mint-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mint-700">
                  Gemini
                </span>
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                AI-powered observations from your business data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {aiGeneratedAt && !aiLoading && (
              <p className="hidden text-xs text-slate-400 md:block">
                Generated {aiGeneratedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerateAIInsights}
              disabled={aiLoading}
              className="btn bg-ink-900 text-white shadow-sm hover:bg-ink-800"
            >
              <Icon
                name={aiInsights.length ? "refresh" : "sparkles"}
                className={`h-4 w-4 text-mint-400 ${aiLoading ? "animate-spin" : ""}`}
              />
              {aiLoading ? "Analyzing..." : aiInsights.length ? "Regenerate" : "Generate Insights"}
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6" aria-live="polite" aria-busy={aiLoading}>
          {aiError && (
            <Alert>
              <span>{aiError}</span>{" "}
              <button type="button" onClick={handleGenerateAIInsights} className="font-medium underline underline-offset-2">
                Try again
              </button>
            </Alert>
          )}

          {aiLoading && (
            <div>
              <p className="mb-4 flex items-center gap-2 text-sm text-mint-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-500" />
                </span>
                Analyzing your sales, customers and products…
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="space-y-2.5 rounded-lg border border-mint-100 bg-white p-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-4/5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!aiLoading && aiInsights.length > 0 && (
            <>
              <ol className="grid gap-3 md:grid-cols-2">
                {aiInsights.map((insight, index) => (
                  <li
                    key={index}
                    className="animate-fade-in rounded-lg border border-slate-200/80 bg-white p-4 transition hover:border-mint-200"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mint-700">
                      <Icon name="sparkles" className="h-3.5 w-3.5" />
                      Insight {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="text-sm leading-6 text-slate-700">{insight}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <Icon name="info" className="h-3.5 w-3.5" />
                AI-generated interpretation of your data. Verify important figures against reports.
              </p>
            </>
          )}

          {!aiLoading && aiInsights.length === 0 && !aiError && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-mint-200 bg-white/60 px-6 py-8 text-center">
              <p className="max-w-md text-sm text-slate-500">
                Generate AI insights to discover meaningful patterns in your
                business data.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Top Customers & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Top Customers"
          description="Customers generating the highest lifetime revenue."
          bodyClassName=""
          actions={
            <Link to="/customers" className="btn-ghost px-2 py-1 text-xs">
              View all <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <RankedList
            items={analytics?.topCustomers}
            loading={loading}
            emptyIcon="users"
            emptyTitle="No customer sales yet."
            getKey={(c) => c.customerId}
            getTitle={(c) => c.shopName}
            getSubtitle={(c) => c.name}
            getValue={(c) => formatINR(c.revenue)}
            getMeta={(c) => `${c.orders} ${c.orders === 1 ? "order" : "orders"}`}
            valueOf={(c) => c.revenue}
          />
        </Section>

        <Section
          title="Top Products"
          description="Products generating the highest revenue."
          bodyClassName=""
          actions={
            <Link to="/products" className="btn-ghost px-2 py-1 text-xs">
              View all <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <RankedList
            items={analytics?.topProducts}
            loading={loading}
            emptyIcon="pill"
            emptyTitle="No product sales yet."
            getKey={(p) => p.productId}
            getTitle={(p) => p.name}
            getSubtitle={(p) => p.company}
            getValue={(p) => formatINR(p.revenue)}
            getMeta={(p) => `${formatNumber(p.unitsSold)} units sold`}
            valueOf={(p) => p.revenue}
          />
        </Section>
      </div>

      {/* Recent Activity */}
      <Section
        title="Recent Activity"
        description="Your latest sales activity."
        bodyClassName=""
        actions={
          <Link to="/sales" className="btn-ghost px-2 py-1 text-xs">
            All sales <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {loading ? (
          <div className="divide-y divide-slate-100">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        ) : analytics?.recentActivity?.length ? (
          <ul className="divide-y divide-slate-100">
            {analytics.recentActivity.map((sale) => (
              <li key={sale.saleId}>
                <Link
                  to={`/sales/${sale.saleId}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {initials(sale.shopName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      Sale to {sale.shopName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{sale.customerName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular text-sm font-semibold text-slate-900">
                      {formatINR(sale.totalAmount)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(sale.saleDate)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact icon="receipt" title="No sales recorded yet." />
        )}
      </Section>
    </div>
  );
};

export default Dashboard;
