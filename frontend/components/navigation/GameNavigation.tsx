"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AdventureIcon, SidebarLeftIcon, SidebarRightIcon, Award01Icon, DashboardSquare01Icon, ShoppingBag01Icon } from "hugeicons-react";
import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { gameplayApi } from "@/features/gameplay/api";

const items = [{ href: "/dashboard", icon: DashboardSquare01Icon, label: "Home" }, { href: "/shop", icon: ShoppingBag01Icon, label: "My shop" }, { href: "/adventure", icon: AdventureIcon, label: "Missions" }, { href: "/profile", icon: Award01Icon, label: "Progress" }];

type GameNavigationProps = { onWidthChange?: (width: number) => void };

export function GameNavigation({ onWidthChange }: GameNavigationProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [resizing, setResizing] = useState(false);
  const [localName, setLocalName] = useState("");
  const [activePath, setActivePath] = useState(pathname);

  useEffect(() => {
    const savedName = window.localStorage.getItem("smart-duka-profile-name");
    if (savedName) setLocalName(savedName);
  }, []);

  useEffect(() => {
    if (!resizing) return;
    const handlePointerMove = (event: PointerEvent) => {
      setSidebarWidth(Math.min(360, Math.max(180, event.clientX)));
    };
    const handlePointerUp = () => setResizing(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizing]);

  useEffect(() => {
    onWidthChange?.(expanded ? sidebarWidth : 68);
  }, [expanded, onWidthChange, sidebarWidth]);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  const progressQuery = useQuery({ queryKey: ["player-progress"], queryFn: gameplayApi.progress });
  const displayName = localName || progressQuery.data?.student_name || "Shopkeeper";
  const nameParts = displayName.trim().split(" ");
  const initials = nameParts.length > 1 
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
    : displayName.slice(0, 2).toUpperCase();

  return (
    <motion.aside className={`tahoe-sidebar relative hidden flex-col border-r border-line px-3 py-5 lg:flex ${resizing ? "select-none" : ""}`} animate={{ width: expanded ? sidebarWidth : 68 }} transition={resizing ? { duration: 0 } : { type: "tween", duration: expanded ? 0.35 : 0.28, ease: [0.32, 0.72, 0, 1] }}>
      <div className={`flex items-center ${expanded ? 'px-2 justify-between' : 'justify-center'}`}>
        <motion.div animate={{ width: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }} className="overflow-hidden whitespace-nowrap">
          <SmartDukaLogo compact={false} />
        </motion.div>
        <button type="button" aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} onClick={() => setExpanded((value) => !value)} className="grid size-11 shrink-0 place-items-center rounded-2xl hover:bg-[rgba(0,0,0,0.04)] text-ink transition-colors">
          {expanded ? <SidebarLeftIcon size={24} color="currentColor" /> : <SidebarRightIcon size={24} color="currentColor" />}
        </button>
      </div>

      <nav className={`mt-10 space-y-1 ${expanded ? "" : "flex flex-col items-center"}`}>
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = activePath === href || activePath?.startsWith(`${href}/`);
          return (
            <div
              key={href}
              className={`relative rounded-[14px] transition-colors duration-150 ${
                isActive ? "shadow-sm" : "hover:bg-[rgba(0,0,0,0.04)]"
              } ${expanded ? "" : "size-11"}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebarTabIndicator"
                  className="absolute inset-0 bg-accent z-0 rounded-[14px]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Link
                href={href}
                onClick={() => setActivePath(href)}
                aria-current={isActive ? "page" : undefined}
                aria-label={!expanded ? label : undefined}
                className={expanded
                  ? `relative z-10 flex items-center gap-3 px-[14px] py-[10px] font-medium transition-colors duration-200 ${isActive ? "text-white" : "text-ink"}`
                  : `relative z-10 flex size-11 items-center justify-center transition-colors duration-200 ${isActive ? "text-white" : "text-ink"}`}
              >
                <Icon size={24} color="currentColor" className="shrink-0" />
                {expanded && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="whitespace-nowrap">
                    {label}
                  </motion.span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className={`mt-auto overflow-hidden rounded-[14px] ${expanded ? "" : "size-11"}`}>
        <Link href="/profile" aria-label={!expanded ? "Profile" : undefined} className={expanded ? "flex items-center gap-3 px-[10px] py-[10px] hover:bg-[rgba(0,0,0,0.04)] transition-colors" : "flex items-center justify-center size-11 hover:bg-[rgba(0,0,0,0.04)] transition-colors"}>
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-line text-[11px] font-bold text-ink">
            {initials}
          </div>
          {expanded && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="whitespace-nowrap font-medium text-sm text-ink truncate">
              {displayName}
            </motion.span>
          )}
        </Link>
      </div>
      {expanded && (
        <div
          aria-label="Resize sidebar"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={() => setResizing(true)}
          className="absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none"
        />
      )}
    </motion.aside>
  );
}
