"use client";

import { useQuery } from "@tanstack/react-query";
import { Award02Icon, FireIcon, Store01Icon } from "hugeicons-react";

import { StatCard } from "@/components/cards/StatCard";
import { MissionCard } from "@/components/game/MissionCard";
import { ShopLedger } from "@/components/game/ShopLedger";
import { ShopPreview } from "@/components/game/ShopPreview";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { gameplayApi } from "@/features/gameplay/api";

export default function DashboardPage() {
  const progressQuery = useQuery({
    queryKey: ["player-progress"],
    queryFn: gameplayApi.progress,
  });
  const ledgerQuery = useQuery({
    queryKey: ["shop-ledger"],
    queryFn: gameplayApi.ledger,
  });
  const progress = progressQuery.data;
  const accuracy = progress?.questions_attempted
    ? Math.round((progress.correct_answers / progress.questions_attempted) * 100)
    : 0;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-muted">Jambo, {progress?.student_name ?? "shopkeeper"}!</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Ready to run your duka?</h1>
          <p className="mt-2 text-muted">Your live progress appears here as you serve customers.</p>
        </div>
        <div className="rounded-[20px] border border-line bg-surface px-4 py-3">
          <p className="text-xs font-medium text-muted">DUKA COINS</p>
          <p className="font-semibold">{progress?.coins_earned ?? 0}</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={FireIcon} label="Current streak" value={`${progress?.daily_streak_days ?? 0} days`} detail="Daily streak tracking is ready." tone="muted" />
        <StatCard icon={Store01Icon} label="Learning level" value={`Level ${progress?.current_learning_level ?? 1}`} detail={`${progress?.xp_earned ?? 0} XP earned`} tone="muted" />
        <StatCard icon={Award02Icon} label="Correct answers" value={`${progress?.correct_answers ?? 0}`} detail={`${accuracy}% accuracy`} tone="muted" />
      </section>

      <MissionCard />

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <ShopPreview />
        <article className="rounded-[24px] border border-line bg-surface p-6">
          <p className="text-sm font-medium text-muted">Your learning journey</p>
          <h2 className="mt-1 text-xl font-semibold">Live progress</h2>
          <div className="mt-6 space-y-5">
            <ProgressBar label="Answer accuracy" value={accuracy} tone="leaf" />
            <ProgressBar label="Mission progress" value={Math.min((progress?.missions_completed ?? 0) * 100, 100)} tone="sky" />
            <ProgressBar label="Hints used" value={Math.min((progress?.hints_used ?? 0) * 10, 100)} tone="mango" />
          </div>
          <p className="mt-6 rounded-[20px] bg-canvas p-4 text-sm leading-relaxed text-muted">
            {progressQuery.isLoading ? "Loading your progress…" : "Each attempt helps your shopkeeper skills grow."}
          </p>
        </article>
      </section>

      <ShopLedger ledger={ledgerQuery.data} isLoading={ledgerQuery.isLoading} />
    </div>
  );
}
