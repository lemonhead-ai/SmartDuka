"use client";

import React, { useState } from "react";
import { ShieldKeyIcon, CheckmarkCircle01Icon } from "hugeicons-react";
import { CbcBadge } from "@/components/learning/CbcBadge";
import { MiloAlert } from "@/components/ui/MiloAlert";
import type { ToastKind } from "@/features/feedback/toast-store";

interface StockItem {
  id: string;
  nameSwahili: string;
  nameEnglish: string;
  category: "perishable" | "dry_goods" | "hygiene";
  currentZone: "cooler" | "pantry" | "hygiene_shelf";
  unitCount: number;
}

const STOCK_ITEMS: StockItem[] = [
  { id: "i1", nameSwahili: "Maziwa Paketi 1L", nameEnglish: "Milk Packet 1L", category: "perishable", currentZone: "pantry", unitCount: 12 },
  { id: "i2", nameSwahili: "Unga wa Sembe 2kg", nameEnglish: "Maize Flour 2kg", category: "dry_goods", currentZone: "pantry", unitCount: 25 },
  { id: "i3", nameSwahili: "Sabuni ya Kipande", nameEnglish: "Bar Soap", category: "hygiene", currentZone: "pantry", unitCount: 18 },
  { id: "i4", nameSwahili: "Juisi ya Embe", nameEnglish: "Mango Juice", category: "perishable", currentZone: "cooler", unitCount: 8 },
];

export function ShopHygieneInspector() {
  const [items, setItems] = useState<StockItem[]>(STOCK_ITEMS);
  const [miloFeedback, setMiloFeedback] = useState<{ kind: ToastKind; message: string }>({
    kind: "info",
    message: "Karibu! Kagua uhifadhi wa bidhaa zetu. Weka Maziwa katika Fridge na Sabuni mbali na chakula!",
  });

  const moveZone = (itemId: string, targetZone: StockItem["currentZone"]) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, currentZone: targetZone } : item))
    );
  };

  const handleAudit = () => {
    let errors = 0;
    items.forEach((item) => {
      if (item.category === "perishable" && item.currentZone !== "cooler") errors++;
      if (item.category === "hygiene" && item.currentZone !== "hygiene_shelf") errors++;
      if (item.category === "dry_goods" && item.currentZone !== "pantry") errors++;
    });

    if (errors === 0) {
      setMiloFeedback({
        kind: "success",
        message: "Safisha Duka Kamilifu! 🎉 Bidhaa zote zimehifadhiwa mahali sahihi. Maziwa ni baridi na sabuni iko mbali na chakula!",
      });
    } else {
      setMiloFeedback({
        kind: "warning",
        message: `Angalisho la Afya! Kuna makosa ${errors} ya uhifadhi. Kumbuka kuweka maziwa katika Fridge na sabuni mbali na chakula!`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface p-6 border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <ShieldKeyIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Uhifadhi & Usafi wa Duka (Food Safety & Shelf Hygiene)</h2>
            <p className="text-xs text-muted">
              Panga bidhaa kwa usahihi ili kuzuia uharibifu wa chakula na kulinda afya ya wateja.
            </p>
          </div>
        </div>
        <CbcBadge gradeLevel="Grade 2" subStrand="4.1 Food Safety & Hygiene Sorting" competencyId="CBC-SCI-G2-01" />
      </div>

      {/* Milo Mascot Toast */}
      <MiloAlert kind={miloFeedback.kind} message={miloFeedback.message} />

      {/* Stock Zone Columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Cooler / Fridge Zone */}
        <div className="rounded-3xl bg-surface p-5 border border-line shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>🧊</span>
              <span>Fridge ya Baridi (Perishables)</span>
            </h3>
          </div>
          <div className="space-y-3 min-h-[160px]">
            {items
              .filter((i) => i.currentZone === "cooler")
              .map((item) => (
                <div key={item.id} className="rounded-2xl bg-canvas p-3 border border-line shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-ink">{item.nameSwahili}</div>
                    <div className="text-[10px] text-muted">{item.unitCount} Paketi</div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveZone(item.id, "pantry")} className="text-[10px] bg-surface hover:bg-canvas p-1 rounded border border-line text-muted">Pantry</button>
                    <button type="button" onClick={() => moveZone(item.id, "hygiene_shelf")} className="text-[10px] bg-surface hover:bg-canvas p-1 rounded border border-line text-muted">Hygiene</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Dry Goods Pantry Zone */}
        <div className="rounded-3xl bg-surface p-5 border border-line shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>🌾</span>
              <span>Chakula Kikavu (Dry Goods)</span>
            </h3>
          </div>
          <div className="space-y-3 min-h-[160px]">
            {items
              .filter((i) => i.currentZone === "pantry")
              .map((item) => (
                <div key={item.id} className="rounded-2xl bg-canvas p-3 border border-line shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-ink">{item.nameSwahili}</div>
                    <div className="text-[10px] text-muted">{item.unitCount} Paketi</div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveZone(item.id, "cooler")} className="text-[10px] bg-surface hover:bg-canvas p-1 rounded border border-line text-muted">Fridge</button>
                    <button type="button" onClick={() => moveZone(item.id, "hygiene_shelf")} className="text-[10px] bg-surface hover:bg-canvas p-1 rounded border border-line text-muted">Hygiene</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Hygiene & Cleaning Zone */}
        <div className="rounded-3xl bg-surface p-5 border border-line shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>🧼</span>
              <span>Sabuni & Usafi (Hygiene)</span>
            </h3>
          </div>
          <div className="space-y-3 min-h-[160px]">
            {items
              .filter((i) => i.currentZone === "hygiene_shelf")
              .map((item) => (
                <div key={item.id} className="rounded-2xl bg-canvas p-3 border border-line shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-ink">{item.nameSwahili}</div>
                    <div className="text-[10px] text-muted">{item.unitCount} Vipande</div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveZone(item.id, "cooler")} className="text-[10px] bg-surface hover:bg-canvas p-1 rounded border border-line text-muted">Fridge</button>
                    <button type="button" onClick={() => moveZone(item.id, "pantry")} className="text-[10px] bg-surface hover:bg-canvas p-1 rounded border border-line text-muted">Pantry</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Audit Action Button */}
      <div className="flex items-center justify-between rounded-2xl bg-surface p-4 border border-line shadow-sm">
        <button
          type="button"
          onClick={handleAudit}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white hover:bg-accent/90 shadow-sm"
        >
          <CheckmarkCircle01Icon size={16} />
          <span>Kagua Usafi wa Shelfi (Run Shelf Hygiene Audit)</span>
        </button>
      </div>
    </div>
  );
}
