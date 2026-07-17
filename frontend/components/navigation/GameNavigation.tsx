"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AdventureIcon, SidebarLeftIcon, SidebarRightIcon, Award01Icon, DashboardSquare01Icon, ShoppingBag01Icon } from "hugeicons-react";
import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { gameplayApi } from "@/features/gameplay/api";

const items = [{ href: "/dashboard", icon: DashboardSquare01Icon, label: "Home" }, { href: "/shop", icon: ShoppingBag01Icon, label: "My shop" }, { href: "/adventure", icon: AdventureIcon, label: "Missions" }, { href: "/profile", icon: Award01Icon, label: "Progress" }];

export function GameNavigation() {
  const [expanded, setExpanded] = useState(true);
  const progressQuery = useQuery({ queryKey: ["player-progress"], queryFn: gameplayApi.progress });
  const studentName = progressQuery.data?.student_name ?? "Shopkeeper";
  const initials = studentName.slice(0, 2).toUpperCase();

  return (
    <motion.aside className="tahoe-sidebar hidden flex-col px-3 py-5 lg:flex border-r border-line" animate={{ width: expanded ? 240 : 68 }} transition={{ type: "tween", duration: expanded ? 0.35 : 0.28, ease: [0.32, 0.72, 0, 1] }}>
      <div className={`flex items-center ${expanded ? 'px-2 justify-between' : 'justify-center'}`}>
        <motion.div animate={{ width: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }} className="overflow-hidden whitespace-nowrap">
          <SmartDukaLogo compact={false} />
        </motion.div>
        <button type="button" aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} onClick={() => setExpanded((value) => !value)} className="grid size-11 shrink-0 place-items-center rounded-2xl hover:bg-[rgba(0,0,0,0.04)] text-ink transition-colors">
          {expanded ? <SidebarLeftIcon size={24} color="currentColor" /> : <SidebarRightIcon size={24} color="currentColor" />}
        </button>
      </div>

      <nav className="mt-10 space-y-1">
        {items.map(({ href, icon: Icon, label }) => (
          <motion.div key={href} whileHover={{ backgroundColor: "rgba(0,0,0,0.04)" }} transition={{ duration: 0.15 }} className="overflow-hidden rounded-[14px]">
            <Link href={href} className="flex items-center gap-3 px-[14px] py-[10px] font-medium text-ink">
              <Icon size={24} color="currentColor" className="shrink-0" />
              <motion.span animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.15, delay: expanded ? 0.1 : 0 }} className="whitespace-nowrap">
                {label}
              </motion.span>
            </Link>
          </motion.div>
        ))}
      </nav>

      <div className="mt-auto overflow-hidden rounded-[14px]">
        <Link href="/profile" className="flex items-center gap-3 px-[10px] py-[10px] hover:bg-[rgba(0,0,0,0.04)] transition-colors">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-mango text-[11px] font-bold text-white">
            {initials}
          </div>
          <motion.span animate={{ opacity: expanded ? 1 : 0 }} transition={{ duration: 0.15 }} className="whitespace-nowrap font-medium text-sm text-ink truncate">
            {studentName}
          </motion.span>
        </Link>
      </div>
    </motion.aside>
  );
}
