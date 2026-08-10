import express from "express";
import {
  getSalesReportController, generateSalesReportPDFController, getCustomerSalesReportController,
  getProductSalesReportController, getMonthlySalesReportController,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/sales/pdf",
  protect,
  generateSalesReportPDFController
);

router.get(
  "/sales",
  protect,
  getSalesReportController
);

router.get(
  "/customers",
  protect,
  getCustomerSalesReportController
);

router.get(
  "/products",
  protect,
  getProductSalesReportController
);

router.get(
  "/monthly",
  protect,
  getMonthlySalesReportController
);


export default router;