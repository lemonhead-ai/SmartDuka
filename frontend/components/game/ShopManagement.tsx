"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { gameplayApi } from "@/features/gameplay/api";
import { useToastStore } from "@/features/feedback/toast-store";

export function ShopManagement() {
  const client = useQueryClient();
  const toast = useToastStore((state) => state.showToast);
  const shop = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: gameplayApi.catalog });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["shop"] });
    void client.invalidateQueries({ queryKey: ["inventory"] });
    void client.invalidateQueries({ queryKey: ["shop-ledger"] });
  };
  const restock = useMutation({ mutationFn: ({ id, quantity }: { id: string; quantity: number }) => gameplayApi.restock(id, quantity), onSuccess: () => { refresh(); toast("success", "Shelf restocked."); }, onError: () => toast("error", "There is not enough duka cash for that restock yet.") });
  const add = useMutation({ mutationFn: gameplayApi.addShopItems, onSuccess: () => { refresh(); toast("success", "Product added to your duka."); }, onError: () => toast("error", "That product could not be added right now.") });
  const stocked = new Set(shop.data?.items.map((item) => item.id) ?? []);
  return <section className="rounded-[24px] border border-line bg-surface p-6" aria-busy={restock.isPending || add.isPending}><p className="text-sm font-medium text-muted">Stock room</p><h2 className="mt-1 text-xl font-semibold">Restock and add products</h2><p className="mt-2 text-sm text-muted">Use your duka cash to fill the shelves before the next customer arrives.</p><div className="mt-5 space-y-3">{shop.data?.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] bg-canvas p-3"><span><strong>{item.name}</strong><small className="ml-2 text-muted">{item.stock} left · KES {item.restock_cost_kes} each</small></span><div className="flex gap-2"><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => restock.mutate({ id: item.id, quantity: 5 })} disabled={restock.isPending} className="rounded-[14px] border border-line px-3 py-2 text-sm disabled:opacity-50">+5</motion.button><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => restock.mutate({ id: item.id, quantity: 10 })} disabled={restock.isPending} className="rounded-[14px] bg-ink px-3 py-2 text-sm text-white disabled:opacity-50">+10</motion.button></div></div>)}</div><div className="mt-6 flex flex-wrap gap-2">{catalog.data?.filter((item) => !stocked.has(item.id)).map((item) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={item.id} onClick={() => add.mutate([item.id])} disabled={add.isPending} className="rounded-[14px] border border-line px-3 py-2 text-sm disabled:opacity-50">Add {item.name}</motion.button>)}</div></section>;
}
