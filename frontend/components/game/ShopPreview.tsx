"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { gameplayApi } from "@/features/gameplay/api";

const categoryLabels: Record<string, string> = {
  fruits: "Fruits",
  vegetables: "Vegetables",
  drinks: "Drinks",
  snacks: "Snacks",
  school_supplies: "School supplies",
  household_items: "Home essentials",
};

export function ShopPreview() {
  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop });
  const shop = shopQuery.data;

  if (shopQuery.isLoading) {
    return <section className="rounded-[24px] border border-line bg-surface p-6" aria-busy="true"><p className="text-sm font-medium text-muted">Your stock snapshot</p><div className="mt-4 h-7 w-44 rounded-full bg-canvas" /><div className="mt-6 h-24 rounded-[18px] bg-canvas" /></section>;
  }

  if (shopQuery.isError || !shop) {
    return <section className="rounded-[24px] border border-line bg-surface p-6"><p className="text-sm font-medium text-muted">Your stock snapshot</p><h2 className="mt-1 text-xl font-semibold">Your shelf is taking a moment</h2><Link href="/shop" className="mt-5 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">Open shop</Link></section>;
  }

  const totalUnits = shop.items.reduce((total, item) => total + item.stock, 0);
  const lowStock = shop.items.filter((item) => item.stock > 0 && item.stock <= 4);
  const categories = Object.entries(
    shop.items.reduce<Record<string, { products: number; units: number }>>((summary, item) => {
      const current = summary[item.category] ?? { products: 0, units: 0 };
      summary[item.category] = { products: current.products + 1, units: current.units + item.stock };
      return summary;
    }, {}),
  ).sort(([, left], [, right]) => right.units - left.units || right.products - left.products).slice(0, 3);

  return <section className="rounded-[24px] border border-line bg-surface p-6 transition-shadow duration-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-muted">Your stock snapshot</p><h2 className="mt-1 text-xl font-semibold">{shop.name}</h2></div><Link href="/shop" className="shrink-0 text-sm font-semibold text-accent hover:underline">Open shop →</Link></div><div className="mt-6 grid grid-cols-3 gap-3"><StockStat label="Products" value={shop.items.length} /><StockStat label="On shelves" value={totalUnits} /><StockStat label="Low stock" value={lowStock.length} alert={lowStock.length > 0} /></div><div className="mt-6 rounded-[18px] bg-canvas p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">What you sell</p><Link href="#stock-room" className="text-xs font-semibold text-accent hover:underline">Manage stock</Link></div>{categories.length ? <ul className="mt-3 space-y-2">{categories.map(([category, summary]) => <li key={category} className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">{categoryLabels[category] ?? category.replaceAll("_", " ")}</span><span className="text-muted">{summary.products} products · {summary.units} units</span></li>)}</ul> : <p className="mt-3 text-sm text-muted">Add products to your shelf to begin serving customers.</p>}</div>{lowStock.length > 0 && <p className="mt-4 text-sm text-mango">Restock {lowStock.map((item) => item.name).join(", ")} soon.</p>}</section>;
}

function StockStat({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return <div className="rounded-[16px] bg-canvas p-3"><p className="text-xs font-medium text-muted">{label}</p><p className={`mt-1 text-lg font-bold ${alert ? "text-mango" : "text-ink"}`}>{value}</p></div>;
}
