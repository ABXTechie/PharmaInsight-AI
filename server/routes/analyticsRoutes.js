import express from "express";
import { getDashboard, getPatterns } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, getDashboard);
router.get("/patterns", protect, getPatterns);

export default router;