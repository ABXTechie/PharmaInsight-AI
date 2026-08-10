import { useState } from "react";
import {
  getSalesReport,
  downloadSalesReportPDF,
  getCustomerSalesReport,
  getProductSalesReport,
  getMonthlySalesReport
} from "../../services/reportService";

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>

        <p className="mt-2 text-slate-500">
          Generate detailed sales reports for your business.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Report Type
            </label>

            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReport(null);
                setError("");
              }}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="sales">Sales Report</option>
              <option value="customers">Customer Report</option>
              <option value="products">Product Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>

            {reportType === "sales" && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pdfLoading ? "Generating..." : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Sales Report */}
      {reportType === "sales" && report && (
        <>
          {/* Summary */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Revenue
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                ₹
                {report.summary.totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Sales
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {report.summary.totalSales.toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Average Order Value
              </p>

              <p className="mt-3 text-3xl font-bold text-slate-900">
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

          {/* Sales Table */}
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900">
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-600">
                        Date
                      </th>

                      <th className="px-6 py-4 font-medium text-slate-600">
                        Customer
                      </th>

                      <th className="px-6 py-4 font-medium text-slate-600">
                        Items
                      </th>

                      <th className="px-6 py-4 text-right font-medium text-slate-600">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.sales.map((sale) => (
                      <tr
                        key={sale.saleId}
                        className="border-b border-slate-100 last:border-b-0"
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
            )}
          </div>
        </>
      )}

      {/* Customer Report */}
      {reportType === "customers" && report && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-600">
                      Customer
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Orders
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Units
                    </th>

                    <th className="px-6 py-4 text-right font-medium text-slate-600">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.map((customer) => (
                    <tr
                      key={customer.customerId}
                      className="border-b border-slate-100 last:border-b-0"
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
          )}
        </div>
      )}

      {/* Product Report */}
      {reportType === "products" && report && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-600">
                      Product
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Company
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Orders
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Units
                    </th>

                    <th className="px-6 py-4 text-right font-medium text-slate-600">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.map((product) => (
                    <tr
                      key={product.productId}
                      className="border-b border-slate-100 last:border-b-0"
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
          )}
        </div>
      )}

      {/* Monthly Report */}
      {reportType === "monthly" && report && (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-600">
                      Month
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Orders
                    </th>

                    <th className="px-6 py-4 font-medium text-slate-600">
                      Units
                    </th>

                    <th className="px-6 py-4 text-right font-medium text-slate-600">
                      Revenue
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.map((month) => (
                    <tr
                      key={`${month.year}-${month.month}`}
                      className="border-b border-slate-100 last:border-b-0"
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
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;