import asyncHandler from "express-async-handler";
import {
  createSale as createSaleService,
  getSales as getSalesService,
  getSaleById,
  deleteSale as deleteSaleService,
  getCustomerSales as getCustomerSalesService,
} from "../services/saleService.js";

const createSale = asyncHandler(async (req, res) => {
  const sale = await createSaleService(req.body, req.user._id);

  res.status(201).json({
    message: "Sale created successfully",
    sale,
  });
});

const getSales = asyncHandler(async (req, res) => {
  const sales = await getSalesService(req.user._id);

  res.status(200).json({
    sales,
  });
});

const getSale = asyncHandler(async (req, res) => {
  const sale = await getSaleById(req.params.id, req.user._id);

  res.status(200).json({
    sale,
  });
});

const deleteSale = asyncHandler(async (req, res) => {
  await deleteSaleService(req.params.id, req.user._id);

  res.status(200).json({
    message: "Sale deleted successfully",
  });
});

const getCustomerSales = asyncHandler(async (req, res) => {
  const sales = await getCustomerSalesService(
    req.params.customerId,
    req.user._id
  );

  res.status(200).json({
    sales,
  });
});

export { createSale, getSales, getSale, deleteSale, getCustomerSales };