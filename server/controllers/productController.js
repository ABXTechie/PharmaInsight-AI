import asyncHandler from "express-async-handler";

import {
  createProduct as createProductService,
  getProducts as getProductsService,
  getProductById as getProductByIdService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "../services/productService.js";

export const createProduct = asyncHandler(async (req, res) => {
  const product = await createProductService(
    req.body,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const { search = "" } = req.query;

  const products = await getProductsService(
    req.user._id,
    search
  );

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await getProductByIdService(
    req.params.id,
    req.user._id
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await updateProductService(
    req.params.id,
    req.body,
    req.user._id
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await deleteProductService(
    req.params.id,
    req.user._id
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});