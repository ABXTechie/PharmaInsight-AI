import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCustomer } from "../../services/customerService";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            ₹—
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Sales data available after Sales module
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Lifetime Sales
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            ₹—
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Sales data available after Sales module
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

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Sales History
        </h2>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            No sales history yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Sales will appear here once the Sales module is available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;