import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Token tidak lagi disimpan di localStorage — ada di HttpOnly cookie.
    // Cek session aktif via /auth/me agar state user & school ter-restore saat refresh.
    api
      .get("/auth/me")
      .then((res) => {
        const { user, school } = res.data.data;
        setUser(user);
        setSchool(school ?? null);
      })
      .catch(() => {
        setUser(null);
        setSchool(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (loginVal, password) => {
    const res = await api.post("/auth/login", {
      login: loginVal,
      password,
    });
    // Token ada di HttpOnly cookie — tidak perlu disimpan secara manual.
    const { user, school } = res.data.data;
    setUser(user);
    setSchool(school ?? null);
    return user;
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const updateSchool = (updatedFields) => {
    setSchool((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      // Cookie di-clear oleh backend. Cukup reset state.
      setUser(null);
      setSchool(null);
    }
  };

  /**
   * Cek apakah user aktif memiliki permission tertentu.
   * Permission disimpan di user.permissions (array string slug).
   * Operator mendapat semua permission — shortcircuit via role check.
   */
  const hasPermission = (slug) => {
    if (!user) return false;
    if (user.roles?.includes("operator")) return true;
    return Array.isArray(user.permissions) && user.permissions.includes(slug);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        loading,
        login,
        logout,
        updateUser,
        updateSchool,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
