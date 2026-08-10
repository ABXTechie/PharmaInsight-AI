import { setServers } from "node:dns/promises";
setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";
import customerRoutes from "./routes/customerRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Frontend connected to backend successfully",
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PharmaInsight AI Backend Running 🚀",
  });
});

const PORT = process.env.PORT || 5000;

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});