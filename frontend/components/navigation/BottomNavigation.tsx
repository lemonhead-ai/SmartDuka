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
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center lg:hidden px-4">
      <nav className="flex items-center gap-1 rounded-full bg-white/60 p-2 backdrop-blur-xl saturate-150 shadow-elevated border border-white/50">
        {items.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          
          return (
            <Link 
              key={href} 
              href={href}
              className="relative"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex items-center justify-center h-12 rounded-full px-4 transition-colors ${
                  isActive 
                    ? 'bg-[#10B981]/15 text-[#047857]' 
                    : 'text-ink/60 hover:text-ink/90 bg-transparent'
                }`}
              >
                <Icon size={24} color="currentColor" className="shrink-0" />
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-2 text-sm font-semibold whitespace-nowrap overflow-hidden"
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
