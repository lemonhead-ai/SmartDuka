"use client";

import { motion } from "framer-motion";
import type { Basket, Customer } from "@/features/gameplay/types";

type ShoppingListPanelProps = {
  customer: Customer;
  basket: Basket | null;
  onCheckBasket?: () => void;
  disabled?: boolean;
  isChecking?: boolean;
  buttonLabel?: string;
  helperText?: string;
};

export function ShoppingListPanel({
  customer,
  basket,
  onCheckBasket,
  disabled = false,
  isChecking = false,
  buttonLabel = "Check basket",
  helperText,
}: ShoppingListPanelProps) {
  const selectedById = new Map<string, number>(
    basket?.lines.map((line): [string, number] => [line.item.id, line.quantity]) ?? []
  );

  const isValid = Boolean(basket?.validation.is_valid);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-[32px] border border-line bg-surface p-5 sm:p-6 shadow-sm"
      aria-labelledby="shopping-list-title"
    >
      {/* Header with Customer name and Status badge */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-line px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
            <span>Customer Order</span>
          </div>
          <h2 id="shopping-list-title" className="text-xl sm:text-2xl font-black text-ink tracking-tight">
            Shopping list for {customer.name}
          </h2>
        </div>

        <span
          className={`rounded-full px-3.5 py-1 text-xs font-bold border transition-colors ${
            isValid
              ? "bg-accent/15 border-accent text-accent"
              : "bg-canvas border-line text-muted"
          }`}
        >
          {isValid ? "Ready to check" : "Keep matching"}
        </span>
      </div>

      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">{customer.request}</p>

      {/* Grid of requested items */}
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {customer.requested_items.map((item) => {
          const selected = selectedById.get(item.item_id) ?? 0;
          const complete = selected === item.quantity;
          return (
            <li
              key={item.item_id}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                complete
                  ? "border-accent bg-accent/5 text-ink font-semibold"
                  : "border-line bg-canvas text-ink"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${complete ? "bg-accent" : "bg-muted/40"}`} />
                <span className="text-xs sm:text-sm font-semibold">{item.name}</span>
              </div>
              <span
                className={`shrink-0 text-xs sm:text-sm font-bold ${
                  complete ? "text-accent" : "text-muted"
                }`}
              >
                {selected}/{item.quantity}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Bottom Footer with Status helper text & Check Basket Button in Bottom Right Corner */}
      {onCheckBasket && (
        <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-medium text-muted">
            {helperText ??
              (isValid
                ? "The basket matches the customer's request!"
                : "Match the requested items to unlock checkout.")}
          </p>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onCheckBasket}
            disabled={disabled || isChecking}
            className="rounded-full bg-accent text-white dark:text-black px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:scale-100 transition-all ml-auto shrink-0"
          >
            {isChecking ? "Checking..." : buttonLabel}
          </motion.button>
        </div>
      )}
    </motion.section>
  );
}
