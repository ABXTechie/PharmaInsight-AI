import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";

const createSale = async (saleData, userId) => {
  const { customer, items, saleDate } = saleData;

  // 1. Validate customer
  if (!customer || !mongoose.Types.ObjectId.isValid(customer)) {
    throw new Error("Invalid customer");
  }

  const customerExists = await Customer.findOne({
    _id: customer,
    createdBy: userId,
  });

  if (!customerExists) {
    throw new Error("Customer not found");
  }

  // 2. Validate sale items
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("A sale must contain at least one product");
  }

  // 3. Collect product IDs
  const productIds = items.map((item) => item.product);

  // 4. Validate product IDs
  const hasInvalidProductId = productIds.some(
    (id) => !mongoose.Types.ObjectId.isValid(id)
  );

  if (hasInvalidProductId) {
    throw new Error("Invalid product ID");
  }

  // 5. Fetch only products belonging to this user
  const products = await Product.find({
    _id: { $in: productIds },
    createdBy: userId,
  });

  // 6. Make sure every requested product exists
  if (products.length !== productIds.length) {
    throw new Error("One or more products not found");
  }

  // 7. Calculate subtotals and total on the backend
  const processedItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("Unit price cannot be negative");
    }

    const subtotal = quantity * unitPrice;

    return {
      product: item.product,
      quantity,
      unitPrice,
      subtotal,
    };
  });

  const totalAmount = processedItems.reduce(
    (total, item) => total + item.subtotal,
    0
  );

  // 8. Create the sale using authenticated user ID
  const sale = await Sale.create({
    customer,
    items: processedItems,
    totalAmount,
    saleDate: saleDate || new Date(),
    createdBy: userId,
  });

  return sale;
};

const getSales = async (userId) => {
  return Sale.find({ createdBy: userId })
    .populate("customer", "name shopName")
    .populate("items.product", "name company category")
    .sort({ saleDate: -1 });
};

const getSaleById = async (saleId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    throw new Error("Invalid sale ID");
  }

  const sale = await Sale.findOne({
    _id: saleId,
    createdBy: userId,
  })
    .populate("customer", "name shopName phone email")
    .populate("items.product", "name company category");

  if (!sale) {
    throw new Error("Sale not found");
  }

  return sale;
};

const deleteSale = async (saleId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(saleId)) {
    throw new Error("Invalid sale ID");
  }

  const sale = await Sale.findOneAndDelete({
    _id: saleId,
    createdBy: userId,
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  return sale;
};


const getCustomerSales = async (customerId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new Error("Invalid customer ID");
  }

  const sales = await Sale.find({
    customer: customerId,
    createdBy: userId,
  })
    .populate("items.product", "name company category")
    .sort({ saleDate: -1 });

  return sales;
};

export { createSale, getSales, getSaleById, deleteSale, getCustomerSales };