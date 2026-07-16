import Link from "next/link";

export function MissionCard() {
  return <section className="relative overflow-hidden rounded-[2rem] bg-clay p-7 text-white shadow-card"><span className="absolute -right-4 -top-5 text-8xl opacity-20" aria-hidden="true">☀</span><p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">Today&apos;s mission</p><h2 className="mt-3 max-w-lg text-2xl font-black leading-tight">Help Mama Wanjiku serve 5 customers before the market opens.</h2><p className="mt-3 max-w-xl text-white/85">Give the right change three times in a row to earn a new shop sign.</p><div className="mt-6 flex flex-wrap items-center gap-4"><div className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold">Progress: 2 of 5</div><Link href="/shop" className="rounded-xl bg-white px-5 py-3 font-black text-clay">Start mission →</Link></div></section>;
}
