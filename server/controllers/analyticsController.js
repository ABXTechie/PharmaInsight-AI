import asyncHandler from "express-async-handler";
import { getDashboardAnalytics } from "../services/analyticsService.js";
import { getPatternInsights } from "../services/patternService.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics(req.user._id);

  res.status(200).json(analytics);
});

// Customer & product pattern signals (retention, trends, cross-sell).
export const getPatterns = asyncHandler(async (req, res) => {
  const patterns = await getPatternInsights(req.user._id);

  res.status(200).json(patterns);
});
