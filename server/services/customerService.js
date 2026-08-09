import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import mongoose from "mongoose";

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

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { shopName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const customers = await Customer.find(query).sort({
    createdAt: -1,
  });

  const customerIds = customers.map((customer) => customer._id);

  if (customerIds.length === 0) {
    return [];
  }

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const salesMetrics = await Sale.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        customer: { $in: customerIds },
      },
    },
    {
      $group: {
        _id: "$customer",

        lifetimeSales: {
          $sum: "$totalAmount",
        },

        thisMonthSales: {
          $sum: {
            $cond: [
              {
                $gte: ["$saleDate", startOfMonth],
              },
              "$totalAmount",
              0,
            ],
          },
        },
      },
    },
  ]);

  const metricsMap = new Map(
    salesMetrics.map((metric) => [
      metric._id.toString(),
      {
        lifetimeSales: metric.lifetimeSales,
        thisMonthSales: metric.thisMonthSales,
      },
    ])
  );

  return customers.map((customer) => {
    const metrics = metricsMap.get(customer._id.toString());

    return {
      ...customer.toObject(),

      thisMonthSales: metrics?.thisMonthSales || 0,

      lifetimeSales: metrics?.lifetimeSales || 0,
    };
  });
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