import React, { createContext, useContext, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function isValidUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "number" && typeof v.username === "string" && typeof v.role === "string";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: userRaw, isLoading, refetch, isError } = useGetMe({
    query: {
      retry: false,
    }
    ,
    request: {
      // If `/api/*` accidentally rewrites to `index.html`, this forces JSON parsing
      // and makes the request fail instead of treating HTML as "user".
      responseType: "json",
    },
  });

  const user = isValidUser(userRaw) ? userRaw : null;
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isLoading && isError && !location.startsWith("/verify") && location !== "/login") {
      setLocation("/login");
    }
  }, [isLoading, isError, location, setLocation]);

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, isAuthenticated, refetchUser: refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
