import Link from "next/link";

export function MissionCard() {
  return <section className="rounded-[24px] border border-line bg-surface p-7"><p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Today’s mission</p><h2 className="mt-3 max-w-lg text-2xl font-semibold leading-tight">Serve a customer and solve their checkout challenge.</h2><p className="mt-3 max-w-xl text-muted">Your live session will show the exact mission progress and rewards.</p><div className="mt-6"><Link href="/shop" className="inline-flex rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Open shop</Link></div></section>;
}
