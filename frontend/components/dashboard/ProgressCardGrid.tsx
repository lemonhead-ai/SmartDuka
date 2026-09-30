"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Store01Icon,
  FireIcon,
  Award02Icon,
  ArrowRight01Icon
} from "hugeicons-react";
import { gameplayApi } from "@/features/gameplay/api";

export function ProgressCardGrid() {
  const progressQuery = useQuery({
    queryKey: ["player-progress"],
    queryFn: gameplayApi.progress
  });

  const progress = progressQuery.data;

  // Accuracy
  const accuracy = progress?.questions_attempted
    ? Math.round((progress.correct_answers / progress.questions_attempted) * 100)
    : 85;

  const streak = progress?.daily_streak_days ?? 1;
  const level = progress?.current_learning_level ?? 1;
  const xp = progress?.xp_earned ?? 205;

  return (
    <section className="space-y-3">
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
        Your progress
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Daily Streak (Duolingo-style fire icon + streak number container) */}
        <Link
          href="/adventure"
          title="View Quests & Keep Streak"
          className="group rounded-[32px] border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            {/* Duolingo-style fire pill container with the streak number inside */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500">
              <FireIcon size={20} color="currentColor" className="shrink-0" />
              <span className="text-sm font-black tracking-tight">{streak}</span>
            </div>

            <div className="grid size-8 place-items-center rounded-full bg-canvas text-muted group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
              <ArrowRight01Icon size={16} color="currentColor" />
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-extrabold text-base sm:text-lg text-ink group-hover:text-amber-500 transition-colors tracking-tight leading-snug">
              Daily Streak
            </h4>
            <p className="text-xs font-medium text-muted mt-1">
              Tap to play today&apos;s quests
            </p>
          </div>
        </Link>

        {/* Card 2: Shopkeeper Level (Minimalist, showing XP directly, no arbitrary progress line) */}
        <Link
          href="/profile"
          title="View Profile & Level Details"
          className="group rounded-[32px] border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-accent">
              <Store01Icon size={20} color="currentColor" />
            </div>

            <div className="grid size-8 place-items-center rounded-full bg-canvas text-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors">
              <ArrowRight01Icon size={16} color="currentColor" />
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-extrabold text-base sm:text-lg text-ink group-hover:text-accent transition-colors tracking-tight leading-snug">
              Shopkeeper Level {level}
            </h4>
            <p className="text-xs font-black text-accent mt-1">
              {xp} XP
            </p>
          </div>
        </Link>

        {/* Card 3: Basic Math Accuracy (Renamed, minimalist percentage, no progress line) */}
        <Link
          href="/shop?tab=counter"
          title="Practice Math at Counter"
          className="group rounded-[32px] border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between min-h-[160px] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-sky-500">
              <Award02Icon size={20} color="currentColor" />
            </div>

            <div className="grid size-8 place-items-center rounded-full bg-canvas text-muted group-hover:text-sky-500 group-hover:bg-sky-500/10 transition-colors">
              <ArrowRight01Icon size={16} color="currentColor" />
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-extrabold text-base sm:text-lg text-ink group-hover:text-sky-500 transition-colors tracking-tight leading-snug">
              Basic Math Accuracy
            </h4>
            <p className="text-xs font-black text-sky-500 mt-1">
              {accuracy}% accuracy
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}
