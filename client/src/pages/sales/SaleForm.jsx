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

  // Search UI state
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState({});

  // Currently open dropdown
  const [openDropdown, setOpenDropdown] = useState(null);

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

  // --------------------------------
  // Items
  // --------------------------------

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

    setProductSearch((currentSearch) => {
      const updatedSearch = { ...currentSearch };
      delete updatedSearch[index];
      return updatedSearch;
    });

    setOpenDropdown(null);
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

  // --------------------------------
  // Customer Search
  // --------------------------------

  const filteredCustomers =
    customerSearch.trim().length >= 1
      ? customers.filter((customerItem) => {
          const search = customerSearch.trim().toLowerCase();

          const name = customerItem.name?.toLowerCase() || "";
          const shopName = customerItem.shopName?.toLowerCase() || "";

          return (
            name.includes(search) ||
            shopName.includes(search)
          );
        })
      : [];

  const handleCustomerSearch = (value) => {
    setCustomerSearch(value);

    // User is typing again, so previous selection is no longer valid.
    setCustomer("");

    setOpenDropdown("customer");
  };

  const handleCustomerSelect = (customerItem) => {
    setCustomer(customerItem._id);

    setCustomerSearch(
      `${customerItem.name}${
        customerItem.shopName
          ? ` — ${customerItem.shopName}`
          : ""
      }`
    );

    setOpenDropdown(null);
  };

  // --------------------------------
  // Product Search
  // --------------------------------

  const getFilteredProducts = (index) => {
    const search = (productSearch[index] || "")
      .trim()
      .toLowerCase();

    if (!search) {
      return [];
    }

    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const company = product.company?.toLowerCase() || "";

      return (
        name.includes(search) ||
        company.includes(search)
      );
    });
  };

  const handleProductSearch = (index, value) => {
    setProductSearch((currentSearch) => ({
      ...currentSearch,
      [index]: value,
    }));

    // User is typing again, so previous product selection
    // is no longer considered valid.
    updateItem(index, "product", "");

    setOpenDropdown(`product-${index}`);
  };

  const handleProductSelect = (index, product) => {
    updateItem(index, "product", product._id);

    setProductSearch((currentSearch) => ({
      ...currentSearch,
      [index]: `${product.name}${
        product.company
          ? ` — ${product.company}`
          : ""
      }`,
    }));

    setOpenDropdown(null);
  };

  // --------------------------------
  // Total
  // --------------------------------

  const totalAmount = items.reduce((total, item) => {
    const subtotal =
      Number(item.quantity || 0) *
      Number(item.unitPrice || 0);

    return total + subtotal;
  }, 0);

  // --------------------------------
  // Submit
  // --------------------------------

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
        error.response?.data?.message ||
          "Failed to create sale"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6"
    >
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
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

                <div className="relative">
                  <input
                    id="customer"
                    type="text"
                    value={customerSearch}
                    onChange={(e) =>
                      handleCustomerSearch(e.target.value)
                    }
                    onFocus={() =>
                      setOpenDropdown("customer")
                    }
                    onBlur={() => {
                      setTimeout(() => {
                        setOpenDropdown((current) =>
                          current === "customer"
                            ? null
                            : current
                        );
                      }, 150);
                    }}
                    placeholder="Search customer..."
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  {/* Search Icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4 text-slate-400"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </div>

                  {/* Customer Results */}
                  {openDropdown === "customer" &&
                    customerSearch.trim().length >= 1 && (
                      <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map(
                            (customerItem) => (
                              <button
                                key={customerItem._id}
                                type="button"
                                onMouseDown={(e) =>
                                  e.preventDefault()
                                }
                                onClick={() =>
                                  handleCustomerSelect(
                                    customerItem
                                  )
                                }
                                className={`block min-h-[52px] w-full px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 active:bg-slate-100 ${
                                  customer ===
                                  customerItem._id
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-700"
                                }`}
                              >
                                <div className="font-medium">
                                  {customerItem.name}
                                </div>

                                {customerItem.shopName && (
                                  <div className="mt-0.5 text-xs text-slate-400">
                                    {customerItem.shopName}
                                  </div>
                                )}
                              </button>
                            )
                          )
                        ) : (
                          <div className="px-3 py-4 text-sm text-slate-500">
                            No customers found
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {!customerSearch && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Type to search customers
                  </p>
                )}
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
                  onChange={(e) =>
                    setSaleDate(e.target.value)
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Sale Items */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 sm:w-auto"
              >
                + Add Product
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item, index) => {
                const subtotal =
                  Number(item.quantity || 0) *
                  Number(item.unitPrice || 0);

                const filteredProducts =
                  getFilteredProducts(index);

                return (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 p-3 sm:p-4"
                  >
                    <div className="grid gap-4 md:grid-cols-12">
                      {/* Product */}
                      <div className="md:col-span-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Product
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            value={
                              productSearch[index] || ""
                            }
                            onChange={(e) =>
                              handleProductSearch(
                                index,
                                e.target.value
                              )
                            }
                            onFocus={() =>
                              setOpenDropdown(
                                `product-${index}`
                              )
                            }
                            onBlur={() => {
                              setTimeout(() => {
                                setOpenDropdown(
                                  (current) =>
                                    current ===
                                    `product-${index}`
                                      ? null
                                      : current
                                );
                              }, 150);
                            }}
                            placeholder="Search product..."
                            autoComplete="off"
                            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />

                          {/* Search Icon */}
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-4 w-4 text-slate-400"
                            >
                              <circle
                                cx="11"
                                cy="11"
                                r="7"
                              />
                              <path d="m20 20-3.5-3.5" />
                            </svg>
                          </div>

                          {/* Product Results */}
                          {openDropdown ===
                            `product-${index}` &&
                            productSearch[index]?.trim()
                              .length >= 1 && (
                              <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                {filteredProducts.length >
                                0 ? (
                                  filteredProducts.map(
                                    (product) => (
                                      <button
                                        key={product._id}
                                        type="button"
                                        onMouseDown={(e) =>
                                          e.preventDefault()
                                        }
                                        onClick={() =>
                                          handleProductSelect(
                                            index,
                                            product
                                          )
                                        }
                                        className={`block min-h-[56px] w-full px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 active:bg-slate-100 ${
                                          item.product ===
                                          product._id
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        <div className="font-medium">
                                          {product.name}
                                        </div>

                                        {product.company && (
                                          <div className="mt-0.5 text-xs text-slate-400">
                                            {
                                              product.company
                                            }
                                          </div>
                                        )}
                                      </button>
                                    )
                                  )
                                ) : (
                                  <div className="px-3 py-4 text-sm text-slate-500">
                                    No products found
                                  </div>
                                )}
                              </div>
                            )}
                        </div>

                        {!productSearch[index] && (
                          <p className="mt-1.5 text-xs text-slate-400">
                            Type to search products
                          </p>
                        )}
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
                            updateItem(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                            updateItem(
                              index,
                              "unitPrice",
                              e.target.value
                            )
                          }
                          placeholder="₹0"
                          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Subtotal
                        </label>

                        <div className="flex h-11 items-center rounded-lg bg-slate-50 px-3 text-sm font-medium text-slate-900">
                          ₹
                          {subtotal.toLocaleString(
                            "en-IN"
                          )}
                        </div>
                      </div>

                      {/* Remove */}
                      <div className="flex items-end justify-end md:col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(index)
                          }
                          disabled={items.length === 1}
                          className="w-full rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
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
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm text-slate-500">
                Total Amount
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Calculated from all sale items
              </p>
            </div>

            <p className="text-2xl font-semibold text-slate-900">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/sales")}
              className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:bg-slate-100 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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