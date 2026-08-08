import Customer from "../models/Customer.js";

export const createCustomer = async (customerData, userId) => {
  const customer = await Customer.create({
    ...customerData,
    createdBy: userId,
  });

  return customer;
};

export const getCustomers = async (userId, search = "") => {
  const query = {
    createdBy: userId,
  };

  if (search.trim()) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { shopName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  return Customer.find(query).sort({ createdAt: -1 });
};

export const getCustomerById = async (customerId, userId) => {
  return Customer.findOne({
    _id: customerId,
    createdBy: userId,
  });
};

export const updateCustomer = async (
  customerId,
  customerData,
  userId
) => {
  return Customer.findOneAndUpdate(
    {
      _id: customerId,
      createdBy: userId,
    },
    customerData,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const deleteCustomer = async (customerId, userId) => {
  return Customer.findOneAndDelete({
    _id: customerId,
    createdBy: userId,
  });
};