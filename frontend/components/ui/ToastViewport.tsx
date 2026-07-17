"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

import { useToastStore } from "@/features/feedback/toast-store";

export function ToastViewport() {
  const { toast, dismissToast } = useToastStore();

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(dismissToast, 5_000);
    return () => window.clearTimeout(timeout);
  }, [dismissToast, toast]);

  return (
    <AnimatePresence mode="wait">
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 50, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-[100] w-[min(92vw,24rem)] sm:right-6"
        >
          <div className="relative overflow-hidden rounded-[24px] border border-white/50 bg-white/75 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.08)] backdrop-blur-xl saturate-150 flex items-start gap-4">
            {/* Mascot Icon on Left */}
            <div className="relative size-12 shrink-0 bg-line/40 rounded-[14px] flex items-center justify-center">
              <Image 
                src="/mascots/milo.png" 
                alt="Milo" 
                width={36} 
                height={36} 
                className="object-contain"
                priority 
              />
            </div>
            
            {/* Notification Body on Right */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  toast.kind === "success" ? "text-green-700" :
                  toast.kind === "error" ? "text-red-700" :
                  toast.kind === "warning" ? "text-yellow-700" : "text-blue-700"
                }`}>
                  {toast.kind === "success" ? "Success" :
                   toast.kind === "error" ? "Oops!" :
                   toast.kind === "warning" ? "Watch out" : "Notification"}
                </span>
                <span className="text-[10px] font-medium text-muted/65">now</span>
              </div>
              <p className="mt-1 break-words text-sm font-semibold leading-normal text-ink">
                {toast.message}
              </p>
            </div>
            
            {/* Close Button */}
            <button 
              type="button" 
              onClick={dismissToast} 
              aria-label="Dismiss message" 
              className="grid size-6 shrink-0 place-items-center rounded-full text-base leading-none text-muted transition-colors hover:bg-black/5"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
