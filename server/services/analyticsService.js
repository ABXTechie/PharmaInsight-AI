import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";

export const getDashboardAnalytics = async (userId) => {
  const now = new Date();

  // Start of today
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Start of tomorrow
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  // Start of current month
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  // Start of next month
  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  // Start of last 12 months
  const startOfLast12Months = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1
  );

  const [
    todayResult,
    monthResult,
    monthSalesCount,
    totalSales,
    customerCount,
    productCount,
    monthlyRevenue,
    topCustomers,
    topProducts,
    recentActivity
  ] = await Promise.all([
    Sale.aggregate([
      {
        $match: {
          createdBy: userId,
          saleDate: {
            $gte: startOfToday,
            $lt: startOfTomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]),

    Sale.aggregate([
      {
        $match: {
          createdBy: userId,
          saleDate: {
            $gte: startOfMonth,
            $lt: startOfNextMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]),

    Sale.countDocuments({
      createdBy: userId,
      saleDate: {
        $gte: startOfMonth,
        $lt: startOfNextMonth
      }
    }),

    Sale.countDocuments({
      createdBy: userId
    }),

    Customer.countDocuments({
      createdBy: userId
    }),

    Product.countDocuments({
      createdBy: userId
    }),

    Sale.aggregate([
      {
        $match: {
          createdBy: userId,
          saleDate: {
            $gte: startOfLast12Months,
            $lt: startOfNextMonth
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$saleDate"
            }
          },
          revenue: {
            $sum: "$totalAmount"
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]),

    Sale.aggregate([
      {
        $match: {
          createdBy: userId
        }
      },
      {
        $group: {
          _id: "$customer",
          revenue: {
            $sum: "$totalAmount"
          },
          orders: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          revenue: -1
        }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $project: {
          _id: 0,
          customerId: "$customer._id",
          name: "$customer.name",
          shopName: "$customer.shopName",
          revenue: 1,
          orders: 1
        }
      }
    ]),

    Sale.aggregate([
      {
        $match: {
          createdBy: userId
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.product",
          revenue: {
            $sum: "$items.subtotal"
          },
          unitsSold: {
            $sum: "$items.quantity"
          }
        }
      },
      {
        $sort: {
          revenue: -1
        }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          company: "$product.company",
          revenue: 1,
          unitsSold: 1
        }
      }
    ]),

    Sale.aggregate([
      {
        $match: {
          createdBy: userId
        }
      },
      {
        $sort: {
          saleDate: -1
        }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: "$customer"
      },
      {
        $project: {
          _id: 0,
          saleId: "$_id",
          customerName: "$customer.name",
          shopName: "$customer.shopName",
          totalAmount: 1,
          saleDate: 1
        }
      }
    ])
  ]);

  const revenueToday = todayResult[0]?.revenue || 0;
  const revenueThisMonth = monthResult[0]?.revenue || 0;

  const averageOrderValue =
    monthSalesCount > 0
      ? revenueThisMonth / monthSalesCount
      : 0;

  const monthlyRevenueMap = new Map(
    monthlyRevenue.map((item) => [
      item._id,
      item.revenue
    ])
  );

  const formattedMonthlyRevenue = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    const key = `${year}-${month}`;

    formattedMonthlyRevenue.push({
      month: date.toLocaleString("en-US", {
        month: "short"
      }),
      revenue: monthlyRevenueMap.get(key) || 0
    });
  }

  return {
    revenueToday,
    revenueThisMonth,
    totalSales,
    customerCount,
    productCount,
    averageOrderValue,
    monthlyRevenue: formattedMonthlyRevenue,
    topCustomers,
    topProducts,
    recentActivity
  };
};