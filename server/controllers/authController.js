import { registerUser, loginUser } from "../services/authService.js";
import asyncHandler from "express-async-handler";

const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await loginUser(req.body);

  res.json({
    success: true,
    data: user,
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});
export { register, login, getProfile };