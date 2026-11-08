import api from "./api";
import { clearPatternCache } from "./analyticsService";

export const getProducts = async (search = "") => {
  const response = await api.get("/products", {
    params: search ? { search } : {},
  });

  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);

  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  clearPatternCache();

  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  clearPatternCache();

  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  clearPatternCache();

  return response.data;
};