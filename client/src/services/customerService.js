import api from "./api";
import { clearPatternCache } from "./analyticsService";

export const getCustomers = async (search = "") => {
  const response = await api.get("/customers", {
    params: search ? { search } : {},
  });

  return response.data;
};

export const getCustomer = async (id) => {
  const response = await api.get(`/customers/${id}`);

  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await api.post("/customers", customerData);
  clearPatternCache();

  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  clearPatternCache();

  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  clearPatternCache();

  return response.data;
};