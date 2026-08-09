import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCustomer } from "../../services/customerService";
import { getCustomerSales } from "../../services/saleService";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomer(id);
        setCustomer(data.customer);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load customer"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const fetchCustomerSales = async () => {
      try {
        setSalesLoading(true);
        setSalesError("");

        const data = await getCustomerSales(id);
        setSales(data.sales || []);
      } catch (error) {
        setSalesError(
          error.response?.data?.message ||
            "Failed to load customer sales"
        );
      } finally {
        setSalesLoading(false);
      }
    };

    if (id) {
      fetchCustomerSales();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          Loading customer...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/customers"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Customers
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const lifetimeSales = sales.reduce(
    (total, sale) => total + Number(sale.totalAmount || 0),
    0
  );

  const thisMonthSales = sales
    .filter((sale) => new Date(sale.saleDate) >= startOfMonth)
    .reduce(
      (total, sale) => total + Number(sale.totalAmount || 0),
      0
    );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/customers")}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Back to Customers
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {customer.name}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {customer.shopName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            This Month
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {salesLoading ? "..." : `₹${thisMonthSales.toLocaleString("en-IN")}`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Lifetime Sales
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {salesLoading ? "..." : `₹${lifetimeSales.toLocaleString("en-IN")}`}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Customer Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">
              Name
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Shop Name
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.shopName}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Phone
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.phone || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Email
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.email || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              GST Number
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.gstNumber || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Address
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.address || "—"}
            </p>
          </div>
        </div>

        {customer.notes && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-sm text-slate-500">
              Notes
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {customer.notes}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900">
            Sales History
          </h2>
        </div>

        {salesLoading ? (
          <div className="p-6">
            <p className="text-sm text-slate-500">
              Loading sales history...
            </p>
          </div>
        ) : salesError ? (
          <div className="p-6">
            <p className="text-sm text-red-600">
              {salesError}
            </p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-slate-500">
              No sales recorded for this customer yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <Link
                key={sale._id}
                to={`/sales/${sale._id}`}
                className="block p-6 transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Sale Information */}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {sale.items?.length || 0}{" "}
                      {sale.items?.length === 1 ? "item" : "items"}
                    </p>

                    {/* Product List */}
                    <div className="mt-2 space-y-1">
                      {sale.items?.map((item, index) => (
                        <p
                          key={index}
                          className="text-sm text-slate-600"
                        >
                          {item.product?.name || "Unknown product"} ×{" "}
                          {item.quantity}
                        </p>
                      ))}
                    </div>

                    {/* Date */}
                    <p className="mt-3 text-xs text-slate-400">
                      {new Date(sale.saleDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      ₹{sale.totalAmount?.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-xs text-blue-600">
                      View sale →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;