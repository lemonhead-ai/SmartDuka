import Link from "next/link";

import { LandingCardWheel } from "@/components/marketing/LandingCardWheel";
import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";

export default function MarketingHomePage() {
  return <main id="main-content" className="h-dvh overflow-hidden bg-[#5d5d67] p-3 sm:p-6">
    <section className="relative mx-auto flex h-[calc(100dvh-1.5rem)] max-w-[1480px] flex-col overflow-hidden rounded-[32px] bg-[#0a0e0c] px-5 py-5 text-white shadow-2xl sm:h-[calc(100dvh-3rem)] sm:px-8 sm:py-7 lg:px-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[32px] opacity-25" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)", backgroundSize: "74px 74px", maskImage: "linear-gradient(to bottom, black, transparent 80%)" }} />
      <nav className="relative z-10 flex items-center justify-between gap-4"><SmartDukaLogo /><div className="flex items-center gap-2 sm:gap-3"><Link href="/sign-in" className="rounded-full px-3 py-2 text-sm font-semibold text-white sm:px-5">Log in</Link><Link href="/sign-up" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0a0e0c] sm:px-5">Sign up</Link></div></nav>
      <div className="relative z-10 mx-auto flex min-h-0 max-w-3xl flex-1 flex-col items-center justify-center pb-2 pt-8 text-center sm:pt-10"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d9f26c]">Play. Learn. Grow.</p><h1 className="mt-4 text-4xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">A learning adventure<br />in every duka.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Run your own shop, help friendly customers, and build everyday maths and reading skills through play.</p><div className="mt-6 flex flex-col items-center gap-2"><Link href="/sign-up" className="inline-flex rounded-full bg-[#d9f26c] px-6 py-3 font-bold text-[#102010]">Create my duka</Link><p className="text-xs text-white/50">Create an account first, then set up your duka.</p></div></div>
      <LandingCardWheel />
    </section>
  </main>;
}
