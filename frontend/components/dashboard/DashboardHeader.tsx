"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search01Icon,
  Wallet02Icon,
  Notification01Icon,
  FireIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon
} from "hugeicons-react";
import { gameplayApi } from "@/features/gameplay/api";
import { authApi } from "@/features/auth/api";
import { useKidProfileStore } from "@/features/kids/store";

const avatarImageMap: Record<string, string> = {
  mario: "/illustrations/mario.PNG",
  milo: "/mascots/milo.PNG",
  stitch: "/illustrations/stitch.PNG",
  kirby: "/illustrations/kirby.PNG",
  jack: "/illustrations/jack.PNG"
};

// Search index items for quick jumps
const searchableItems = [
  { title: "Shop Counter", category: "Game", href: "/shop?tab=counter", desc: "Serve waiting customers" },
  { title: "Stock Room", category: "Inventory", href: "/shop?tab=stock", desc: "Restock store inventory" },
  { title: "Shop Ledger", category: "Finance", href: "/shop?tab=ledger", desc: "Track sales and profits" },
  { title: "Daily Missions", category: "Adventure", href: "/adventure", desc: "Complete daily quests" },
  { title: "Mental Math Guide", category: "Guides", href: "#guides", desc: "Calculate change like a pro" },
  { title: "Fresh Milk & Bread", category: "Catalog", href: "/shop?tab=stock", desc: "High demand morning stock" }
];

export function DashboardHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWalletExpanded, setIsWalletExpanded] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);

  const progressQuery = useQuery({
    queryKey: ["player-progress"],
    queryFn: gameplayApi.progress
  });
  const accountQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false
  });

  const progress = progressQuery.data;
  const coins = progress?.coins_earned ?? 0;
  const displayName = progress?.student_name || accountQuery.data?.shopkeeper.display_name || "Shopkeeper";
  const avatar = useKidProfileStore((state) => state.avatar);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setIsWalletExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = searchQuery.trim()
    ? searchableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky-dashboard-header flex items-center justify-between gap-3 sm:gap-4 py-2.5 sm:py-3.5 px-4 sm:px-6 w-full transition-colors">
      {/* Mobile: Search Icon Only on top left corner */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(true)}
          aria-label="Search"
          title="Search items, missions, guides"
          className="grid size-10 place-items-center rounded-full bg-surface border border-line text-ink hover:text-accent hover:border-accent transition-all shrink-0"
        >
          <Search01Icon size={20} color="currentColor" />
        </button>
      </div>

      {/* Desktop Search Input Bar */}
      <div ref={searchContainerRef} className="hidden sm:block relative flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search01Icon
            size={20}
            className="absolute left-4 text-muted pointer-events-none transition-colors"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search items, missions, guides..."
            className="w-full rounded-full bg-surface border border-line pl-11 pr-4 py-2.5 sm:py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-4 text-xs font-semibold text-muted hover:text-ink px-1.5 py-0.5 rounded-full hover:bg-canvas"
            >
              Clear
            </button>
          )}
        </div>

        {/* Desktop Search Results Dropdown */}
        <AnimatePresence>
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 rounded-[22px] bg-surface border border-line p-2 shadow-xl z-50 overflow-hidden"
            >
              {filteredItems.length > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredItems.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl hover:bg-canvas transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted">{item.desc}</p>
                      </div>
                      <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-canvas text-muted border border-line">
                        {item.category}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-muted">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Search Modal Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex flex-col justify-start sm:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsMobileSearchOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full rounded-[28px] bg-surface border border-line p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search01Icon size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items, missions..."
                    className="w-full rounded-full bg-canvas border border-line pl-10 pr-10 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink px-1.5 py-0.5 rounded-full"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="grid size-10 place-items-center rounded-full bg-canvas border border-line text-ink hover:text-accent shrink-0"
                  aria-label="Close search"
                >
                  <Cancel01Icon size={18} />
                </button>
              </div>

              {/* Mobile search results */}
              {searchQuery.trim().length > 0 && (
                <div className="space-y-1 max-h-72 overflow-y-auto pt-2 border-t border-line">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => {
                          setIsMobileSearchOpen(false);
                          setSearchQuery("");
                          router.push(item.href);
                        }}
                        className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl hover:bg-canvas transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink group-hover:text-accent">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted">{item.desc}</p>
                        </div>
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-md bg-canvas text-muted border border-line">
                          {item.category}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted">
                      No results found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Controls: Single-Bordered Circular Buttons (Wallet, Notifications, Profile Avatar) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Wallet Expandable Button */}
        <div ref={walletRef} className="relative">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`flex items-center rounded-full border border-line bg-surface overflow-hidden ${
              isWalletExpanded
                ? "px-3.5 py-1.5 sm:px-4 sm:py-2 gap-2.5 shadow-sm"
                : "size-10 sm:size-11 justify-center"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsWalletExpanded((v) => !v)}
              aria-label={isWalletExpanded ? "Collapse wallet" : `Wallet: ${coins} Duka Coins`}
              title={isWalletExpanded ? "Click to collapse" : `Wallet: ${coins.toLocaleString()} Duka Coins`}
              className="flex items-center gap-2.5 text-ink hover:text-accent transition-colors"
            >
              <Wallet02Icon size={20} color="currentColor" className="shrink-0" />
              <AnimatePresence>
                {isWalletExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col text-left overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted leading-tight">
                      Duka Coins
                    </span>
                    <span className="text-xs sm:text-sm font-black text-ink leading-tight">
                      {coins.toLocaleString()}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            {isWalletExpanded && (
              <Link
                href="/shop?tab=ledger"
                title="View shop ledger"
                className="text-[11px] font-bold text-accent hover:underline pl-2 border-l border-line shrink-0"
              >
                Ledger
              </Link>
            )}
          </motion.div>
        </div>


        {/* Notifications Bell Circular Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((v) => !v);
              setIsProfileOpen(false);
            }}
            aria-label="Notifications"
            title="Notifications"
            className="relative grid size-10 sm:size-11 place-items-center rounded-full bg-surface border border-line text-ink hover:text-accent hover:border-accent transition-all"
          >
            <Notification01Icon size={20} color="currentColor" />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent" />
          </button>

          {/* Notifications Popover */}
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-[24px] bg-surface border border-line p-4 shadow-2xl z-50"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <p className="font-semibold text-sm text-ink">Notifications</p>
                  <span className="text-[11px] font-medium text-accent">Mark all read</span>
                </div>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-start gap-3 rounded-xl p-2 hover:bg-canvas transition-colors">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas border border-line text-accent">
                      <FireIcon size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-ink">
                        {progress?.daily_streak_days ?? 0}-Day Streak Kept!
                      </p>
                      <p className="text-[11px] text-muted">You opened the duka on time today.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl p-2 hover:bg-canvas transition-colors">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-canvas border border-line text-accent">
                      <CheckmarkCircle02Icon size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-ink">New Customer Waiting</p>
                      <p className="text-[11px] text-muted">A neighbor needs 2 kg of maize flour.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar Circular Button - Single clean 1px border line */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((v) => !v);
              setIsNotificationsOpen(false);
            }}
            aria-label="Profile menu"
            title="Profile"
            className="grid size-10 sm:size-11 place-items-center rounded-full border border-line bg-surface overflow-hidden hover:border-accent transition-all p-1"
          >
            <Image
              src={avatarImageMap[avatar] || "/mascots/milo.PNG"}
              alt={displayName}
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-[22px] bg-surface border border-line p-2 shadow-2xl z-50"
              >
                <div className="px-3 py-2 border-b border-line">
                  <p className="font-semibold text-sm text-ink truncate">{displayName}</p>
                  <p className="text-xs text-muted">Shopkeeper Level {progress?.current_learning_level ?? 1}</p>
                </div>
                <div className="mt-1 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-xl hover:bg-canvas transition-colors"
                  >
                    <span>👤</span> View Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ink rounded-xl hover:bg-canvas transition-colors"
                  >
                    <span>⚙️</span> Shop Settings
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
