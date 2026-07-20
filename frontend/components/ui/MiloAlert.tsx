"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { formatMiloMessage, type ToastKind } from "@/features/feedback/toast-store";

const messageTones: Record<ToastKind, { bg: string; sender: string }> = {
  success: { bg: "bg-green-100 dark:bg-green-950/80", sender: "text-green-800 dark:text-green-200" },
  error: { bg: "bg-red-100 dark:bg-red-950/80", sender: "text-red-800 dark:text-red-200" },
  warning: { bg: "bg-yellow-100 dark:bg-yellow-950/80", sender: "text-yellow-800 dark:text-yellow-200" },
  info: { bg: "bg-blue-100 dark:bg-blue-950/80", sender: "text-blue-800 dark:text-blue-200" },
};

type MiloAlertProps = {
  kind?: ToastKind;
  message: string;
  className?: string;
};

export function MiloAlert({ kind = "info", message, className = "" }: MiloAlertProps) {
  const tone = messageTones[kind];
  const cleanMessage = formatMiloMessage(message);

  if (!cleanMessage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`flex w-full items-center gap-2 sm:items-end sm:gap-3 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="relative size-11 shrink-0 sm:size-12" aria-label="Milo, your learning buddy" role="img">
        <Image
          src="/mascots/milo.PNG"
          alt=""
          fill
          sizes="(max-width: 639px) 44px, 48px"
          className="object-contain"
          priority
        />
      </div>
      <div className={`relative min-w-0 flex-1 px-2.5 py-2 border-ink dark:border-white border-[3px] shadow-elevated hand-drawn-bubble sm:px-4 sm:py-3 ${tone.bg}`}>
        <span
          className={`absolute -left-[8px] top-1/2 size-3.5 -translate-y-1/2 rotate-45 border-b-[3px] border-l-[3px] border-ink dark:border-white sm:-bottom-[9px] sm:left-8 sm:top-auto sm:size-4 sm:translate-y-0 sm:rotate-[-45deg] ${tone.bg}`}
          aria-hidden="true"
        />
        <div className="relative z-10 min-w-0">
          <p className={`text-[9px] font-bold uppercase tracking-[0.05em] sm:text-[10px] ${tone.sender}`}>Milo</p>
          <p className="mt-0.5 break-words text-[12px] font-semibold leading-4 text-ink dark:text-white sm:text-[14px] sm:leading-relaxed">
            {cleanMessage}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
