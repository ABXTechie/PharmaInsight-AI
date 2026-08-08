import Product from "../models/Product.js";

export const createProduct = async (productData, userId) => {
  const product = await Product.create({
    ...productData,
    createdBy: userId,
  });

  return product;
};

export const getProducts = async (userId, search = "") => {
  const query = {
    createdBy: userId,
  };

  if (search.trim()) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  return Product.find(query).sort({ createdAt: -1 });
};

export const getProductById = async (productId, userId) => {
  return Product.findOne({
    _id: productId,
    createdBy: userId,
  });
};

export const updateProduct = async (
  productId,
  productData,
  userId
) => {
  return Product.findOneAndUpdate(
    {
      _id: productId,
      createdBy: userId,
    },
    productData,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const deleteProduct = async (productId, userId) => {
  return Product.findOneAndDelete({
    _id: productId,
    createdBy: userId,
  });
};