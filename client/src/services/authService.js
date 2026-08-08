import api from "./api";

const register = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  return response.data;
};

const getProfile = async () => {
  const response = await api.get("/auth/profile");

  return response.data;
};

const authService = {
  register,
  login,
  getProfile,
};

export default authService;