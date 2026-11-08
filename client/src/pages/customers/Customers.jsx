import { useEffect, useMemo, useState } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/customerService";
import CustomerForm from "./CustomerForm";
import { Link, useSearchParams } from "react-router-dom";
import usePatterns from "../../hooks/usePatterns";
import { StatusBadge } from "../../components/patterns/PatternBadges";
import { CUSTOMER_STATUS, STATUS_ORDER } from "../../components/patterns/patternMeta";
import Modal from "../../components/ui/Modal";
import Icon from "../../components/ui/Icon";
import {
  Alert,
  EmptyState,
  PageHeader,
  TableSkeleton,
} from "../../components/ui/Primitives";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

  // Buying-pattern status per customer (from /analytics/patterns)
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";
  const { patterns } = usePatterns();

  const patternById = useMemo(
    () => new Map((patterns?.customers || []).map((c) => [c.customerId, c])),
    [patterns]
  );

  const statusCounts = patterns?.summary?.statusCounts || {};

  const visibleCustomers = statusFilter
    ? customers.filter((customer) => patternById.get(customer._id)?.status === statusFilter)
    : customers;

  const setStatusFilter = (status) => {
    const next = new URLSearchParams(searchParams);
    if (status) next.set("status", status);
    else next.delete("status");
    setSearchParams(next, { replace: true });
  };

  const lastOrderText = (customerId) => {
    const pattern = patternById.get(customerId);
    if (!pattern) return patterns ? "No orders yet" : "";
    const days = pattern.daysSinceLastOrder;
    return days === 0 ? "Ordered today" : `Last order ${days} ${days === 1 ? "day" : "days"} ago`;
  };

  const handleCreateCustomer = async (formData) => {
    setSaving(true);

    try {
      await createCustomer(formData);
      setShowForm(false);
      await fetchCustomers(search);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleUpdateCustomer = async (formData) => {
    setSaving(true);

    try {
      await updateCustomer(editingCustomer._id, formData);
      setShowForm(false);
      setEditingCustomer(null);
      await fetchCustomers(search);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    setDeletingCustomerId(customerId);

    try {
      await deleteCustomer(customerId);
      await fetchCustomers(search);
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const fetchCustomers = async (searchTerm = "") => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers(searchTerm);
      setCustomers(data.customers);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Customers"
        description="Manage your pharmaceutical customers"
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Customer
          </button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-md">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <label htmlFor="customer-search" className="sr-only">Search customers</label>
        <input
          id="customer-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="input pl-9"
        />
      </div>

      {Object.keys(statusCounts).length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by buying status">
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            aria-pressed={!statusFilter}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !statusFilter ? "bg-ink-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {STATUS_ORDER.filter((status) => statusCounts[status]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(statusFilter === status ? "" : status)}
              aria-pressed={statusFilter === status}
              title={CUSTOMER_STATUS[status].help}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === status
                  ? "bg-ink-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${CUSTOMER_STATUS[status].dot}`} aria-hidden="true" />
              {CUSTOMER_STATUS[status].label}
              <span className="tabular opacity-70">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      )}
      </div>

      {loading && <TableSkeleton label="Loading customers" />}

      {error && <Alert>{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto card lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  <th className="th text-left">
                    Name
                  </th>

                  <th className="th text-left">
                    Shop
                  </th>

                  {patterns && (
                    <th className="th text-left">
                      Buying status
                    </th>
                  )}

                  <th className="th text-left">
                    This Month
                  </th>

                  <th className="th text-left">
                    Lifetime Sales
                  </th>

                  <th className="th text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleCustomers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {customer.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {customer.email || customer.phone || "No contact information"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {customer.shopName}
                    </td>

                    {patterns && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={patternById.get(customer._id)?.status} />
                          <span className="text-xs text-slate-400">{lastOrderText(customer._id)}</span>
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4 font-medium text-slate-900">
                      ₹{Number(customer.thisMonthSales || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-900">
                      ₹{Number(customer.lifetimeSales || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/customers/${customer._id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleEditCustomer(customer)}
                          className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(customer._id)}
                          disabled={deletingCustomerId === customer._id}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingCustomerId === customer._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Card View */}
          <div className="space-y-3 lg:hidden">
            {visibleCustomers.map((customer) => (
              <div
                key={customer._id}
                className="card p-4"
              >
                {/* Customer */}
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium text-slate-900">
                      {customer.name}
                    </p>
                    <StatusBadge status={patternById.get(customer._id)?.status} />
                  </div>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {customer.email ||
                      customer.phone ||
                      "No contact information"}
                  </p>

                  {lastOrderText(customer._id) && (
                    <p className="mt-1 text-xs text-slate-400">{lastOrderText(customer._id)}</p>
                  )}
                </div>

                {/* Shop */}
                <div className="mt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Shop
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {customer.shopName}
                  </p>
                </div>

                {/* Sales */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">
                      This Month
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      ₹
                      {Number(
                        customer.thisMonthSales || 0
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">
                      Lifetime Sales
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      ₹
                      {Number(
                        customer.lifetimeSales || 0
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-3">
                  <Link
                    to={`/customers/${customer._id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleEditCustomer(customer)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteCustomer(customer._id)
                    }
                    disabled={
                      deletingCustomerId === customer._id
                    }
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingCustomerId === customer._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && visibleCustomers.length === 0 && (
        <div className="card">
          <EmptyState
            icon="users"
            title={
              statusFilter
                ? `No ${CUSTOMER_STATUS[statusFilter]?.label.toLowerCase() || ""} customers${search ? " match your search" : ""}`
                : search
                  ? "No customers match your search"
                  : "No customers yet"
            }
            description={
              statusFilter
                ? "Clear the status filter to see everyone."
                : search
                  ? "Try a different name, shop or contact."
                  : "Add your first customer to get started."
            }
          />
        </div>
      )}

      {showForm && (
        <Modal
          title={editingCustomer ? "Edit Customer" : "Add Customer"}
          description={editingCustomer ? "Update customer information." : "Add a new customer to your business."}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        >
            <CustomerForm
              initialData={editingCustomer || undefined}
              onSubmit={
                editingCustomer
                  ? handleUpdateCustomer
                  : handleCreateCustomer
              }
              onCancel={() => {
                setShowForm(false);
                setEditingCustomer(null);
              }}
              loading={saving}
            />
        </Modal>
      )}
    </div>
  );
};

export default Customers;