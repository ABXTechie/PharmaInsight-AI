import api from "./api";
import { clearPatternCache } from "./analyticsService";

export const getSales = async () => {
  const response = await api.get("/sales");
  return response.data;
};

export const getSale = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (saleData) => {
  const response = await api.post("/sales", saleData);
  clearPatternCache();
  return response.data;
};

export const updateSale = async (id, saleData) => {
  const response = await api.put(`/sales/${id}`, saleData);
  clearPatternCache();
  return response.data;
};

export const deleteSale = async (id) => {
  const response = await api.delete(`/sales/${id}`);
  clearPatternCache();
  return response.data;
};

export const getCustomerSales = async (customerId) => {
  const response = await api.get(`/sales/customer/${customerId}`);
  return response.data;
};
