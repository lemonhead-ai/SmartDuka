"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FireIcon, Award01Icon, Store01Icon, Target01Icon } from "hugeicons-react";

import { gameplayApi } from "@/features/gameplay/api";
import { getOfflineMeta } from "@/features/offline";

type Mission = { title: string; briefing: string; targetValue: number };

export default function AdventurePage() {
  const [mission, setMission] = useState<Mission | null>(null);
  
  const progressQuery = useQuery({ queryKey: ["player-progress"], queryFn: gameplayApi.progress });
  const progress = progressQuery.data;

  const accuracy = progress?.questions_attempted
    ? Math.round((progress.correct_answers / progress.questions_attempted) * 100)
    : 0;

  useEffect(() => { 
    void getOfflineMeta<Mission[]>("active-missions")
      .then((missions) => setMission(missions?.[0] ?? null))
      .catch((err) => console.error("Failed to load active missions", err)); 
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">Adventure</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Missions & Progress</h1>
          <p className="mt-2 text-muted">Complete missions and watch your shopkeeper skills grow.</p>
        </div>
      </header>

      {/* Active Mission Card */}
      <section className="rounded-[24px] border border-line bg-surface p-7 sm:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005]">
        {/* Soft subtle glow accent */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Active Mission</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">{mission?.title ?? "Preparing Your Next Adventure..."}</h2>
                <p className="mt-4 text-base leading-relaxed text-muted max-w-2xl">
                    {mission?.briefing ?? "Preparing your shopkeeper mission details. Keep playing to load new local math and word challenges!"}
                </p>
                <div className="mt-6 inline-flex items-center gap-3 rounded-[16px] bg-canvas px-5 py-3 font-semibold border border-line text-ink">
                    <Target01Icon size={20} className="text-accent stroke-[2.5]" />
                    Goal: serve {mission?.targetValue ?? 3} customers
                </div>
            </div>
            
            <div className="shrink-0 flex sm:flex-col gap-4">
                <Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-ink px-8 py-4 text-base font-bold text-white shadow-md shadow-ink/10 hover:bg-ink/95 hover:scale-[1.03] active:scale-100 transition-all duration-200">
                    Play Mission
                </Link>
            </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Accomplishments Stats */}
        <article className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-ink">Your Accomplishments</h2>
                    <p className="mt-1 text-sm text-muted">Level {progress?.current_learning_level ?? 1} learner</p>
                </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <ProfileStat icon={FireIcon} label="Streak" value={`${progress?.daily_streak_days ?? 0} days`} />
                <ProfileStat icon={Award01Icon} label="Accuracy" value={`${accuracy}%`} />
                <ProfileStat icon={Store01Icon} label="Coins" value={`${progress?.coins_earned ?? 0}`} />
                <ProfileStat icon={Award01Icon} label="Missions" value={`${progress?.missions_completed ?? 0}`} />
            </div>
        </article>

        {/* Learning Snapshot */}
        <article className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
            <h2 className="text-xl font-semibold text-ink">Learning snapshot</h2>
            <div className="mt-6 space-y-4">
                <SnapshotRow label="Questions answered" value={`${progress?.questions_attempted ?? 0}`} />
                <SnapshotRow label="Correct answers" value={`${progress?.correct_answers ?? 0}`} />
                <SnapshotRow label="Hints used" value={`${progress?.hints_used ?? 0}`} />
                <SnapshotRow label="XP earned" value={`${progress?.xp_earned ?? 0}`} />
            </div>
        </article>
      </div>
      
      {/* Adventure Map / Journey */}
      <section className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 transition-all duration-300 hover:shadow-md hover:scale-[1.005]">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-muted">Your adventure map</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Next stops on your journey</h2>
            </div>
            <span className="rounded-full bg-canvas px-3 py-2 text-xs font-semibold text-muted border border-line">
                Level {progress?.current_learning_level ?? 1}
            </span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <JourneyStep number="1" title="Open your duka" detail="Choose products and a name" done={Boolean(progress)} />
            <JourneyStep number="2" title="Serve customers" detail="Practice money skills" done={(progress?.questions_attempted ?? 0) > 0} />
            <JourneyStep number="3" title="Become a star seller" detail="Complete three missions" done={(progress?.missions_completed ?? 0) >= 3} />
        </div>
      </section>
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: typeof FireIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-canvas p-5 text-center border border-line transition-all duration-300 hover:scale-[1.04] hover:shadow-md hover:border-accent/25">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-white dark:bg-canvas shadow-sm text-accent border border-line/45">
            <Icon size={20} className="stroke-[2]" />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-1.5 text-xl font-black text-ink">{value}</p>
    </div>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-3 text-sm last:border-0 last:pb-0">
        <span className="text-muted">{label}</span>
        <strong className="text-ink">{value}</strong>
    </div>
  );
}

function JourneyStep({ number, title, detail, done }: { number: string; title: string; detail: string; done: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
      done 
        ? "border-accent/40 bg-accent/5 dark:border-accent-900/30" 
        : "border-line bg-canvas"
    }`}>
        <div className={`grid size-9 place-items-center rounded-full text-sm font-bold ${
          done 
            ? "bg-accent text-white" 
            : "bg-white dark:bg-canvas text-muted shadow-sm border border-line"
        }`}>
            {done ? "✓" : number}
        </div>
        <p className="mt-4 font-bold text-ink">{title}</p>
        <p className="mt-1 text-xs text-muted leading-relaxed">{detail}</p>
    </div>
  );
}
