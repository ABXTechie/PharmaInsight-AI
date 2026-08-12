import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../../services/customerService";
import { getProducts } from "../../services/productService";
import { createSale } from "../../services/saleService";

const SaleForm = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customer, setCustomer] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState([
    {
      product: "",
      quantity: 1,
      unitPrice: "",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        setError("");

        const [customerData, productData] = await Promise.all([
          getCustomers(),
          getProducts(),
        ]);

        setCustomers(customerData.customers);
        setProducts(productData.products);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load customers and products"
        );
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        product: "",
        quantity: 1,
        unitPrice: "",
      },
    ]);
  };

  const removeItem = (index) => {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const updateItem = (index, field, value) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const totalAmount = items.reduce((total, item) => {
    const subtotal =
      Number(item.quantity || 0) * Number(item.unitPrice || 0);

    return total + subtotal;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!customer) {
        setError("Please select a customer");
        return;
      }

      const hasInvalidItem = items.some(
        (item) =>
          !item.product ||
          Number(item.quantity) <= 0 ||
          item.unitPrice === "" ||
          Number(item.unitPrice) < 0
      );

      if (hasInvalidItem) {
        setError(
          "Please provide a valid product, quantity, and selling price for every item"
        );
        return;
      }

      const saleData = {
        customer,
        saleDate,
        items: items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      await createSale(saleData);

      navigate("/sales");
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to create sale"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Record Sale
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a new sales transaction.
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Loading customers and products...
          </p>
        </div>
      ) : (
        <>
          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Sale Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">
              Sale Information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {/* Customer */}
              <div>
                <label
                  htmlFor="customer"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Customer
                </label>

                <select
                  id="customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select customer</option>

                  {customers.map((customerItem) => (
                    <option
                      key={customerItem._id}
                      value={customerItem._id}
                    >
                      {customerItem.name}
                      {customerItem.shopName
                        ? ` — ${customerItem.shopName}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sale Date */}
              <div>
                <label
                  htmlFor="saleDate"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Sale Date
                </label>

                <input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Sale Items */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Products
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add the products included in this sale.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                + Add Product
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item, index) => {
                const subtotal =
                  Number(item.quantity || 0) * Number(item.unitPrice || 0);

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-12">
                      {/* Product */}
                      <div className="md:col-span-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Product
                        </label>

                        <select
                          value={item.product}
                          onChange={(e) =>
                            updateItem(index, "product", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Select product</option>

                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                              {product.company
                                ? ` — ${product.company}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Quantity
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {/* Selling Price */}
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Selling Price
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", e.target.value)
                          }
                          placeholder="₹0"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Subtotal
                        </label>

                        <div className="flex h-[42px] items-center rounded-lg bg-slate-50 px-3 text-sm font-medium text-slate-900">
                          ₹{subtotal.toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="flex items-end justify-end md:col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sale Total */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-sm text-slate-500">Total Amount</p>
              <p className="mt-1 text-xs text-slate-400">
                Calculated from all sale items
              </p>
            </div>

            <p className="text-2xl font-semibold text-slate-900">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/sales")}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Recording..." : "Record Sale"}
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default SaleForm;