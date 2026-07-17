"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { ToastViewport } from "@/components/ui/ToastViewport";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { OfflineSyncManager } from "@/features/offline";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
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

  return <ThemeProvider><QueryClientProvider client={queryClient}>{children}<ToastViewport /></QueryClientProvider></ThemeProvider>;
}
