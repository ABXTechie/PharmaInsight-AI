import { useEffect, useState } from "react";
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

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Here's an overview of your sales performance.
        </p>
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