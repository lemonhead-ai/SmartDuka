"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  DashboardSquare01Icon, 
  ShoppingBag01Icon, 
  AdventureIcon
} from "hugeicons-react";

const items = [
  { href: "/dashboard", icon: DashboardSquare01Icon, label: "Home" },
  { href: "/shop", icon: ShoppingBag01Icon, label: "Shop" },
  { href: "/adventure", icon: AdventureIcon, label: "Play" }
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center lg:hidden px-4">
      <nav className="flex items-center gap-1 rounded-full bg-gradient-to-b from-white/45 to-white/15 dark:from-white/10 dark:to-white/5 p-1.5 backdrop-blur-2xl saturate-190 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          
          return (
            <Link 
              key={href} 
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
              className="relative"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`relative flex items-center justify-center h-10 rounded-full px-3.5 transition-colors duration-300 ${
                  isActive 
                  ? 'text-accent' 
                    : 'text-ink/60 hover:text-ink/90'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTabIndicator"
                  className="absolute inset-0 rounded-full border border-accent/30 bg-gradient-to-tr from-accent/20 to-accent/5 shadow-inner z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={24} color="currentColor" className="shrink-0 relative z-10" />
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-2 text-sm font-semibold whitespace-nowrap overflow-hidden relative z-10"
                  >
                    {label}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
