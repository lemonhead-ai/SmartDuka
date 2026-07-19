"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { authApi, type Shopkeeper } from "@/features/auth/api";

type AuthContextValue = {
  shopkeeper: Shopkeeper | null;
  setShopkeeper: (shopkeeper: Shopkeeper | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [shopkeeper, setShopkeeper] = useState<Shopkeeper | null>(null);
  const signOut = useCallback(async () => {
    await authApi.signOut();
    setShopkeeper(null);
  }, []);

  return <AuthContext.Provider value={{ shopkeeper, setShopkeeper, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
