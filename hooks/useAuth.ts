// hooks/useAuth.ts
import { useState, useEffect } from "react";

interface UserClaims {
  User: string;
  Name: string;
  UserId: string;
  role: string;
}

// Função para decodificar JWT
const decodeJWT = (token: string): UserClaims | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64));

    // Verifica se o token está expirado
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      User: decoded.User || "",
      Name: decoded.Name || "",
      UserId: decoded.UserId || "",
      role: decoded.role || "User",
    };
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const claims = decodeJWT(token);
      setUser(claims);
    }
    setLoading(false);
  }, []);

  const isAdmin = user?.role === "Admin";

  return {
    user,
    isAdmin,
    loading,
  };
};
