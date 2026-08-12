import asyncHandler from "express-async-handler";
import { getDashboardAnalytics } from "../services/analyticsService.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics(req.user._id);

  res.status(200).json(analytics);
});