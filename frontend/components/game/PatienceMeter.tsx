"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type PatienceMeterProps = {
  customerName: string;
  durationSeconds?: number;
  onPatienceChange?: (multiplier: number) => void;
};

export function PatienceMeter({
  customerName,
  durationSeconds = 45,
  onPatienceChange,
}: PatienceMeterProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    setTimeLeft(durationSeconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [customerName, durationSeconds]);

  const percentage = Math.max(0, Math.round((timeLeft / durationSeconds) * 100));

  let statusText = "Super Fast (3x Tip Bonus)";
  let colorClass = "bg-emerald-500";
  let badgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
  let multiplier = 3;

  if (percentage <= 66 && percentage > 33) {
    statusText = "Steady Pace (2x Tip Bonus)";
    colorClass = "bg-amber-500";
    badgeClass = "bg-amber-100 text-amber-800 border-amber-300";
    multiplier = 2;
  } else if (percentage <= 33) {
    statusText = "Patient Customer (Standard Tip)";
    colorClass = "bg-sky-500";
    badgeClass = "bg-sky-100 text-sky-800 border-sky-300";
    multiplier = 1;
  }

  useEffect(() => {
    onPatienceChange?.(multiplier);
  }, [multiplier, onPatienceChange]);

  return (
    <div className="rounded-[28px] border border-line bg-canvas p-3.5 sm:p-4">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-muted">Customer Patience</span>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] ${badgeClass}`}>
            {statusText}
          </span>
        </div>
        <span className="font-mono text-ink">{timeLeft}s</span>
      </div>

      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-line/60">
        <motion.div
          className={`h-full rounded-full transition-colors duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ ease: "linear", duration: 0.5 }}
        />
      </div>
    </div>
  );
}
