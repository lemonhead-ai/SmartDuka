"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";

type StatCardProps = { icon: ComponentType<{ size?: number; color?: string }>; label: string; value: string; detail: string; tone: "mango" | "leaf" | "sky" };

export function StatCard({ icon: Icon, label, value, detail }: StatCardProps) {
  return <motion.article whileHover={{ scale: 1.015 }} transition={{ duration: 0.2, ease: "easeOut" }} className="rounded-[24px] border border-line bg-surface p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div><span className="grid size-11 place-items-center rounded-2xl border border-line text-ink"><Icon size={20} color="currentColor" /></span></div><p className="mt-3 text-sm text-muted">{detail}</p></motion.article>;
}
