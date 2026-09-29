"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FireIcon, Award01Icon, Store01Icon, Target01Icon } from "hugeicons-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { gameplayApi } from "@/features/gameplay/api";

export default function AdventurePage() {
  const progressQuery = useQuery({ queryKey: ["player-progress"], queryFn: gameplayApi.progress });
  const progress = progressQuery.data;

  const accuracy = progress?.questions_attempted
    ? Math.round((progress.correct_answers / progress.questions_attempted) * 100)
    : 0;

  return (
    <div className="space-y-1 sm:space-y-6 pb-6">
      {/* Top Header */}
      <DashboardHeader />

      {/* Active Mission Hero Card */}
      <section className="rounded-[36px] border border-line bg-surface p-6 sm:p-9 relative overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Soft subtle glow accent */}
        <div className="pointer-events-none absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-line px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent mb-3">
              <span>Active Mission</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink leading-tight">
              Keep your adventure going
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted max-w-xl">
              Serve customers, restock goods, and build your money math and literacy skills in every session.
            </p>
            <div className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-canvas px-4 py-2 text-xs font-bold border border-line text-ink">
              <Target01Icon size={16} className="text-accent stroke-[2.5]" />
              <span>Goal: Serve 3 customers without hints</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Link
              href="/shop?tab=counter"
              className="inline-flex items-center justify-center rounded-full bg-ink px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-ink/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Play Mission
            </Link>
          </div>
        </div>
      </section>


      <div className="grid gap-1 sm:gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Accomplishments Stats */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 transition-all duration-300 hover:shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div>
              <h2 className="text-xl font-bold text-ink tracking-tight">Your Accomplishments</h2>
              <p className="text-xs text-muted">Level {progress?.current_learning_level ?? 1} shopkeeper</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
            <ProfileStat icon={FireIcon} label="Streak" value={`${progress?.daily_streak_days ?? 0} days`} />
            <ProfileStat icon={Award01Icon} label="Accuracy" value={`${accuracy}%`} />
            <ProfileStat icon={Store01Icon} label="Coins" value={`${progress?.coins_earned ?? 0}`} />
            <ProfileStat icon={Award01Icon} label="Missions" value={`${progress?.missions_completed ?? 0}`} />
          </div>
        </article>

        {/* Learning Snapshot */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 transition-all duration-300 hover:shadow-sm flex flex-col justify-between">
          <div className="pb-4 border-b border-line">
            <h2 className="text-xl font-bold text-ink tracking-tight">Learning Snapshot</h2>
            <p className="text-xs text-muted">Live stats tracked across all checkouts</p>
          </div>
          <div className="mt-4 space-y-3.5 flex-1 flex flex-col justify-center">
            <SnapshotRow label="Questions answered" value={`${progress?.questions_attempted ?? 0}`} />
            <SnapshotRow label="Correct answers" value={`${progress?.correct_answers ?? 0}`} />
            <SnapshotRow label="Hints used" value={`${progress?.hints_used ?? 0}`} />
            <SnapshotRow label="XP earned" value={`${progress?.xp_earned ?? 0}`} />
          </div>
        </article>
      </div>

      {/* Adventure Map / Journey */}
      <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 transition-all duration-300 hover:shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-line">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Adventure Map</p>
            <h2 className="mt-0.5 text-xl font-bold text-ink tracking-tight">Next Stops on Your Journey</h2>
          </div>
          <span className="rounded-full bg-canvas px-3.5 py-1 text-xs font-bold text-muted border border-line">
            Level {progress?.current_learning_level ?? 1}
          </span>
        </div>
        <div className="mt-5 grid gap-2 sm:gap-4 sm:grid-cols-3">
          <JourneyStep number="1" title="Open your duka" detail="Choose products and store name" done={Boolean(progress)} />
          <JourneyStep number="2" title="Serve customers" detail="Practice quick mental money math" done={(progress?.questions_attempted ?? 0) > 0} />
          <JourneyStep number="3" title="Become a star seller" detail="Complete 3 daily store missions" done={(progress?.missions_completed ?? 0) >= 3} />
        </div>
      </section>
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: typeof FireIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-4 text-center border border-line transition-all duration-200 hover:scale-[1.02]">
      <div className="mx-auto grid size-10 place-items-center rounded-2xl bg-surface shadow-sm text-accent border border-line">
        <Icon size={18} color="currentColor" />
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5 text-xs sm:text-sm last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <strong className="text-ink font-bold">{value}</strong>
    </div>
  );
}

function JourneyStep({ number, title, detail, done }: { number: string; title: string; detail: string; done: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:scale-[1.01] ${
        done
          ? "border-accent bg-accent/5"
          : "border-line bg-canvas"
      }`}
    >
      <div
        className={`grid size-8 place-items-center rounded-full text-xs font-bold ${
          done
            ? "bg-accent text-white dark:text-black"
            : "bg-surface text-muted border border-line"
        }`}
      >
        {done ? "✓" : number}
      </div>
      <p className="mt-3 font-bold text-sm sm:text-base text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-muted leading-relaxed">{detail}</p>
    </div>
  );
}
