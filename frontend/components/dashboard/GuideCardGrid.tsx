"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Invoice01Icon,
  PackageIcon,
  Cancel01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  SparklesIcon
} from "hugeicons-react";

type GuideSection = {
  heading: string;
  points: string[];
  callout?: string;
};

type Guide = {
  id: string;
  title: string;
  category: string;
  readTime: string;
  icon: string;
  previewSnippet: string;
  previewSubtext: string;
  categoryIcon: "math" | "inventory";
  summary: string;
  sections: GuideSection[];
  proTip: string;
};

const guidesData: Guide[] = [
  {
    id: "quick-change",
    title: "Mastering Quick Change: Mental Math Secrets for Swift Duka Sales",
    category: "Math Shortcuts",
    readTime: "4 min read",
    icon: "🧮",
    previewSnippet: "KES 100 - 65 = 35",
    previewSubtext: "Counting up method",
    categoryIcon: "math",
    summary:
      "Every top shopkeeper in Nairobi and Mombasa uses mental shortcuts instead of slow pencil subtraction. Learn how to calculate customer change instantly without making costly mistakes.",
    sections: [
      {
        heading: "1. The 'Counting Up' Shopkeeper Method",
        points: [
          "Never subtract backwards (e.g. 100 minus 65). It strains your working memory.",
          "Instead, start from the price and count forward to the cash note given by the customer.",
          "Example: A customer buys goods worth KES 65 and hands you a KES 100 note.",
          "Step 1: Say '65'. Add a 5 coin → '70'.",
          "Step 2: Add a 10 coin → '80'.",
          "Step 3: Add a 20 coin → '100'.",
          "What did you hand over? 5 + 10 + 20 = KES 35 change! Simple, fast, and fail-safe."
        ],
        callout: "Formula: Item Total + Change Coins = Bill Received"
      },
      {
        heading: "2. The 'Friendly Ten' Pairing Technique",
        points: [
          "Always pair numbers that make 10 or 100: (1 + 9), (2 + 8), (3 + 7), (4 + 6), (5 + 5).",
          "If an order ends in 7, the change coins must end in 3 to round out to the nearest ten.",
          "Training your eyes to spot 10-pairs cuts your cashier checkout time in half."
        ]
      },
      {
        heading: "3. Speak While You Hand the Cash",
        points: [
          "Place the change into the customer's palm while counting up aloud.",
          "Say: 'That makes 70, 80, and 100. Thank you karibu tena!'",
          "This builds immense trust and prevents any disputes before they happen."
        ]
      }
    ],
    proTip: "Keep coins organized in your drawer: 1s & 5s on the left, 10s & 20s in the center, and notes on the right."
  },
  {
    id: "smart-restocking",
    title: "Smart Restocking & Inventory: Keep Your Shelves Ready for Morning Rush",
    category: "Shop Strategy",
    readTime: "5 min read",
    icon: "📦",
    previewSnippet: "Sugar • Flour • Milk",
    previewSubtext: "Always keep 10+ in stock",
    categoryIcon: "inventory",
    summary:
      "A duka that runs out of milk or bread in the morning loses repeat customers for good. Discover how to balance stock, apply FIFO rotation, and maximize daily shop turnover.",
    sections: [
      {
        heading: "1. The Big 4 Morning Essentials",
        points: [
          "Between 6:30 AM and 8:30 AM, 70% of neighbourhood buyers want breakfast items:",
          "Fresh Packaged Milk (500ml), Sliced Bread, Tea Leaves, and Sugar.",
          "Never let these drop below the 'Safety 10' line before closing your shop at night."
        ],
        callout: "Golden Rule: If stock drops below 10 units before sunset, restock from wholesale immediately."
      },
      {
        heading: "2. The FIFO Rule (First-In, First-Out)",
        points: [
          "Always rotate perishable goods like dairy, yogurt, and fresh bread.",
          "When newly bought wholesale cartons arrive, put them BEHIND older stock on shelves.",
          "Customers naturally grab front items, ensuring goods sell before their expiration dates."
        ]
      },
      {
        heading: "3. Visual Shelf Merchandising",
        points: [
          "Keep related items side-by-side: place sugar next to tea and coffee jars.",
          "Shoppers who came in just for milk will often add bread or tea if they see it right nearby."
        ]
      }
    ],
    proTip: "Review your shop ledger every evening. Re-invest 60% of daily profits directly into high-turnover staples."
  }
];

export function GuideCardGrid() {
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [readGuides, setReadGuides] = useState<string[]>([]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedGuide(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const markAsRead = (guideId: string) => {
    if (!readGuides.includes(guideId)) {
      setReadGuides((prev) => [...prev, guideId]);
    }
    setSelectedGuide(null);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
          Top guides for you
        </h3>
        <span className="text-xs font-semibold text-muted">
          Tap a guide to read notes
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {guidesData.map((guide) => {
          const isRead = readGuides.includes(guide.id);

          return (
            <article
              key={guide.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedGuide(guide)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedGuide(guide);
                }
              }}
              className="group cursor-pointer rounded-[32px] border border-line bg-surface p-4 sm:p-5 shadow-sm transition-all duration-300 hover:scale-[1.015] hover:shadow-md hover:border-accent/40 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div>
                {/* Top Illustrated Graphic Container */}
                <div className="relative h-40 sm:h-44 w-full rounded-2xl bg-canvas border border-line overflow-hidden flex items-center justify-center p-4 group-hover:border-accent/30 transition-colors">
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="grid size-14 place-items-center rounded-2xl bg-surface border border-line text-accent shadow-sm group-hover:scale-110 transition-transform">
                      <span className="text-2xl">{guide.icon}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="rounded-xl bg-surface border border-line px-3 py-1 shadow-sm inline-block">
                        <p className="text-xs font-black text-ink">{guide.previewSnippet}</p>
                      </div>
                      <p className="text-[11px] font-semibold text-muted">{guide.previewSubtext}</p>
                    </div>
                  </div>

                  {/* 'Read' badge indicator */}
                  {isRead && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] font-black">
                      <CheckmarkCircle02Icon size={13} color="currentColor" />
                      <span>Read</span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="mt-4">
                  <h4 className="font-extrabold text-base sm:text-lg text-ink group-hover:text-accent transition-colors leading-snug">
                    {guide.title}
                  </h4>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-muted">
                <div className="flex items-center gap-2">
                  {guide.categoryIcon === "math" ? (
                    <Invoice01Icon size={16} color="currentColor" />
                  ) : (
                    <PackageIcon size={16} color="currentColor" />
                  )}
                  <span>{guide.category} &bull; {guide.readTime}</span>
                </div>

                <span className="text-accent font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Open notes &rarr;
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Interactive Reader Modal Dialog */}
      <AnimatePresence>
        {selectedGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedGuide(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] border border-line bg-surface text-ink shadow-2xl overflow-hidden"
            >
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-line bg-canvas flex items-start justify-between gap-4 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-black">
                      <BookOpen01Icon size={13} color="currentColor" />
                      {selectedGuide.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                      <Clock01Icon size={13} color="currentColor" />
                      {selectedGuide.readTime}
                    </span>
                  </div>
                  <h3
                    id="guide-modal-title"
                    className="text-lg sm:text-xl font-black text-ink leading-snug tracking-tight"
                  >
                    {selectedGuide.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGuide(null)}
                  aria-label="Close notes"
                  className="grid size-9 place-items-center rounded-full bg-surface border border-line text-muted hover:text-ink hover:bg-canvas transition-colors shrink-0"
                >
                  <Cancel01Icon size={18} color="currentColor" />
                </button>
              </div>

              {/* Scrollable Reader Body */}
              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                {/* Summary banner */}
                <div className="p-4 rounded-2xl bg-canvas border border-line text-xs sm:text-sm font-medium text-ink/80 leading-relaxed">
                  {selectedGuide.summary}
                </div>

                {/* Content Sections */}
                {selectedGuide.sections.map((section, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <h4 className="text-sm sm:text-base font-bold text-ink tracking-tight flex items-center gap-2">
                      <span className="size-2 rounded-full bg-accent inline-block shrink-0" />
                      {section.heading}
                    </h4>

                    <div className="space-y-1.5 pl-4 border-l-2 border-line">
                      {section.points.map((pt, pIdx) => (
                        <p key={pIdx} className="text-xs sm:text-sm text-muted leading-relaxed">
                          {pt}
                        </p>
                      ))}
                    </div>

                    {section.callout && (
                      <div className="mt-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold text-xs sm:text-sm">
                        {section.callout}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pro Shopkeeper Tip Box */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                  <span className="text-xl shrink-0">💡</span>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-500">
                      Pro Shopkeeper Tip
                    </h5>
                    <p className="text-xs sm:text-sm font-semibold text-ink mt-0.5">
                      {selectedGuide.proTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="p-4 sm:p-5 border-t border-line bg-canvas flex items-center justify-between gap-3 shrink-0">
                <span className="text-xs text-muted font-medium hidden sm:inline">
                  SmartDuka Shopkeeper Academy
                </span>

                <button
                  type="button"
                  onClick={() => markAsRead(selectedGuide.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white dark:text-black font-extrabold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <SparklesIcon size={16} color="currentColor" />
                  <span>Got it! Mark as Read</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

