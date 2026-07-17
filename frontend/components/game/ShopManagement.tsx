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
  const refresh = () => client.invalidateQueries({ queryKey: ["shop"] });
  const restock = useMutation({ mutationFn: ({ id, quantity }: { id: string; quantity: number }) => gameplayApi.restock(id, quantity), onSuccess: () => { void refresh(); toast("success", "Shelf restocked."); } });
  const add = useMutation({ mutationFn: gameplayApi.addShopItems, onSuccess: () => { void refresh(); toast("success", "Product added to your duka."); } });
  const stocked = new Set(shop.data?.items.map((item) => item.id) ?? []);
  return <section className="rounded-[24px] border border-line bg-surface p-6"><p className="text-sm font-medium text-muted">Stock room</p><h2 className="mt-1 text-xl font-semibold">Restock and add products</h2><div className="mt-5 space-y-3">{shop.data?.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] bg-canvas p-3"><span><strong>{item.name}</strong><small className="ml-2 text-muted">{item.stock} left</small></span><div className="flex gap-2"><motion.button whileTap={{ scale: 0.97 }} onClick={() => restock.mutate({ id: item.id, quantity: 5 })} className="rounded-[14px] border border-line px-3 py-2 text-sm">+5</motion.button><motion.button whileTap={{ scale: 0.97 }} onClick={() => restock.mutate({ id: item.id, quantity: 10 })} className="rounded-[14px] bg-ink px-3 py-2 text-sm text-white">+10</motion.button></div></div>)}</div><div className="mt-6 flex flex-wrap gap-2">{catalog.data?.filter((item) => !stocked.has(item.id)).map((item) => <motion.button whileTap={{ scale: 0.97 }} key={item.id} onClick={() => add.mutate([item.id])} className="rounded-[14px] border border-line px-3 py-2 text-sm">Add {item.name}</motion.button>)}</div></section>;
}
