"use client";

import { Invoice01Icon, PackageIcon } from "hugeicons-react";

export function GuideCardGrid() {
  return (
    <section className="space-y-3">
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
        Top guides for you
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Guide Card 1 */}
        <article className="group rounded-[32px] border border-line bg-surface p-4 sm:p-5 shadow-sm transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between">
          <div>
            {/* Top Illustrated Graphic Container */}
            <div className="relative h-40 sm:h-44 w-full rounded-2xl bg-canvas border border-line overflow-hidden flex items-center justify-center p-4">
              <div className="relative z-10 flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-surface border border-line text-accent shadow-sm">
                  <span className="text-2xl">🧮</span>
                </div>
                <div className="space-y-1">
                  <div className="rounded-xl bg-surface border border-line px-3 py-1 shadow-sm inline-block">
                    <p className="text-xs font-black text-ink">KES 100 - 65 = 35</p>
                  </div>
                  <p className="text-[11px] font-semibold text-muted">Counting up method</p>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="mt-4">
              <h4 className="font-extrabold text-base sm:text-lg text-ink group-hover:text-accent transition-colors leading-snug">
                Mastering Quick Change: Mental Math Secrets for Swift Duka Sales
              </h4>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center gap-2 text-xs font-semibold text-muted">
            <Invoice01Icon size={16} color="currentColor" />
            <span>Math Shortcuts &bull; 4 min read</span>
          </div>
        </article>

        {/* Guide Card 2 */}
        <article className="group rounded-[32px] border border-line bg-surface p-4 sm:p-5 shadow-sm transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between">
          <div>
            {/* Top Illustrated Graphic Container */}
            <div className="relative h-40 sm:h-44 w-full rounded-2xl bg-canvas border border-line overflow-hidden flex items-center justify-center p-4">
              <div className="relative z-10 flex items-center gap-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-surface border border-line text-accent shadow-sm">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="space-y-1">
                  <div className="rounded-xl bg-surface border border-line px-3 py-1 shadow-sm inline-block">
                    <p className="text-xs font-black text-ink">Sugar &bull; Flour &bull; Milk</p>
                  </div>
                  <p className="text-[11px] font-semibold text-muted">Always keep 10+ in stock</p>
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="mt-4">
              <h4 className="font-extrabold text-base sm:text-lg text-ink group-hover:text-accent transition-colors leading-snug">
                Smart Restocking &amp; Inventory: Keep Your Shelves Ready for Morning Rush
              </h4>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line flex items-center gap-2 text-xs font-semibold text-muted">
            <PackageIcon size={16} color="currentColor" />
            <span>Shop Strategy &bull; 5 min read</span>
          </div>
        </article>
      </div>
    </section>
  );
}
