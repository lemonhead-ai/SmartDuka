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
  subLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SHOP_TABS: TabConfig[] = [
  {
    id: "counter",
    label: "Counter",
    subLabel: "Dukani",
    icon: ShoppingBag01Icon,
  },
  {
    id: "stock",
    label: "Stock Room",
    subLabel: "Stoo",
    icon: PackageIcon,
  },
  {
    id: "wordmatch",
    label: "Word Match",
    subLabel: "Kusoma",
    icon: BookOpen01Icon,
  },
  {
    id: "deni",
    label: "Deni Book",
    subLabel: "Madaftari",
    icon: Book02Icon,
  },
  {
    id: "hygiene",
    label: "Hygiene",
    subLabel: "Usafi",
    icon: ShieldKeyIcon,
  },
  {
    id: "ledger",
    label: "Finances",
    subLabel: "Hesabu",
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
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">My Duka</h1>
          <p className="mt-1 text-xs text-muted">
            Serve customers, match Swahili words to goods, track credit balances (Deni), and manage shop finances.
          </p>
        </div>
      </div>

      {/* Theme-Consistent Square Navigation Cards Grid */}
      <nav aria-label="Shop Navigation" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SHOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all min-h-[90px] ${
                isActive
                  ? "bg-accent text-white border-accent shadow-md ring-2 ring-accent/20 font-bold"
                  : "bg-surface hover:bg-canvas border-line text-muted hover:text-ink shadow-sm"
              }`}
            >
              <Icon size={22} className={`mb-1.5 shrink-0 ${isActive ? "text-white" : "text-muted"}`} />
              <span className="text-xs font-bold leading-tight">{tab.label}</span>
              <span className={`text-[10px] mt-0.5 ${isActive ? "text-white/80" : "text-muted/70"}`}>
                {tab.subLabel}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Tab Panels */}
      {activeTab === "counter" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ShopCounter />
        </motion.div>
      )}

      {activeTab === "stock" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ShopManagement />
        </motion.div>
      )}

      {activeTab === "wordmatch" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <WordItemMatcher />
        </motion.div>
      )}

      {activeTab === "deni" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ShopDeniBook />
        </motion.div>
      )}

      {activeTab === "hygiene" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ShopHygieneInspector />
        </motion.div>
      )}

      {activeTab === "ledger" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ShopLedger ledger={ledgerQuery.data} isLoading={ledgerQuery.isLoading} />
        </motion.div>
      )}
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
