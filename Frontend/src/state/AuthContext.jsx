import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../utils/api.js";

const AuthContext = createContext(null);

const storedToken = localStorage.getItem("am_token");
const storedUser = localStorage.getItem("am_user");

export function AuthProvider({ children }) {
  const [token, setToken] = useState(storedToken || null);
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);
  const [loading, setLoading] = useState(false);

  const saveSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("am_token", nextToken);
    localStorage.setItem("am_user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("am_token");
    localStorage.removeItem("am_user");
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      saveSession(data.token, data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      return await api.post("/auth/register", payload);
    } finally {
      setLoading(false);
    }
  };

  const updateStoredUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("am_user", JSON.stringify(nextUser));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      setUser: updateStoredUser,
      saveSession,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
