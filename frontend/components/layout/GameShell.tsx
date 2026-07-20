"use client";

import { GameNavigation } from "@/components/navigation/GameNavigation";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { ShopThemeSync } from "@/components/theme/ShopThemeSync";
import { usePathname } from "next/navigation";

export function GameShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  if (pathname === "/setup") {
    return <div className="min-h-dvh bg-canvas">{children}</div>;
  }

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-canvas pb-20 lg:pb-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <ShopThemeSync />
      <div className="w-full px-4 sm:px-6 lg:px-8 flex gap-6 min-h-dvh relative">
        <GameNavigation />
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 py-6 lg:py-9 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
          {children}
        </main>
      </div>
      <BottomNavigation />
    </div>
  );
}
