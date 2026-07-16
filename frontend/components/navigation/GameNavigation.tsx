"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { AdventureIcon, ArrowLeft01Icon, Award01Icon, DashboardSquare01Icon, ShoppingBag01Icon, UserIcon } from "hugeicons-react";
import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";

const items = [{ href: "/dashboard", icon: DashboardSquare01Icon, label: "Dashboard" }, { href: "/shop", icon: ShoppingBag01Icon, label: "My shop" }, { href: "/adventure", icon: AdventureIcon, label: "Adventure" }, { href: "/rewards", icon: Award01Icon, label: "Rewards" }, { href: "/parents", icon: UserIcon, label: "Parents" }];

export function GameNavigation() {
  const [expanded, setExpanded] = useState(true);
  return <motion.aside className="tahoe-sidebar hidden flex-col px-3 py-5 lg:flex" animate={{ width: expanded ? 240 : 68 }} transition={{ type: "tween", duration: expanded ? 0.35 : 0.28, ease: [0.32, 0.72, 0, 1] }}><div className="px-2"><SmartDukaLogo compact={!expanded} /></div><nav className="mt-10 space-y-1">{items.map(({ href, icon: Icon, label }) => <motion.div key={href} whileHover={{ backgroundColor: "rgba(0,0,0,0.04)" }} transition={{ duration: 0.15 }} className="overflow-hidden rounded-[14px]"><Link href={href} className="flex items-center gap-3 px-[14px] py-[10px] font-medium text-ink"><Icon size={24} color="currentColor" /><motion.span animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.15, delay: expanded ? 0.1 : 0 }}>{label}</motion.span></Link></motion.div>)}</nav><motion.button type="button" aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} onClick={() => setExpanded((value) => !value)} whileTap={{ scale: 0.97 }} className="mt-auto grid size-11 place-items-center self-center rounded-2xl border border-line bg-surface text-ink"><motion.span animate={{ rotate: expanded ? 0 : 180 }}><ArrowLeft01Icon size={20} color="currentColor" /></motion.span></motion.button></motion.aside>;
}
