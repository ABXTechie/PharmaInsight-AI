import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../../components/ui/Icon";
import { getSale } from "../../services/saleService";
import { Alert, PageHeader, Skeleton } from "../../components/ui/Primitives";

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
      <div className="mx-auto max-w-4xl space-y-6" role="status" aria-label="Loading sale">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader backTo="/sales" backLabel="Back to Sales" title="Sale Details" />
        <Alert>{error}</Alert>
      </div>
    );
  }

  if (!sale) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <PageHeader
        backTo="/sales"
        backLabel="Back to Sales"
        eyebrow="Sale"
        title="Sale Details"
        actions={
          <Link to={`/sales/${sale._id}/edit`} className="btn-secondary">
            <Icon name="edit" className="h-4 w-4" />
            Edit Sale
          </Link>
        }
        description={new Date(sale.saleDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />

      {/* Customer */}
      <div className="card p-6">
        <h2 className="eyebrow">
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
      <div className="overflow-x-auto card">
        <div className="p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Products
          </h2>
        </div>

        <table className="min-w-full text-sm">
          <thead className="border-y border-slate-200 bg-slate-50/70">
            <tr>
              <th className="th text-left">
                Product
              </th>

              <th className="th text-right">
                Quantity
              </th>

              <th className="th text-right">
                Unit Price
              </th>

              <th className="th text-right">
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
        <div className="flex justify-end border-t border-slate-200 bg-slate-50/60 p-6">
          <div className="text-right">
            <p className="text-sm text-slate-500">
              Total Amount
            </p>

            <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-blue-700">
              ₹{sale.totalAmount?.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetails;