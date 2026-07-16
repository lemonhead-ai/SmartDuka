"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { useToastStore } from "@/features/feedback/toast-store";

const toneClass = {
  success: "text-green-700",
  error: "text-red-700",
  warning: "text-yellow-700",
  info: "text-blue-700"
};

export function ToastViewport() {
  const { toast, dismissToast } = useToastStore();

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(dismissToast, 5_000);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast]);

  return <AnimatePresence>{toast && <motion.div role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className={`fixed left-1/2 top-6 z-[100] w-[min(92vw,32rem)] -translate-x-1/2 rounded-[20px] border border-line bg-surface px-5 py-4 text-center text-sm font-medium shadow-elevated ${toneClass[toast.kind]}`}>{toast.message}</motion.div>}</AnimatePresence>;
}
