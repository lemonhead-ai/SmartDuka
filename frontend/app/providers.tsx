"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { ToastViewport } from "@/components/ui/ToastViewport";
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { PreferencesProvider } from "@/components/theme/PreferencesProvider";
import { OfflineSyncManager } from "@/features/offline";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000, gcTime: 300_000 }
        }
      })
  );

  useEffect(() => {
    const syncManager = new OfflineSyncManager();
    syncManager.start();
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    return () => syncManager.stop();
  }, []);

  return <PreferencesProvider><AccessibilityProvider><QueryClientProvider client={queryClient}>{children}<ToastViewport /></QueryClientProvider></AccessibilityProvider></PreferencesProvider>;
}
