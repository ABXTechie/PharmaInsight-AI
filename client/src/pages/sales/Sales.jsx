import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSales, deleteSale } from "../../services/saleService";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSales();
      setSales(data.sales);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load sales"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sale?"
    );

    if (!confirmed) return;

    try {
      await deleteSale(id);

      setSales((currentSales) =>
        currentSales.filter((sale) => sale._id !== id)
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete sale"
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading sales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Sales
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage your sales transactions.
          </p>
        </div>

        <Link
          to="/sales/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Record Sale
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty State */}
      {sales.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-medium text-slate-900">
            No sales yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Record your first sale to start tracking your business
            performance.
          </p>

          <Link
            to="/sales/new"
            className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Record First Sale
          </Link>
        </div>
      ) : (
        /* Sales Table */
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-slate-600">
                  Customer
                </th>

                <th className="px-6 py-4 text-left font-medium text-slate-600">
                  Items
                </th>

                <th className="px-6 py-4 text-left font-medium text-slate-600">
                  Amount
                </th>

                <th className="px-6 py-4 text-left font-medium text-slate-600">
                  Date
                </th>

                <th className="px-6 py-4 text-right font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr
                  key={sale._id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {sale.customer?.name || "Unknown customer"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {sale.customer?.shopName || ""}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {sale.items?.length || 0}
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    ₹{sale.totalAmount?.toLocaleString("en-IN")}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/sales/${sale._id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>

                      <button
                        onClick={() => handleDelete(sale._id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sales;