import { useState } from "react";
import {
  getSalesReport,
  downloadSalesReportPDF,
  getCustomerSalesReport,
  getProductSalesReport,
  getMonthlySalesReport,
} from "../../services/reportService";
import { Alert, EmptyState, PageHeader, Skeleton } from "../../components/ui/Primitives";
import Icon from "../../components/ui/Icon";

const Reports = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reportType, setReportType] = useState("sales");

  const handleGenerateReport = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let data;

      if (reportType === "sales") {
        data = await getSalesReport({
          startDate,
          endDate,
        });
      } else if (reportType === "customers") {
        data = await getCustomerSalesReport({
          startDate,
          endDate,
        });
      } else if (reportType === "products") {
        data = await getProductSalesReport({
          startDate,
          endDate,
        });
      } else {
        data = await getMonthlySalesReport({
          startDate,
          endDate,
        });
      }

      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate report."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setPdfLoading(true);
      setError("");

      const blob = await downloadSalesReportPDF({
        startDate,
        endDate,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "sales-report.pdf";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate PDF."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <PageHeader
        eyebrow="Intelligence"
        title="Reports"
        description="Generate detailed sales reports for your business."
      />

      {/* Filters */}
      <div className="card p-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          <div>
            <label htmlFor="report-type" className="text-sm font-medium text-slate-700">
              Report Type
            </label>

            <select
              id="report-type"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReport(null);
                setError("");
              }}
              className="input mt-1.5 h-10 py-0"
            >
              <option value="sales">Sales Report</option>
              <option value="customers">Customer Report</option>
              <option value="products">Product Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="text-sm font-medium text-slate-700">
              Start Date
            </label>

            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input mt-1.5 h-10 py-0"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="text-sm font-medium text-slate-700">
              End Date
            </label>

            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input mt-1.5 h-10 py-0"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading}
              className="btn-primary h-10 flex-1 whitespace-nowrap"
            >
              <Icon name={loading ? "refresh" : "report"} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Generating..." : "Generate Report"}
            </button>

            {reportType === "sales" && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="btn-secondary h-10 flex-1 whitespace-nowrap"
              >
                <Icon name="download" className="h-4 w-4" />
                {pdfLoading ? "Generating..." : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <Alert className="mt-4">{error}</Alert>
        )}
      </div>

      {loading && (
        <div className="mt-8 space-y-4" role="status" aria-label="Generating report">
          <div className="grid gap-5 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      {!loading && !report && !error && (
        <div className="card mt-8">
          <EmptyState
            icon="report"
            title="No report generated yet"
            description="Choose a report type and optional date range, then select Generate Report."
          />
        </div>
      )}

      {/* Sales Report */}
      {!loading && reportType === "sales" && report && (
        <>
          {/* Summary */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-6">
              <p className="text-[13px] font-medium text-slate-500">
                Total Revenue
              </p>

              <p className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900">
                ₹
                {report.summary.totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[13px] font-medium text-slate-500">
                Total Sales
              </p>

              <p className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900">
                {report.summary.totalSales.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-[13px] font-medium text-slate-500">
                Average Order Value
              </p>

              <p className="mt-3 text-[26px] font-semibold tracking-tight text-slate-900">
                ₹
                {report.summary.averageOrderValue.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </p>
            </div>
          </div>

          {/* Sales Table / Cards */}
          <div className="mt-8 overflow-hidden card">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-[15px] font-semibold text-slate-900">
                Sales
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Detailed sales for the selected period.
              </p>
            </div>

            {report.sales.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No sales found for the selected period.
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/70">
                      <tr>
                        <th className="th">
                          Date
                        </th>

                        <th className="th">
                          Customer
                        </th>

                        <th className="th">
                          Items
                        </th>

                        <th className="th text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {report.sales.map((sale) => (
                        <tr
                          key={sale.saleId}
                          className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-4 text-slate-700">
                            {new Date(sale.date).toLocaleDateString(
                              "en-IN"
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">
                              {sale.shopName}
                            </p>

                            <p className="text-xs text-slate-500">
                              {sale.customer}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-slate-700">
                            {sale.itemCount}
                          </td>

                          <td className="px-6 py-4 text-right font-medium text-slate-900">
                            ₹
                            {sale.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 lg:hidden">
                  {report.sales.map((sale) => (
                    <div
                      key={sale.saleId}
                      className="card p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {sale.shopName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {sale.customer}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                          <p className="text-xs text-slate-500">Date</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {new Date(sale.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                          <p className="text-xs text-slate-500">Items</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {sale.itemCount}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Amount</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          ₹{sale.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Customer Report */}
      {!loading && reportType === "customers" && report && (
        <div className="mt-8 overflow-hidden card">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Customer Sales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sales performance by customer for the selected period.
            </p>
          </div>

          {report.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No customer sales found for the selected period.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/70">
                    <tr>
                      <th className="th">
                        Customer
                      </th>

                      <th className="th">
                        Orders
                      </th>

                      <th className="th">
                        Units
                      </th>

                      <th className="th text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.map((customer) => (
                      <tr
                        key={customer.customerId}
                        className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">
                            {customer.shopName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {customer.name}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {customer.totalSales.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {customer.totalUnits.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          ₹
                          {customer.totalRevenue.toLocaleString(
                            "en-IN"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {report.map((customer) => (
                  <div
                    key={customer.customerId}
                    className="card p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {customer.shopName}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {customer.name}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Orders</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {customer.totalSales.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Units</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {customer.totalUnits.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        ₹{customer.totalRevenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Product Report */}
      {!loading && reportType === "products" && report && (
        <div className="mt-8 overflow-hidden card">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Product Sales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sales performance by product for the selected period.
            </p>
          </div>

          {report.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No product sales found for the selected period.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/70">
                    <tr>
                      <th className="th">
                        Product
                      </th>

                      <th className="th">
                        Company
                      </th>

                      <th className="th">
                        Orders
                      </th>

                      <th className="th">
                        Units
                      </th>

                      <th className="th text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.map((product) => (
                      <tr
                        key={product.productId}
                        className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {product.name}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {product.company}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {product.totalSales.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {product.totalUnits.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          ₹
                          {product.totalRevenue.toLocaleString(
                            "en-IN"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {report.map((product) => (
                  <div
                    key={product.productId}
                    className="card p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {product.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {product.company}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Orders</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {product.totalSales.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Units</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {product.totalUnits.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        ₹{product.totalRevenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {!loading && reportType === "monthly" && report && (
        <div className="mt-8 overflow-hidden card">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Monthly Sales
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Revenue and sales performance by month.
            </p>
          </div>

          {report.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No monthly sales found for the selected period.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/70">
                    <tr>
                      <th className="th">
                        Month
                      </th>

                      <th className="th">
                        Orders
                      </th>

                      <th className="th">
                        Units
                      </th>

                      <th className="th text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.map((month) => (
                      <tr
                        key={`${month.year}-${month.month}`}
                        className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {new Date(
                            month.year,
                            month.month - 1,
                            1
                          ).toLocaleString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {month.totalSales.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {month.totalUnits.toLocaleString("en-IN")}
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          ₹
                          {month.totalRevenue.toLocaleString(
                            "en-IN"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 lg:hidden">
                {report.map((month) => (
                  <div
                    key={`${month.year}-${month.month}`}
                    className="card p-4"
                  >
                    <p className="font-medium text-slate-900">
                      {new Date(
                        month.year,
                        month.month - 1,
                        1
                      ).toLocaleString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Orders</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {month.totalSales.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                        <p className="text-xs text-slate-500">Units</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {month.totalUnits.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5">
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        ₹{month.totalRevenue.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;