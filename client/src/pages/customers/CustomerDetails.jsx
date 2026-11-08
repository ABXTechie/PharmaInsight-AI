import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCustomer } from "../../services/customerService";
import { getCustomerSales } from "../../services/saleService";
import { Alert, EmptyState, PageHeader, Skeleton } from "../../components/ui/Primitives";
import Icon from "../../components/ui/Icon";
import usePatterns from "../../hooks/usePatterns";
import CustomerPatternPanel from "../../components/patterns/CustomerPatternPanel";
import { StatusBadge } from "../../components/patterns/PatternBadges";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patterns, loading: patternsLoading, error: patternsError } = usePatterns();

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
      <div className="space-y-6" role="status" aria-label="Loading customer">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader backTo="/customers" backLabel="Back to Customers" title="Customer" />
        <Alert>{error}</Alert>
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
      <div>
        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to Customers
        </button>

        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Icon name="store" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                {customer.name}
              </h1>
              <StatusBadge status={patterns?.customers?.find((c) => c.customerId === id)?.status} size="lg" />
            </div>

            <p className="mt-0.5 truncate text-sm text-slate-500">
              {customer.shopName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-[13px] font-medium text-slate-500">
            This Month
          </p>

          <p className="tabular mt-2 text-[26px] font-semibold tracking-tight text-slate-900">
            {salesLoading ? "..." : `₹${thisMonthSales.toLocaleString("en-IN")}`}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-[13px] font-medium text-slate-500">
            Lifetime Sales
          </p>

          <p className="tabular mt-2 text-[26px] font-semibold tracking-tight text-slate-900">
            {salesLoading ? "..." : `₹${lifetimeSales.toLocaleString("en-IN")}`}
          </p>
        </div>
      </div>

      <CustomerPatternPanel
        customerId={id}
        sales={sales}
        salesLoading={salesLoading}
        patterns={patterns}
        patternsLoading={patternsLoading}
        patternsError={patternsError}
      />

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-slate-900">
          Customer Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Name
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Shop Name
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.shopName}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Phone
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.phone || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.email || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              GST Number
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              {customer.gstNumber || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">
            Sales History
          </h2>
          {!salesLoading && !salesError && sales.length > 0 && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {sales.length} {sales.length === 1 ? "sale" : "sales"}
            </span>
          )}
        </div>

        {salesLoading ? (
          <div className="space-y-4 p-6" role="status" aria-label="Loading sales history">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : salesError ? (
          <div className="p-6">
            <Alert>{salesError}</Alert>
          </div>
        ) : sales.length === 0 ? (
          <EmptyState compact icon="receipt" title="No sales recorded for this customer yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <Link
                key={sale._id}
                to={`/sales/${sale._id}`}
                className="block px-6 py-5 transition-colors hover:bg-slate-50/80"
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