import Link from "next/link";

const shelves = ["🥖", "🧃", "🧼", "🍌", "📒", "🍬"];

export function ShopPreview() {
  return <section className="rounded-[2rem] bg-white p-6 shadow-card"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-ink/60">Your duka</p><h2 className="text-xl font-black">Amina&apos;s Sunshine Shop</h2></div><Link href="/shop" className="text-sm font-black text-leaf">Open shop →</Link></div><div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-cream p-4">{shelves.map((item, index) => <div key={`${item}-${index}`} className="grid aspect-square place-items-center rounded-xl bg-white text-3xl shadow-sm">{item}</div>)}</div><p className="mt-4 text-sm font-bold text-ink/65">6 items ready to sell · 2 need restocking</p></section>;
}
