"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ShoppingBag01Icon, PackageIcon, Invoice01Icon } from "hugeicons-react";

import { ShopCounter } from "@/components/game/ShopCounter";
import { ShopManagement } from "@/components/game/ShopManagement";
import { ShopLedger } from "@/components/game/ShopLedger";
import { gameplayApi } from "@/features/gameplay/api";

type ShopTab = "counter" | "stock" | "ledger";

export default function ShopPage() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get("tab") as ShopTab) || "counter";
  const [activeTab, setActiveTab] = useState<ShopTab>(defaultTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as ShopTab;
    if (tabParam && ["counter", "stock", "ledger"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const ledgerQuery = useQuery({
    queryKey: ["shop-ledger"],
    queryFn: gameplayApi.ledger,
  });

  const tabs: { id: ShopTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "counter", label: "Shop Counter", icon: ShoppingBag01Icon },
    { id: "stock", label: "Stock Room", icon: PackageIcon },
    { id: "ledger", label: "Finances & Ledger", icon: Invoice01Icon },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">My Duka</h1>
          <p className="mt-1 text-xs text-muted">Serve customers, restock goods, and manage your shop finances.</p>
        </div>

        <nav className="flex items-center gap-1.5 rounded-2xl bg-canvas p-1 border border-line" aria-label="Shop view sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                  isActive ? "text-white" : "text-muted hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeShopTab"
                    className="absolute inset-0 rounded-xl bg-accent shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={16} className="relative z-10 shrink-0" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

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

      {activeTab === "ledger" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <ShopLedger ledger={ledgerQuery.data} isLoading={ledgerQuery.isLoading} />
        </motion.div>
      )}
    </div>
  );
}
