"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight01Icon, Store01Icon } from "hugeicons-react";

export function HeroBannerCard() {
  return (
    <article className="relative overflow-hidden rounded-[36px] border border-line bg-surface p-6 sm:p-8 md:p-10 transition-all duration-300 hover:shadow-md min-h-[500px] md:min-h-0 flex flex-col justify-center">
      {/* Subtle theme glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 size-72 rounded-full bg-accent/5 blur-3xl" />

      {/* Mobile Layout: Centered, Mascot below badge, Title & Subtitle below mascot, Button below everything */}
      <div className="relative z-10 flex md:hidden flex-col items-center text-center gap-4 sm:gap-5 py-3">
        {/* 1. Today's Store Quest Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-line px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
          <Store01Icon size={14} />
          <span>Today&apos;s Store Quest</span>
        </div>

        {/* 2. Mascot Image of Milo with +50 Coins bubble */}
        <div className="relative shrink-0 flex items-center justify-center my-1.5">
          <div className="relative size-40 sm:size-44 rounded-full bg-canvas border border-line p-3 flex items-center justify-center shadow-inner">
            <Image
              src="/mascots/milo.PNG"
              alt="Milo shopkeeper"
              width={160}
              height={160}
              className="w-full h-full object-contain filter drop-shadow-sm"
              priority
            />
            {/* Quest reward bubble */}
            <div className="absolute -top-1.5 -left-1.5 rounded-2xl bg-surface border border-line px-3 py-1 shadow-sm flex items-center gap-1.5">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-black text-ink">+50 Coins</span>
            </div>
          </div>
        </div>

        {/* 3. Title */}
        <h2 className="text-2xl font-black tracking-tight text-ink leading-tight max-w-xs">
          Have you served your morning customers yet?
        </h2>

        {/* 4. Subtext / Description */}
        <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed max-w-xs sm:max-w-sm">
          Smart shopkeepers verify change fast, keep high stock, and earn Duka Coins with every customer served.
        </p>

        {/* 5. Button below everything */}
        <div className="pt-2 w-full max-w-xs flex justify-center">
          <Link
            href="/shop?tab=counter"
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Open counter</span>
            <ArrowRight01Icon size={18} />
          </Link>
        </div>
      </div>

      {/* Desktop Layout: Side-by-side */}
      <div className="relative z-10 hidden md:flex md:flex-row md:items-center justify-between gap-6">
        {/* Left Content */}
        <div className="max-w-lg space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-line px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            <Store01Icon size={14} />
            <span>Today&apos;s Store Quest</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-ink leading-tight">
            Have you served your morning customers yet?
          </h2>

          <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed max-w-md">
            Smart shopkeepers verify change fast, keep high stock, and earn Duka Coins with every customer served.
          </p>

          <div className="pt-1">
            <Link
              href="/shop?tab=counter"
              className="inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-ink/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Open counter</span>
              <ArrowRight01Icon size={18} />
            </Link>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="relative shrink-0 flex items-center justify-center self-end md:self-center pr-2">
          <div className="relative size-36 sm:size-44 md:size-48 rounded-full bg-canvas border border-line p-3 flex items-center justify-center shadow-inner">
            <Image
              src="/mascots/milo.PNG"
              alt="Milo shopkeeper"
              width={160}
              height={160}
              className="w-full h-full object-contain filter drop-shadow-sm"
              priority
            />
            {/* Quest reward bubble */}
            <div className="absolute -top-2 -left-2 rounded-2xl bg-surface border border-line px-2.5 py-1.5 shadow-sm flex items-center gap-1.5">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-black text-ink">+50 Coins</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
