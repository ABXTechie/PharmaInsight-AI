import api from "./api";

export const getSalesReport = async ({
  startDate,
  endDate,
} = {}) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const response = await api.get("/reports/sales", {
    params,
  });

  return response.data;
};

export const downloadSalesReportPDF = async ({
  startDate,
  endDate,
} = {}) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const response = await api.get("/reports/sales/pdf", {
    params,
    responseType: "blob",
  });

  return response.data;
};

export const getCustomerSalesReport = async ({
  startDate,
  endDate,
} = {}) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const response = await api.get("/reports/customers", {
    params,
  });

  return response.data;
};

export const getProductSalesReport = async ({
  startDate,
  endDate,
} = {}) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const response = await api.get("/reports/products", {
    params,
  });

  return response.data;
};

export const getMonthlySalesReport = async ({
  startDate,
  endDate,
} = {}) => {
  const params = {};

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  const response = await api.get("/reports/monthly", {
    params,
  });

  return response.data;
};