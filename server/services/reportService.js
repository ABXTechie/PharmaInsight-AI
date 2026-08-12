import Sale from "../models/Sale.js";
import { getDateRange } from "../utils/dateRange.js";

export const getSalesReport = async (
  userId,
  startDate,
  endDate
) => {
  const dateRange = getDateRange({
    startDate,
    endDate,
  });

  const matchStage = {
    createdBy: userId,
  };

  if (dateRange) {
    matchStage.saleDate = dateRange;
  }

  const [summaryResult, sales] = await Promise.all([
    Sale.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$totalAmount",
          },
          totalSales: {
            $sum: 1,
          },
        },
      },
    ]),

    Sale.aggregate([
      {
        $match: matchStage,
      },
      {
        $sort: {
          saleDate: -1,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: "$customer",
      },
      {
        $project: {
          _id: 0,
          saleId: "$_id",
          date: "$saleDate",
          customer: "$customer.name",
          shopName: "$customer.shopName",
          itemCount: {
            $size: "$items",
          },
          amount: "$totalAmount",
        },
      },
    ]),
  ]);

  const totalRevenue =
    summaryResult[0]?.totalRevenue || 0;

  const totalSales =
    summaryResult[0]?.totalSales || 0;

  const averageOrderValue =
    totalSales > 0
      ? totalRevenue / totalSales
      : 0;

  return {
    summary: {
      totalRevenue,
      totalSales,
      averageOrderValue,
    },
    sales,
  };
};

export const getCustomerSalesReport = async (
  userId,
  startDate,
  endDate
) => {
  const dateRange = getDateRange({
    startDate,
    endDate,
  });

  const matchStage = {
    createdBy: userId,
  };

  if (dateRange) {
    matchStage.saleDate = dateRange;
  }

  const customerReport = await Sale.aggregate([
    {
      $match: matchStage,
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$customer",
        totalRevenue: {
          $sum: "$items.subtotal",
        },
        totalUnits: {
          $sum: "$items.quantity",
        },
        totalSales: {
          $addToSet: "$_id",
        },
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $unwind: "$customer",
    },
    {
      $project: {
        _id: 0,
        customerId: "$customer._id",
        name: "$customer.name",
        shopName: "$customer.shopName",
        totalRevenue: 1,
        totalUnits: 1,
        totalSales: {
          $size: "$totalSales",
        },
      },
    },
    {
      $sort: {
        totalRevenue: -1,
      },
    },
  ]);

  return customerReport;
};

export const getProductSalesReport = async (
  userId,
  startDate,
  endDate
) => {
  const dateRange = getDateRange({
    startDate,
    endDate,
  });

  const matchStage = {
    createdBy: userId,
  };

  if (dateRange) {
    matchStage.saleDate = dateRange;
  }

  const productReport = await Sale.aggregate([
    {
      $match: matchStage,
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.product",
        totalRevenue: {
          $sum: "$items.subtotal",
        },
        totalUnits: {
          $sum: "$items.quantity",
        },
        totalSales: {
          $addToSet: "$_id",
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $project: {
        _id: 0,
        productId: "$product._id",
        name: "$product.name",
        company: "$product.company",
        totalRevenue: 1,
        totalUnits: 1,
        totalSales: {
          $size: "$totalSales",
        },
      },
    },
    {
      $sort: {
        totalRevenue: -1,
      },
    },
  ]);

  return productReport;
};

export const getMonthlySalesReport = async (
  userId,
  startDate,
  endDate
) => {
  const dateRange = getDateRange({
    startDate,
    endDate,
  });

  const matchStage = {
    createdBy: userId,
  };

  if (dateRange) {
    matchStage.saleDate = dateRange;
  }

  const monthlyReport = await Sale.aggregate([
    {
      $match: matchStage,
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: {
          year: {
            $year: "$saleDate",
          },
          month: {
            $month: "$saleDate",
          },
        },
        totalRevenue: {
          $sum: "$items.subtotal",
        },
        totalUnits: {
          $sum: "$items.quantity",
        },
        totalSales: {
          $addToSet: "$_id",
        },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        totalRevenue: 1,
        totalUnits: 1,
        totalSales: {
          $size: "$totalSales",
        },
      },
    },
    {
      $sort: {
        year: 1,
        month: 1,
      },
    },
  ]);

  return monthlyReport;
};