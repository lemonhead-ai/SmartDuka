"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

import { useToastStore, type ToastKind } from "@/features/feedback/toast-store";

const messageTones: Record<ToastKind, { bg: string; sender: string }> = {
  success: { bg: "bg-green-100 dark:bg-green-950/80", sender: "text-green-800 dark:text-green-200" },
  error: { bg: "bg-red-100 dark:bg-red-950/80", sender: "text-red-800 dark:text-red-200" },
  warning: { bg: "bg-yellow-100 dark:bg-yellow-950/80", sender: "text-yellow-800 dark:text-yellow-200" },
  info: { bg: "bg-blue-100 dark:bg-blue-950/80", sender: "text-blue-800 dark:text-blue-200" },
};

const OpenQuotes = () => (
  <svg className="absolute -top-3 left-6 h-5 w-7 text-ink dark:text-white fill-current select-none" viewBox="0 0 32 24">
    <path d="M9 16a3 3 0 0 1-3-3c0-2.5 2-5 5-6.5c.3-.2.6.2.4.4c-1.2 1.2-2.4 2.6-2.4 4.1.8-.5 1.7-.5 2.4.2.8.8.8 2 .2 2.8c-.6.6-1.6.8-2.6.8z" />
    <path d="M21 16a3 3 0 0 1-3-3c0-2.5 2-5 5-6.5c.3-.2.6.2.4.4c-1.2 1.2-2.4 2.6-2.4 4.1.8-.5 1.7-.5 2.4.2.8.8.8 2 .2 2.8c-.6.6-1.6.8-2.6.8z" />
  </svg>
);

const CloseQuotes = () => (
  <svg className="absolute -bottom-3 right-6 h-5 w-7 text-ink dark:text-white fill-current select-none" viewBox="0 0 32 24">
    <path d="M9 8a3 3 0 0 1 3 3c0 2.5-2 5-5 6.5c-.3.2-.6-.2-.4-.4c1.2-1.2 2.4-2.6 2.4-4.1c-.8.5-1.7.5-2.4-.2c-.8-.8-.8-2-.2-2.8c.6-.6 1.6-.8 2.6-.8z" />
    <path d="M21 8a3 3 0 0 1 3 3c0 2.5-2 5-5 6.5c-.3.2-.6-.2-.4-.4c1.2-1.2 2.4-2.6 2.4-4.1c-.8.5-1.7.5-2.4-.2c-.8-.8-.8-2-.2-2.8c.6-.6 1.6-.8 2.6-.8z" />
  </svg>
);

const TopRightDecor = () => (
  <svg className="absolute -top-4.5 -right-2 h-6 w-8 text-ink dark:text-white fill-current select-none" viewBox="0 0 32 24">
    <rect x="6" y="14" width="3" height="8" rx="1.5" transform="rotate(30 7.5 18)" />
    <rect x="14" y="8" width="3" height="8" rx="1.5" transform="rotate(30 15.5 12)" />
    <rect x="22" y="2" width="3" height="8" rx="1.5" transform="rotate(30 23.5 6)" />
  </svg>
);

const BottomLeftDecor = () => (
  <svg className="absolute -bottom-4 -left-2.5 h-6 w-6 text-ink dark:text-white fill-current select-none" viewBox="0 0 24 24">
    <rect x="6" y="10" width="3" height="8" rx="1.5" transform="rotate(45 7.5 14)" />
    <rect x="14" y="4" width="3" height="8" rx="1.5" transform="rotate(45 15.5 8)" />
  </svg>
);

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
          <div className={`relative min-w-0 flex-1 px-5 py-4 border-ink dark:border-white border-[3px] shadow-elevated sm:px-6 sm:py-5 hand-drawn-bubble ${tone.bg}`}>
            <span className={`absolute -bottom-[9px] left-8 size-4 rotate-[-45deg] border-b-[3px] border-l-[3px] border-ink dark:border-white ${tone.bg}`} aria-hidden="true" />
            <OpenQuotes />
            <CloseQuotes />
            <TopRightDecor />
            <BottomLeftDecor />
            <div className="relative z-10 min-w-0">
              <p className={`text-[11px] font-semibold tracking-[0.04em] ${tone.sender}`}>Milo</p>
              <p className="mt-1 break-words text-[15px] font-medium leading-relaxed text-ink dark:text-white">{toast.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
