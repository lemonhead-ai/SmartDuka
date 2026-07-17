import Link from "next/link";

import { ShopManagement } from "@/components/game/ShopManagement";

export function ShopPreview() {
  return <div className="space-y-6"><section className="rounded-[24px] border border-line bg-surface p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted">Your duka</p><h2 className="text-xl font-semibold">Live shop inventory</h2></div><Link href="/shop" className="text-sm font-semibold text-ink">Open shop →</Link></div><p className="mt-4 text-sm text-muted">Keep shelves ready before the next customer arrives.</p></section><ShopManagement /></div>;
}
