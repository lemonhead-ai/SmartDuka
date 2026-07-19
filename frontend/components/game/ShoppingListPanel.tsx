"use client";

import { motion } from "framer-motion";

import type { Basket, Customer } from "@/features/gameplay/types";

type ShoppingListPanelProps = {
  customer: Customer;
  basket: Basket | null;
};

export function ShoppingListPanel({ customer, basket }: ShoppingListPanelProps) {
  const selectedById = new Map<string, number>(
    basket?.lines.map((line): [string, number] => [line.item.id, line.quantity]) ?? []
  );

  return <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="rounded-[24px] border border-line bg-canvas p-4 sm:p-5" aria-labelledby="shopping-list-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Customer order</p>
        <h2 id="shopping-list-title" className="mt-1 text-xl font-bold">Shopping list for {customer.name}</h2>
      </div>
      <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${basket?.validation.is_valid ? "bg-green-50 text-green-800" : "bg-surface text-muted"}`}>{basket?.validation.is_valid ? "Ready to check" : "Keep matching"}</span>
    </div>
    <p className="mt-3 text-sm leading-6 text-muted">{customer.request}</p>
    <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {customer.requested_items.map((item) => {
        const selected = selectedById.get(item.item_id) ?? 0;
        const complete = selected === item.quantity;
        return <li key={item.item_id} className={`flex items-center justify-between gap-3 rounded-[16px] border px-4 py-3 ${complete ? "border-green-200 bg-green-50" : "border-line bg-surface"}`}>
          <span className="font-semibold">{item.name}</span>
          <span className="shrink-0 text-sm font-bold">{selected}/{item.quantity}</span>
        </li>;
      })}
    </ul>
  </motion.section>;
}
