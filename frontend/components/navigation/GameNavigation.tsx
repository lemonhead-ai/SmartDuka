"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  AdventureIcon,
  SidebarLeftIcon,
  SidebarRightIcon,
  DashboardSquare01Icon,
  ShoppingBag01Icon,
  Logout01Icon
} from "hugeicons-react";
import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { gameplayApi } from "@/features/gameplay/api";
import { authApi } from "@/features/auth/api";
import { useKidProfileStore } from "@/features/kids/store";

const items = [
  { href: "/dashboard", icon: DashboardSquare01Icon, label: "Home" },
  { href: "/shop", icon: ShoppingBag01Icon, label: "My shop" },
  { href: "/adventure", icon: AdventureIcon, label: "Missions" }
];

type GameNavigationProps = { onWidthChange?: (width: number) => void };

export function GameNavigation({ onWidthChange }: GameNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [resizing, setResizing] = useState(false);
  const [activePath, setActivePath] = useState(pathname);
  const [logoHovered, setLogoHovered] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const confirmLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await authApi.signOut().catch(() => {});
      authApi.clearSessionToken();
      router.push("/sign-in");
    } catch {
      router.push("/sign-in");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <motion.aside
        className={`tahoe-sidebar relative hidden flex-col bg-surface/80 backdrop-blur-md px-3 py-6 lg:flex ${
          resizing ? "select-none" : ""
        } rounded-[32px] my-3 shadow-[0_4px_24px_rgba(0,0,0,0.03)]`}
        animate={{ width: expanded ? sidebarWidth : 74 }}
        transition={
          resizing
            ? { duration: 0 }
            : { type: "tween", duration: expanded ? 0.35 : 0.28, ease: [0.32, 0.72, 0, 1] }
        }
      >
        {/* Top Header: Logo with Hover-to-Toggle Expansion */}
        <div
          className="relative h-14 w-full flex items-center justify-center cursor-pointer select-none px-1"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? "Click or hover to collapse sidebar" : "Click or hover to expand sidebar"}
        >
          <AnimatePresence mode="wait">
            {!logoHovered ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-center w-full overflow-hidden"
              >
                {expanded ? (
                  <SmartDukaLogo compact={false} />
                ) : (
                  <SmartDukaLogo compact={true} />
                )}
              </motion.div>
            ) : (
              <motion.button
                key="toggle-button"
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                className="flex items-center justify-center gap-2 rounded-2xl bg-canvas hover:bg-canvas/80 p-2.5 text-ink transition-colors shadow-sm w-full"
              >
                {expanded ? (
                  <>
                    <SidebarLeftIcon size={22} color="currentColor" />
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Collapse
                    </span>
                  </>
                ) : (
                  <SidebarRightIcon size={22} color="currentColor" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Center Nav: Arranged in the center of the sidebar with spacious breathing room */}
        <div className="flex-1 flex flex-col justify-center py-8">
          <nav
            className={`space-y-6 flex flex-col ${
              expanded ? "items-stretch" : "items-center"
            }`}
          >
            {items.map(({ href, icon: Icon, label }) => {
              const isActive = activePath === href || activePath?.startsWith(`${href}/`);
              return (
                <div
                  key={href}
                  className={`relative rounded-[18px] transition-all duration-200 ${
                    isActive ? "shadow-sm" : "hover:bg-canvas"
                  } ${expanded ? "" : "size-12"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarTabIndicator"
                      className="absolute inset-0 bg-ink z-0 rounded-[18px]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Link
                    href={href}
                    onClick={() => setActivePath(href)}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={!expanded ? label : undefined}
                    className={
                      expanded
                        ? `relative z-10 flex items-center gap-3.5 px-4 py-3 font-semibold text-sm transition-colors duration-200 ${
                            isActive ? "text-surface" : "text-ink/80 hover:text-ink"
                          }`
                        : `relative z-10 flex size-12 items-center justify-center transition-colors duration-200 ${
                            isActive ? "text-surface" : "text-ink/80 hover:text-ink"
                          }`
                    }
                  >
                    <Icon size={24} color="currentColor" className="shrink-0" />
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Quick Logout Button */}
        <div className="pt-4 border-t border-line flex justify-center">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            disabled={loggingOut}
            aria-label="Log out"
            title="Log out"
            className={`group flex items-center rounded-[18px] text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 ${
              expanded ? "w-full gap-3 px-4 py-3" : "size-12 justify-center"
            }`}
          >
            <Logout01Icon
              size={22}
              className="shrink-0 transition-transform group-hover:-translate-x-0.5"
              color="currentColor"
            />
            {expanded && (
              <span className="text-sm font-medium whitespace-nowrap">
                {loggingOut ? "Signing out..." : "Log out"}
              </span>
            )}
          </button>
        </div>

        {/* Resize Handle */}
        {expanded && (
          <div
            aria-label="Resize sidebar"
            aria-valuemax={360}
            aria-valuemin={180}
            aria-valuenow={sidebarWidth}
            role="slider"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") setSidebarWidth((width) => Math.max(180, width - 12));
              if (event.key === "ArrowRight") setSidebarWidth((width) => Math.min(360, width + 12));
            }}
            onPointerDown={() => setResizing(true)}
            className="absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none"
          />
        )}
      </motion.aside>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm rounded-[28px] border border-line bg-surface p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600">
                  <Logout01Icon size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Log out of SmartDuka?</h3>
                  <p className="text-xs text-muted">You can log back in anytime to continue playing.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={loggingOut}
                  className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-bold text-ink hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  disabled={loggingOut}
                  className="rounded-full bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors"
                >
                  {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
