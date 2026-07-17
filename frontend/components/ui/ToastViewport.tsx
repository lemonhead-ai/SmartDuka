"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

import { useToastStore } from "@/features/feedback/toast-store";

const buddy = {
  success: { name: "Milo", face: "bg-green-400", bubble: "border-green-200 bg-green-50", text: "text-green-800" },
  error: { name: "Milo", face: "bg-red-400", bubble: "border-red-200 bg-red-50", text: "text-red-800" },
  warning: { name: "Milo", face: "bg-amber-400", bubble: "border-yellow-200 bg-yellow-50", text: "text-yellow-900" },
  info: { name: "Milo", face: "bg-blue-400", bubble: "border-blue-200 bg-blue-50", text: "text-blue-900" }
};

export function ToastViewport() {
  const { toast, dismissToast } = useToastStore();

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(dismissToast, 5_000);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast]);

  const character = toast ? buddy[toast.kind] : buddy.info;

  return <AnimatePresence mode="wait">{toast && <motion.div key={toast.id} role="status" aria-live="polite" initial={{ opacity: 0, x: 24, y: 12, scale: 0.96 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24, y: 12, scale: 0.96 }} transition={{ type: "spring", stiffness: 360, damping: 26 }} className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[100] flex w-[min(92vw,28rem)] items-end gap-3 sm:right-6">
    <div className={`relative min-w-0 flex-1 rounded-[22px] border-2 px-4 py-3 shadow-elevated sm:px-5 sm:py-4 ${character.bubble}`}>
      <span className={`absolute -right-2 bottom-4 size-4 rotate-45 border-r-2 border-t-2 ${character.bubble}`} aria-hidden="true" />
      <div className="relative z-10 flex items-start gap-3"><div className="min-w-0 flex-1"><p className={`text-[11px] font-black uppercase tracking-[0.14em] ${character.text}`}>{character.name} says</p><p className="mt-1 break-words text-sm font-semibold leading-relaxed text-ink">{toast.message}</p></div><button type="button" onClick={dismissToast} aria-label="Dismiss message" className="grid size-7 shrink-0 place-items-center rounded-full text-lg leading-none text-muted transition-colors hover:bg-black/5">×</button></div>
    </div>
    <CartoonBuddy name={character.name} tone={character.face} />
  </motion.div>}</AnimatePresence>;
}

function CartoonBuddy({ name, tone }: { name: string; tone: string }) {
  if (name === "Milo") {
    return (
      <div className="shrink-0 text-center">
        <div className="relative size-14" aria-label="Milo, your learning buddy" role="img">
          <Image src="/mascots/milo.png" alt="" fill sizes="56px" className="object-contain" priority />
        </div>
        <span className="mt-1 block text-[10px] font-bold text-muted">Milo</span>
      </div>
    );
  }

  return <div className="shrink-0 text-center"><div className={`relative grid size-14 place-items-center rounded-[21px] border-4 border-white ${tone} shadow-elevated`} aria-label={`${name}, your learning buddy`} role="img"><span className="absolute left-[16px] top-[19px] size-2 rounded-full bg-ink" /><span className="absolute right-[16px] top-[19px] size-2 rounded-full bg-ink" /><span className="absolute bottom-[13px] left-1/2 h-2 w-5 -translate-x-1/2 rounded-b-full border-b-2 border-ink" /><span className="absolute -top-2 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-white bg-ink" /></div><span className="mt-1 block text-[10px] font-bold text-muted">{name}</span></div>;
}
