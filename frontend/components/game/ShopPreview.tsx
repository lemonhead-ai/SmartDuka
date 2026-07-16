import Link from "next/link";

export function ShopPreview() {
  return <section className="rounded-[24px] border border-line bg-surface p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted">Your duka</p><h2 className="text-xl font-semibold">Live shop inventory</h2></div><Link href="/shop" className="text-sm font-semibold text-ink">Open shop →</Link></div><div className="mt-6 grid grid-cols-3 gap-3 rounded-[20px] bg-canvas p-4">{["Fruits", "Drinks", "Snacks", "Supplies", "Household", "Vegetables"].map((category) => <div key={category} className="grid aspect-square place-items-center rounded-[16px] border border-line bg-surface px-2 text-center text-xs font-medium">{category}</div>)}</div><p className="mt-4 text-sm text-muted">Stock and prices load from the active shop session.</p></section>;
}
