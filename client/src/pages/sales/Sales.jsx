import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSales, deleteSale } from "../../services/saleService";
import { Alert, EmptyState, PageHeader, TableSkeleton } from "../../components/ui/Primitives";
import Icon from "../../components/ui/Icon";

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
      <div className="space-y-6">
        <PageHeader eyebrow="Operations" title="Sales" description="Track and manage your sales transactions." />
        <TableSkeleton label="Loading sales" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Operations"
        title="Sales"
        description="Track and manage your sales transactions."
        actions={
          <Link to="/sales/new" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            Record Sale
          </Link>
        }
      />

      {/* Error */}
      {error && <Alert>{error}</Alert>}

      {/* Empty State */}
      {sales.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="receipt"
            title="No sales yet"
            description="Record your first sale to start tracking your business performance."
            action={
              <Link to="/sales/new" className="btn-primary">
                <Icon name="plus" className="h-4 w-4" />
                Record First Sale
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Sales Table (Desktop) */}
          <div className="hidden overflow-x-auto card lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  <th className="th text-left">
                    Customer
                  </th>

                  <th className="th text-left">
                    Items
                  </th>

                  <th className="th text-right">
                    Amount
                  </th>

                  <th className="th text-left">
                    Date
                  </th>

                  <th className="th text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="transition-colors hover:bg-slate-50/80"
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

                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
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

                        <Link
                          to={`/sales/${sale._id}/edit`}
                          className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                          Edit
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

          {/* Sales Cards (Mobile & Tablet) */}
          <div className="space-y-3 lg:hidden">
            {sales.map((sale) => (
              <div
                key={sale._id}
                className="card p-4"
              >
                {/* Customer */}
                <div>
                  <p className="font-medium text-slate-900">
                    {sale.customer?.name || "Unknown customer"}
                  </p>

                  {sale.customer?.shopName && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {sale.customer.shopName}
                    </p>
                  )}
                </div>

                {/* Sale Details */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">Items</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {sale.items?.length || 0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">Amount</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      ₹{sale.totalAmount?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Sale Date</p>

                  <p className="mt-1 text-sm text-slate-700">
                    {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-3">
                  <Link
                    to={`/sales/${sale._id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View
                  </Link>

                  <Link
                    to={`/sales/${sale._id}/edit`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(sale._id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;