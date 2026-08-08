import { useEffect, useState } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/customerService";
import CustomerForm from "./CustomerForm";
import { Link } from "react-router-dom";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Customers
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your pharmaceutical customers
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        + Add Customer
      </button>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Loading customers...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  Name
                </th>

                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  Shop
                </th>

                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  This Month
                </th>

                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  LifeTime Sales
                </th>

                <th className="px-6 py-3 text-right font-medium text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr
                  key={customer._id}
                  className="transition hover:bg-slate-50"
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

                  <td className="px-6 py-4 font-medium text-slate-900">
                    —
                  </td>

                  <td className="px-6 py-4 font-medium text-slate-900">
                    —
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
      )}

      {!loading && !error && customers.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="font-medium text-slate-900">
            No customers yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add your first customer to get started.
          </p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new customer to your business.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;