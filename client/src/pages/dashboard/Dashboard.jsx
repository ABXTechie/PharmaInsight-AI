import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardAnalytics } from "../../services/analyticsService";
import { getAIInsights } from "../../services/aiService";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiInsights, setAIInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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
      value: `₹${analytics?.revenueToday?.toLocaleString("en-IN") || "0"}`,
    },
    {
      label: "Revenue This Month",
      value: `₹${
        analytics?.revenueThisMonth?.toLocaleString("en-IN") || "0"
      }`,
    },
    {
      label: "Total Sales",
      value: analytics?.totalSales?.toLocaleString("en-IN") || "0",
    },
    {
      label: "Customers",
      value: analytics?.customerCount?.toLocaleString("en-IN") || "0",
    },
    {
      label: "Products",
      value: analytics?.productCount?.toLocaleString("en-IN") || "0",
    },
    {
      label: "Average Order Value",
      value: `₹${
        analytics?.averageOrderValue?.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        }) || "0"
      }`,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Here's an overview of your sales performance.
          </p>
        </div>

        <NavLink
          to="/sales/new"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          Record Sale
        </NavLink>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.label}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Full Width Monthly Revenue Chart */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900">
            Monthly Revenue
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Revenue performance over the last 12 months.
          </p>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center text-sm text-slate-500">
            Loading revenue data...
          </div>
        ) : analytics?.monthlyRevenue?.length ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.monthlyRevenue}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-slate-500">
            No sales data yet.
          </div>
        )}
      </div>

      {/* Supporting Intelligence: Top Customers & Top Products Grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Top Customers */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Top Customers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Customers generating the highest lifetime revenue.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Loading customer data...
            </div>
          ) : analytics?.topCustomers?.length ? (
            <div className="space-y-4">
              {analytics.topCustomers.map((customer, index) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {customer.shopName}
                      </p>

                      <p className="text-sm text-slate-500">
                        {customer.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ₹{customer.revenue.toLocaleString("en-IN")}
                    </p>

                    <p className="text-xs text-slate-500">
                      {customer.orders}{" "}
                      {customer.orders === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No customer sales yet.
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">
              Top Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Products generating the highest revenue.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Loading product data...
            </div>
          ) : analytics?.topProducts?.length ? (
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        {product.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {product.company}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ₹{product.revenue.toLocaleString("en-IN")}
                    </p>

                    <p className="text-xs text-slate-500">
                      {product.unitsSold.toLocaleString("en-IN")} units sold
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No product sales yet.
            </div>
          )}
        </div>
      </div>

      {/* AI Business Insights Section */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              AI Business Insights
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              AI-powered observations from your business data
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAIInsights}
            disabled={aiLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? "Analyzing..." : "Generate Insights"}
          </button>
        </div>

        {aiError && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {aiError}
          </div>
        )}

        {!aiLoading && aiInsights.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {aiInsights.map((insight, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm">
                    ✦
                  </div>

                  <p className="text-sm leading-6 text-slate-700">
                    {insight}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!aiLoading && aiInsights.length === 0 && !aiError && (
          <div className="mt-5 rounded-lg border border-dashed border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-500">
              Generate AI insights to discover meaningful patterns in your
              business data.
            </p>
          </div>
        )}

        {aiLoading && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        )}
      </div>

      {/* Full Width Recent Activity */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest sales activity.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Loading recent activity...
          </div>
        ) : analytics?.recentActivity?.length ? (
          <div className="space-y-4">
            {analytics.recentActivity.map((sale) => (
              <div
                key={sale.saleId}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    Sale to {sale.shopName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {sale.customerName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    ₹{sale.totalAmount.toLocaleString("en-IN")}
                  </p>

                  <p className="text-xs text-slate-500">
                    {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            No sales recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;