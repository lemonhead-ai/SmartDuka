"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi, type Shopkeeper } from "@/features/auth/api";
import { useGameplaySessionStore } from "@/features/gameplay/store";

type AuthContextValue = {
  shopkeeper: Shopkeeper | null;
  setShopkeeper: (shopkeeper: Shopkeeper | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [shopkeeper, setShopkeeperState] = useState<Shopkeeper | null>(null);
  const queryClient = useQueryClient();
  const clearAccountState = useCallback(() => {
    queryClient.removeQueries();
    useGameplaySessionStore.getState().clearSession();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("smart-duka-gameplay-session");
      window.localStorage.removeItem("smart-duka-profile-name");
      window.localStorage.removeItem("smart-duka-kid-profile");
    }
  }, [queryClient]);
  const setShopkeeper = useCallback((nextShopkeeper: Shopkeeper | null) => {
    clearAccountState();
    setShopkeeperState(nextShopkeeper);
  }, [clearAccountState]);
  const signOut = useCallback(async () => {
    await authApi.signOut();
    clearAccountState();
    setShopkeeperState(null);
  }, [clearAccountState]);

  return <AuthContext.Provider value={{ shopkeeper, setShopkeeper, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
