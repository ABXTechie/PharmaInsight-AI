import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import usePatterns from "../../hooks/usePatterns";
import { ShareBar, TrendBadge } from "../../components/patterns/PatternBadges";
import ProductForm from "./ProductForm";
import Modal from "../../components/ui/Modal";
import Icon from "../../components/ui/Icon";
import {
  Alert,
  EmptyState,
  PageHeader,
  TableSkeleton,
} from "../../components/ui/Primitives";
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

  // Sales trend & customer reach per product (from /analytics/patterns)
  const { patterns } = usePatterns();
  const patternById = useMemo(
    () => new Map((patterns?.products || []).map((p) => [p.productId, p])),
    [patterns]
  );
  const buyingCustomers = patterns?.summary?.buyingCustomers || 0;

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
      <PageHeader
        eyebrow="Operations"
        title="Products"
        description="Manage your pharmaceutical product catalog"
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Product
          </button>
        }
      />

      <div className="relative w-full max-w-md">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          id="product-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className="input pl-9"
        />
      </div>

      {loading && <TableSkeleton label="Loading products" />}

      {error && <Alert>{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto card lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  <th className="th text-left">
                    Product
                  </th>

                  <th className="th text-left">
                    Category
                  </th>

                  {patterns && (
                    <>
                      <th className="th text-left">
                        30-day trend
                      </th>

                      <th className="th text-left">
                        Customers
                      </th>
                    </>
                  )}

                  <th className="th text-left">
                    Description
                  </th>

                  <th className="th text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product._id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/products/${product._id}`}
                        className="font-medium text-slate-900 hover:text-blue-700"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">{product.company}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {product.category}
                      </span>
                    </td>

                    {patterns && (
                    <>
                    <td className="px-6 py-4">
                      <TrendBadge trend={patternById.get(product._id)?.trend} />
                    </td>

                    <td className="px-6 py-4">
                      {patternById.get(product._id) && (
                        <div className="flex items-center gap-2">
                          <span className="tabular text-sm text-slate-700">
                            {patternById.get(product._id).customerCount}
                            <span className="text-slate-400"> / {buyingCustomers}</span>
                          </span>
                          <ShareBar value={patternById.get(product._id).reachPercent} className="w-12" />
                        </div>
                      )}
                    </td>
                    </>
                    )}

                    <td className="max-w-xs px-6 py-4 text-slate-500">
                      <p className="line-clamp-2">{product.description || "—"}</p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/products/${product._id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Link>

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

          {/* Mobile / Tablet Cards View */}
          <div className="space-y-3 lg:hidden">
            {products.map((product) => (
              <div
                key={product._id}
                className="card p-4"
              >
                {/* Product Header */}
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/products/${product._id}`}
                      className="truncate font-medium text-slate-900 hover:text-blue-700"
                    >
                      {product.name}
                    </Link>
                    <TrendBadge trend={patternById.get(product._id)?.trend} />
                  </div>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {product.company}
                  </p>

                  {patternById.get(product._id) && (
                    <p className="mt-1 text-xs text-slate-400">
                      Bought by {patternById.get(product._id).customerCount} of {buyingCustomers} customers
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Category
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {product.category}
                  </p>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {product.description || "No description available"}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center justify-end gap-4 border-t border-slate-100 pt-3">
                  <Link
                    to={`/products/${product._id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View
                  </Link>

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
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="card">
          <EmptyState
            icon="pill"
            title="No products found"
            description={search ? "Try a different product name, company or category." : "Add your first product to get started."}
          />
        </div>
      )}

      {showForm && (
        <Modal
          title={editingProduct ? "Edit Product" : "Add Product"}
          description={editingProduct ? "Update product information." : "Add a product to your catalog."}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        >
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
        </Modal>
      )}
    </div>
  );
};

export default Products;