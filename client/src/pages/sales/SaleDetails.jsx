import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSale } from "../../services/saleService";

const SaleDetails = () => {
  const { id } = useParams();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getSale(id);
        setSale(data.sale);
      } catch (error) {
        setError(
          error.response?.data?.message || "Failed to load sale"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSale();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">
          Loading sale...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <Link
          to="/sales"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Sales
        </Link>

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!sale) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <Link
          to="/sales"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Sales
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sale Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {new Date(sale.saleDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Customer */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Customer
        </h2>

        <div className="mt-4">
          <p className="font-medium text-slate-900">
            {sale.customer?.name || "Unknown customer"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {sale.customer?.shopName || ""}
          </p>

          {sale.customer?.phone && (
            <p className="mt-2 text-sm text-slate-600">
              {sale.customer.phone}
            </p>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Products
          </h2>
        </div>

        <table className="min-w-full text-sm">
          <thead className="border-y border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-slate-600">
                Product
              </th>

              <th className="px-6 py-3 text-right font-medium text-slate-600">
                Quantity
              </th>

              <th className="px-6 py-3 text-right font-medium text-slate-600">
                Unit Price
              </th>

              <th className="px-6 py-3 text-right font-medium text-slate-600">
                Subtotal
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sale.items?.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">
                    {item.product?.name || "Unknown product"}
                  </p>

                  <p className="text-xs text-slate-500">
                    {item.product?.company || ""}
                  </p>
                </td>

                <td className="px-6 py-4 text-right text-slate-600">
                  {item.quantity}
                </td>

                <td className="px-6 py-4 text-right text-slate-600">
                  ₹{item.unitPrice?.toLocaleString("en-IN")}
                </td>

                <td className="px-6 py-4 text-right font-medium text-slate-900">
                  ₹{item.subtotal?.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end border-t border-slate-200 p-6">
          <div className="text-right">
            <p className="text-sm text-slate-500">
              Total Amount
            </p>

            <p className="mt-1 text-2xl font-semibold text-slate-900">
              ₹{sale.totalAmount?.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetails;