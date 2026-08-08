import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  // Restore user when application starts/refreshed
  useEffect(() => {
    const restoreUser = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();

        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    const { token, ...userData } = response.data;

    localStorage.setItem("token", token);

    setToken(token);
    setUser(userData);

    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);

    const { token, ...newUser } = response.data;

    localStorage.setItem("token", token);

    setToken(token);
    setUser(newUser);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};