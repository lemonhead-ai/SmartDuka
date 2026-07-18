"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

import { useToastStore, type ToastKind } from "@/features/feedback/toast-store";

const messageTones: Record<ToastKind, { bubble: string; sender: string; tail: string }> = {
  success: { bubble: "border-green-300 bg-green-100 dark:border-green-800 dark:bg-green-900", sender: "text-green-800 dark:text-green-200", tail: "border-green-300 bg-green-100 dark:border-green-800 dark:bg-green-900" },
  error: { bubble: "border-red-300 bg-red-100 dark:border-red-800 dark:bg-red-900", sender: "text-red-800 dark:text-red-200", tail: "border-red-300 bg-red-100 dark:border-red-800 dark:bg-red-900" },
  warning: { bubble: "border-yellow-300 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900", sender: "text-yellow-800 dark:text-yellow-200", tail: "border-yellow-300 bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900" },
  info: { bubble: "border-blue-300 bg-blue-100 dark:border-blue-800 dark:bg-blue-900", sender: "text-blue-800 dark:text-blue-200", tail: "border-blue-300 bg-blue-100 dark:border-blue-800 dark:bg-blue-900" },
};

export function ToastViewport() {
  const { toast, dismissToast } = useToastStore();

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(dismissToast, 5_000);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast]);

  const tone = toast ? messageTones[toast.kind] : messageTones.info;

  return (
    <AnimatePresence mode="wait">
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 24, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 26 }}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[100] flex w-[min(92vw,31rem)] items-end gap-3 sm:right-6"
        >
          <div className="relative size-14 shrink-0" aria-label="Milo, your learning buddy" role="img">
            <Image src="/mascots/milo.png" alt="" fill sizes="56px" className="object-contain" priority />
          </div>
          <div className={`relative min-w-0 flex-1 rounded-[42px] border-2 px-5 py-4 shadow-elevated sm:px-6 sm:py-5 ${tone.bubble}`}>
            <span className={`absolute -bottom-3 left-8 size-6 rotate-[-35deg] border-b-2 border-l-2 ${tone.tail}`} aria-hidden="true" />
            <div className="relative z-10 min-w-0">
              <p className={`text-[11px] font-semibold tracking-[0.04em] ${tone.sender}`}>Milo</p>
              <p className="mt-1 break-words text-[15px] font-medium leading-relaxed text-ink">{toast.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
