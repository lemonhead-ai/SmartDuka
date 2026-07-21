"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ToastViewport } from "@/components/ui/ToastViewport";
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { PreferencesProvider } from "@/components/theme/PreferencesProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000, gcTime: 300_000 }
        }
      })
  );

  return <PreferencesProvider><AccessibilityProvider><QueryClientProvider client={queryClient}><AuthProvider>{children}<ToastViewport /></AuthProvider></QueryClientProvider></AccessibilityProvider></PreferencesProvider>;
}
