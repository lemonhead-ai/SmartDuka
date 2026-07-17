"use client";

import { useState } from "react";

import { GameNavigation } from "@/components/navigation/GameNavigation";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";

export function GameShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [sidebarWidth, setSidebarWidth] = useState(240);

  return (
    <div className="min-h-dvh max-w-full overflow-x-clip bg-canvas pb-20 lg:pb-0 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <GameNavigation onWidthChange={setSidebarWidth} />
      <main className="game-main mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10 lg:py-9 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ "--sidebar-offset": `${sidebarWidth + 16}px` } as React.CSSProperties}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
