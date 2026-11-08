import express from "express";
import {
  chatWithAI,
  streamChatWithAI,
  getAIInsights,
  getWeeklyBrief,
  getTalkingPoints,
} from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat/stream", protect, streamChatWithAI);
router.post("/chat", protect, chatWithAI);
router.post("/insights", protect, getAIInsights);
router.post("/brief", protect, getWeeklyBrief);
router.post("/customers/:id/talking-points", protect, getTalkingPoints);

export default router;