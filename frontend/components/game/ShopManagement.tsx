"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { useToastStore } from "@/features/feedback/toast-store";
import { gameplayApi } from "@/features/gameplay/api";
import { MiloAlert } from "@/components/ui/MiloAlert";

export function ShopManagement() {
  const client = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const shop = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: gameplayApi.catalog });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["shop"] });
    void client.invalidateQueries({ queryKey: ["inventory"] });
    void client.invalidateQueries({ queryKey: ["shop-ledger"] });
  };
  const restock = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => gameplayApi.restock(id, quantity),
    onSuccess: () => { refresh(); showToast("success", "Shelf restocked."); },
    onError: () => showToast("error", "There is not enough duka cash for that restock yet.")
  });
  const add = useMutation({
    mutationFn: gameplayApi.addShopItems,
    onSuccess: () => { refresh(); showToast("success", "Product added to your duka."); },
    onError: () => showToast("error", "That product could not be added right now.")
  });

  if (shop.isLoading) return <section className="rounded-[24px] border border-line bg-surface p-6" aria-busy="true"><p className="text-sm font-medium text-muted">Stock room</p><div className="mt-4 h-7 w-48 rounded-[14px] bg-canvas" /><div className="mt-5 h-20 rounded-[20px] bg-canvas" /></section>;
  if (shop.isError || !shop.data) return <section className="rounded-[24px] border border-line bg-surface p-6"><p className="text-sm font-medium text-muted">Stock room</p><h2 className="mt-1 text-xl font-semibold">Your stock room is taking a moment</h2><MiloAlert kind="error" message="Refresh to try loading your shelf again." className="mt-4" /><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void shop.refetch()} className="mt-5 rounded-[14px] border border-line px-4 py-2 font-semibold">Refresh stock room</motion.button></section>;

  const stocked = new Set(shop.data.items.map((item) => item.id));
  const additions = (catalog.data ?? []).filter((item) => !stocked.has(item.id));
  return <section className="rounded-[24px] border border-line bg-surface p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.002]" aria-busy={restock.isPending || add.isPending} aria-labelledby="stock-room-title">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted">Stock room</p>
        <h2 id="stock-room-title" className="mt-1 text-xl font-semibold text-ink">Keep your shelves ready</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Restock your popular products before the next customer arrives.</p>
      </div>
      <span className="rounded-full bg-canvas px-4 py-2 text-sm font-bold border border-line">KES {shop.data.cash_balance_kes} available</span>
    </div>
    
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shop.data.items.map((item) => (
        <article key={item.id} className="rounded-[20px] bg-canvas p-4 flex flex-col justify-between border border-line/30 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm text-ink truncate" title={item.name}>{item.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                item.stock <= 3 
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" 
                  : "bg-surface text-muted"
              }`}>
                {item.stock <= 3 ? "Low" : "In stock"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {item.stock} left · KES {item.restock_cost_kes} ea
            </p>
          </div>
          <div className="mt-4 flex gap-1.5">
            <RestockButton quantity={5} itemId={item.id} isPending={restock.isPending} onRestock={restock.mutate} />
            <RestockButton quantity={10} itemId={item.id} isPending={restock.isPending} onRestock={restock.mutate} emphasis />
          </div>
        </article>
      ))}
    </div>

    {additions.length > 0 && (
      <div className="mt-7 border-t border-line pt-6">
        <p className="text-sm font-bold text-ink">Add a new product</p>
        <p className="mt-1 text-sm text-muted">Pick one item to add to your shop with starter stock.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {additions.map((item) => (
            <motion.button 
              type="button" 
              whileTap={{ scale: 0.97 }} 
              key={item.id} 
              onClick={() => add.mutate([item.id])} 
              disabled={add.isPending} 
              className="rounded-full border border-line bg-canvas px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 hover:bg-surface transition-colors"
            >
              Add {item.name}
            </motion.button>
          ))}
        </div>
      </div>
    )}
    
    <p className="sr-only" aria-live="polite">{restock.isPending ? "Restocking shelf" : add.isPending ? "Adding product" : ""}</p>
  </section>;
}

function RestockButton({ itemId, quantity, isPending, onRestock, emphasis = false }: { itemId: string; quantity: number; isPending: boolean; onRestock: (variables: { id: string; quantity: number }) => void; emphasis?: boolean }) {
  return <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => onRestock({ id: itemId, quantity })} disabled={isPending} className={`rounded-[14px] px-4 py-2 text-sm font-bold disabled:opacity-50 ${emphasis ? "bg-ink text-white" : "border border-line bg-surface"}`}>+{quantity}</motion.button>;
}
