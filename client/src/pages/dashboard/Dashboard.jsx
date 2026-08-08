const Dashboard = () => {
  const stats = [
    {
      label: "Revenue Today",
      value: "₹0",
    },
    {
      label: "Revenue This Month",
      value: "₹0",
    },
    {
      label: "Total Sales",
      value: "0",
    },
    {
      label: "Customers",
      value: "0",
    },
    {
      label: "Medicines",
      value: "0",
    },
    {
      label: "Average Order Value",
      value: "₹0",
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
              {stat.value}
            </p>
          </div>
        ))}

      </div>

      {/* Placeholder sections */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Monthly Revenue
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Revenue chart will appear here.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Recent sales activity will appear here.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;