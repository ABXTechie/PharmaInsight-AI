import asyncHandler from "express-async-handler";

import {
  createCustomer as createCustomerService,
  getCustomers as getCustomersService,
  getCustomerById as getCustomerByIdService,
  updateCustomer as updateCustomerService,
  deleteCustomer as deleteCustomerService,
} from "../services/customerService.js";

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await createCustomerService(
    req.body,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Customer created successfully",
    customer,
  });
});

export const getCustomers = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;

  const customers = await getCustomersService(
    req.user._id,
    search
  );

  res.status(200).json({
    success: true,
    count: customers.length,
    customers,
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await getCustomerByIdService(
    req.params.id,
    req.user._id
  );

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  res.status(200).json({
    success: true,
    customer,
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await updateCustomerService(
    req.params.id,
    req.body,
    req.user._id
  );

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  res.status(200).json({
    success: true,
    message: "Customer updated successfully",
    customer,
  });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await deleteCustomerService(
    req.params.id,
    req.user._id
  );

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  res.status(200).json({
    success: true,
    message: "Customer deleted successfully",
  });
});