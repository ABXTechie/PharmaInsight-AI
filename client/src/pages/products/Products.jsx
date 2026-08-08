import { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const fetchProducts = async (searchTerm = "") => {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts(searchTerm);
      setProducts(data.products);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (formData) => {
    setSaving(true);

    try {
      await createProduct(formData);
      setShowForm(false);
      await fetchProducts(search);
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleUpdateProduct = async (formData) => {
    setSaving(true);

    try {
      await updateProduct(editingProduct._id, formData);
      setShowForm(false);
      setEditingProduct(null);
      await fetchProducts(search);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    setDeletingProductId(productId);

    try {
      await deleteProduct(productId);
      await fetchProducts(search);
    } finally {
      setDeletingProductId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Products
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your pharmaceutical product catalog
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      <div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Loading products...
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
                  Product
                </th>

                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  Company
                </th>

                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  Category
                </th>

                <th className="px-6 py-3 text-left font-medium text-slate-600">
                  Description
                </th>

                <th className="px-6 py-3 text-right font-medium text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {product.name}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {product.company}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {product.category}
                  </td>

                  <td className="px-6 py-4 text-slate-600">
                    {product.description || "—"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={deletingProductId === product._id}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingProductId === product._id
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

      {!loading && !error && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="font-medium text-slate-900">
            No products found
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add your first product to get started.
          </p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingProduct
                    ? "Update product information."
                    : "Add a product to your catalog."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
                className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <ProductForm
              initialData={editingProduct || undefined}
              onSubmit={
                editingProduct
                  ? handleUpdateProduct
                  : handleCreateProduct
              }
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
              loading={saving}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;