import { MissionCard } from "@/components/game/MissionCard";
import { ShopPreview } from "@/components/game/ShopPreview";
import { StatCard } from "@/components/cards/StatCard";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function DashboardPage() {
  return <div className="space-y-7"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-bold text-clay">Jambo, Amina! 👋</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Ready to run your duka?</h1><p className="mt-2 text-ink/65">You&apos;re doing brilliantly. Let&apos;s learn something new today.</p></div><div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"><span className="text-2xl">🪙</span><div><p className="text-xs font-bold text-ink/55">DUKA COINS</p><p className="font-black">1,250</p></div></div></header><section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon="🔥" label="Current streak" value="7 days" detail="Your longest is 12 days!" tone="muted" />
        <StatCard icon="✦" label="Level" value="Shopkeeper 4" detail="350 points to Level 5" tone="muted" />
        <StatCard icon="🏅" label="Class rank" value="#3" detail="Up 2 places this week" tone="muted" />
      </section><MissionCard /><section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><ShopPreview /><article className="rounded-[2rem] bg-white p-6 shadow-card"><p className="text-sm font-bold text-ink/60">Your learning journey</p><h2 className="mt-1 text-xl font-black">This week&apos;s progress</h2><div className="mt-6 space-y-5">          <ProgressBar label="Counting & change" value={78} tone="ink" />
          <ProgressBar label="Reading & words" value={62} tone="ink" />
          <ProgressBar label="Smart money choices" value={45} tone="ink" />
        </div>
        <p className="mt-6 rounded-2xl bg-line p-4 text-sm leading-relaxed text-ink/80"><span className="font-black">Mwalimu says:</span> You&apos;re getting quick at counting change. Next, let&apos;s practise reading shopping lists!</p></article></section></div>;
}
