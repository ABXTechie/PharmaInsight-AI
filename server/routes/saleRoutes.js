import express from "express";
import {
  createSale,
  updateSale,
  getSales,
  getSale,
  deleteSale,
  getCustomerSales,
} from "../controllers/saleController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, createSale)
  .get(protect, getSales);


router.get(
  "/customer/:customerId",
  protect,
  getCustomerSales
);

router
  .route("/:id")
  .get(protect, getSale)
  .put(protect, updateSale)
  .delete(protect, deleteSale);

export default router;