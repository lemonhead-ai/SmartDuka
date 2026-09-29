"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingBag01Icon,
  PackageIcon,
  BookOpen01Icon,
  Book02Icon,
  ShieldKeyIcon,
  Invoice01Icon,
} from "hugeicons-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ShopCounter } from "@/components/game/ShopCounter";
import { ShopManagement } from "@/components/game/ShopManagement";
import { WordItemMatcher } from "@/components/game/WordItemMatcher";
import { ShopDeniBook } from "@/components/game/ShopDeniBook";
import { ShopHygieneInspector } from "@/components/game/ShopHygieneInspector";
import { ShopLedger } from "@/components/game/ShopLedger";
import { gameplayApi } from "@/features/gameplay/api";

type ShopTab = "counter" | "stock" | "wordmatch" | "deni" | "hygiene" | "ledger";

interface TabConfig {
  id: ShopTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
}

const SHOP_TABS: TabConfig[] = [
  {
    id: "counter",
    label: "Counter",
    icon: ShoppingBag01Icon,
  },
  {
    id: "stock",
    label: "Stock Room",
    icon: PackageIcon,
  },
  {
    id: "wordmatch",
    label: "Word Match",
    icon: BookOpen01Icon,
  },
  {
    id: "deni",
    label: "Deni Book",
    icon: Book02Icon,
  },
  {
    id: "hygiene",
    label: "Hygiene",
    icon: ShieldKeyIcon,
  },
  {
    id: "ledger",
    label: "Finances",
    icon: Invoice01Icon,
  },
];

function ShopPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get("tab") as ShopTab) || "counter";
  const [activeTab, setActiveTab] = useState<ShopTab>(defaultTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as ShopTab;
    if (tabParam && SHOP_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const ledgerQuery = useQuery({
    queryKey: ["shop-ledger"],
    queryFn: gameplayApi.ledger,
  });

  return (
    <div className="space-y-1 sm:space-y-6 pb-6">
      {/* Top Header */}
      <DashboardHeader />

      {/* Header Info Banner */}
      <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 size-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-line px-3 py-0.5 text-xs font-bold text-accent uppercase tracking-wider mb-2">
            <span>Duka Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">My Shop</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted max-w-xl">
            Serve customers, match Swahili goods, track customer credit (Deni), and manage shop inventory and finances.
          </p>
        </div>
      </section>

      {/* Benchmark Navigation Pill Tabs */}
      <nav
        aria-label="Shop Navigation"
        className="rounded-[28px] border border-line bg-surface p-1.5 sm:p-2 grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 shadow-sm"
      >
        {SHOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border text-center transition-all duration-200 min-h-[58px] sm:min-h-[66px] ${
                isActive
                  ? "bg-accent text-white dark:text-black border-accent font-bold shadow-sm scale-[1.01]"
                  : "bg-canvas border-line text-muted hover:text-ink hover:bg-surface"
              }`}
            >
              <Icon
                size={20}
                className={`mb-1 shrink-0 ${isActive ? "text-white dark:text-black" : "text-muted"}`}
              />
              <span className="text-xs sm:text-sm font-bold leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab Panels */}
      <div className="pt-1">
        {activeTab === "counter" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <ShopCounter />
          </motion.div>
        )}

        {activeTab === "stock" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <ShopManagement />
          </motion.div>
        )}

        {activeTab === "wordmatch" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <WordItemMatcher />
          </motion.div>
        )}

        {activeTab === "deni" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <ShopDeniBook />
          </motion.div>
        )}

        {activeTab === "hygiene" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <ShopHygieneInspector />
          </motion.div>
        )}

        {activeTab === "ledger" && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <ShopLedger ledger={ledgerQuery.data} isLoading={ledgerQuery.isLoading} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading shop...</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
