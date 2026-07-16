"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  DashboardSquare01Icon, 
  ShoppingBag01Icon, 
  AdventureIcon, 
  Award01Icon
} from "hugeicons-react";

const items = [
  { href: "/dashboard", icon: DashboardSquare01Icon, label: "Dashboard" },
  { href: "/shop", icon: ShoppingBag01Icon, label: "Shop" },
  { href: "/adventure", icon: AdventureIcon, label: "Play" },
  { href: "/profile", icon: Award01Icon, label: "Progress" }
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 bg-white/80 backdrop-blur-xl border-t border-line shadow-[0_-4px_24px_rgba(0,0,0,0.04)] lg:hidden">
      {items.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        
        return (
          <Link 
            key={href} 
            href={href}
            className="relative flex flex-col items-center justify-center w-16 h-14"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center transition-colors duration-200 ${isActive ? 'text-accent' : 'text-ink/50 hover:text-ink/80'}`}
            >
              <Icon size={24} color="currentColor" />
              <span className="text-[10px] font-semibold mt-1">
                {label}
              </span>
            </motion.div>
            {isActive && (
              <motion.div 
                layoutId="bottomNavIndicator"
                className="absolute -top-2 w-12 h-1 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
