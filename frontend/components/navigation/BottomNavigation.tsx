"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef } from "react";

function HomeIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.2a1.2 1.2 0 0 0-.75.27l-8.5 6.6A1.2 1.2 0 0 0 2.3 10v9.5A2.2 2.2 0 0 0 4.5 21.7H9a1 1 0 0 0 1-1v-4.8a.7.7 0 0 1 .7-.7h2.6a.7.7 0 0 1 .7.7v4.8a1 1 0 0 0 1 1h4.5a2.2 2.2 0 0 0 2.2-2.2V10a1.2 1.2 0 0 0-.45-.93l-8.5-6.6A1.2 1.2 0 0 0 12 2.2Z" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9.5 9-7 9 7v10a1.5 1.5 0 0 1-1.5 1.5h-4.5a1 1 0 0 1-1-1v-5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5a1 1 0 0 1-1 1H4.5A1.5 1.5 0 0 1 3 19.5v-10z" />
    </svg>
  );
}

function ShopIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M6.3 2.2A1 1 0 0 1 7.1 2h9.8a1 1 0 0 1 .8.4l3 4c.2.2.3.5.3.8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.2c0-.3.1-.6.3-.8l3-4.2ZM8.5 4.2 7 6.2h10l-1.5-2H8.5ZM8 10a4 4 0 0 0 8 0h-1.8a2.2 2.2 0 0 1-4.4 0H8Z" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function QuestsIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9.5" />
        <polygon
          points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

const tabs = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/shop", label: "Shop", Icon: ShopIcon },
  { href: "/adventure", label: "Quests", Icon: QuestsIcon }
];

const getTabIndex = (pathname: string | null) => {
  if (!pathname) return 0;
  if (pathname === "/shop" || pathname.startsWith("/shop/")) return 1;
  if (pathname === "/adventure" || pathname.startsWith("/adventure/")) return 2;
  return 0; // Default to Home
};

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const pointerRef = useRef<{
    startX: number;
    startIdx: number;
    hasDragged: boolean;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = getTabIndex(pathname);
  const currentPos = dragIndex !== null ? dragIndex : activeIndex;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPressed(true);
    pointerRef.current = {
      startX: e.clientX,
      startIdx: activeIndex,
      hasDragged: false
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current || !containerRef.current) return;
    const deltaX = e.clientX - pointerRef.current.startX;

    if (!pointerRef.current.hasDragged && Math.abs(deltaX) > 4) {
      pointerRef.current.hasDragged = true;
    }

    if (pointerRef.current.hasDragged) {
      const tabWidth = containerRef.current.clientWidth / 3;
      const newPos = pointerRef.current.startIdx + deltaX / tabWidth;
      const clamped = Math.max(0, Math.min(2, newPos));
      setDragIndex(clamped);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPressed(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (pointerRef.current?.hasDragged && dragIndex !== null) {
      const nearest = Math.max(0, Math.min(2, Math.round(dragIndex)));
      setDragIndex(null);
      if (nearest !== activeIndex) {
        router.push(tabs[nearest].href);
      }
    } else {
      setDragIndex(null);
    }

    setTimeout(() => {
      pointerRef.current = null;
    }, 50);
  };

  const handlePointerCancel = () => {
    setIsPressed(false);
    setDragIndex(null);
    pointerRef.current = null;
  };

  const handleTabClick = (index: number) => {
    if (pointerRef.current?.hasDragged) return;
    router.push(tabs[index].href);
  };

  return (
    <nav
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label="Bottom Navigation"
      className="fixed inset-x-[21px] bottom-[calc(env(safe-area-inset-bottom)+8px)] z-50 lg:hidden h-[64px] rounded-full p-[4px] select-none touch-none bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(28,28,30,0.72)] backdrop-blur-[24px] backdrop-saturate-[180%] border-[0.5px] border-black/10 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-colors duration-300"
    >
      <div className="relative w-full h-[56px] flex items-center">
        {/* Switcher capsule */}
        <div
          className="absolute top-0 bottom-0 left-0 w-1/3 h-[56px] rounded-full bg-black/[0.08] dark:bg-white/[0.12] pointer-events-none z-0 transition-colors duration-300"
          style={{
            transform: `translateX(${currentPos * 100}%) scale(${isPressed ? 1.08 : 1})`,
            transformOrigin: "center center",
            transition: dragIndex !== null
              ? "scale 150ms ease-out"
              : "transform 350ms cubic-bezier(0.32, 0.72, 0, 1), scale 250ms cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}
        />

        {/* 3 Tabs */}
        <div className="relative z-10 grid grid-cols-3 w-full h-full">
          {tabs.map((tab, idx) => {
            const isSelected = (dragIndex !== null ? Math.round(dragIndex) : activeIndex) === idx;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTabClick(idx)}
                aria-selected={isSelected}
                aria-label={tab.label}
                className={`flex flex-col items-center justify-center gap-[2px] h-full w-full select-none cursor-pointer transition-colors duration-200 ${
                  isSelected
                    ? "text-[#15803d] dark:text-[#30D158]"
                    : "text-black/55 hover:text-black/85 dark:text-white/60 dark:hover:text-white/80"
                }`}
              >
                <tab.Icon filled={isSelected} />
                <span className="text-[10px] font-semibold tracking-[0.01em] leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
