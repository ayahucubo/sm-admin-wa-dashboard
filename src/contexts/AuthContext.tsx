"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeClientToken, AuthPayload } from "@/utils/auth";

interface AuthContextType {
  token: string | null;
  user: AuthPayload | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('AuthContext: Initializing authentication state...');
    const t = localStorage.getItem("token");
    if (t) {
      console.log('AuthContext: Found token in localStorage, decoding...');
      setToken(t);
      const decoded = decodeClientToken(t);
      if (decoded) {
        setUser(decoded);
        console.log('AuthContext: Token restored for user:', decoded.email, 'with role:', decoded.role);
      } else {
        // Token is invalid, remove it
        console.log('AuthContext: Invalid token found, removing...');
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    } else {
      console.log('AuthContext: No token found in localStorage');
    }
    setIsLoading(false);
    console.log('AuthContext: Authentication state initialization complete');
  }, []);

  const login = (t: string) => {
    localStorage.setItem("token", t);
    setToken(t);
    const decoded = decodeClientToken(t);
    if (decoded) {
      setUser(decoded);
      console.log('User logged in:', decoded.email, 'with role:', decoded.role);
    }
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsLoading(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus di dalam AuthProvider");
  return ctx;
} 