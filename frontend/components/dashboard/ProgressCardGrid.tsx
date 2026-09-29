"use client";

import { useQuery } from "@tanstack/react-query";
import {
  MoreHorizontalIcon,
  Store01Icon,
  FireIcon,
  Award02Icon
} from "hugeicons-react";
import { gameplayApi } from "@/features/gameplay/api";

export function ProgressCardGrid() {
  const progressQuery = useQuery({
    queryKey: ["player-progress"],
    queryFn: gameplayApi.progress
  });
  const motivationQuery = useQuery({
    queryKey: ["motivation"],
    queryFn: gameplayApi.motivation
  });

  const progress = progressQuery.data;
  const motivation = motivationQuery.data;

  // Accuracy
  const accuracy = progress?.questions_attempted
    ? Math.round((progress.correct_answers / progress.questions_attempted) * 100)
    : 85;

  // Level progress
  const levelProgress = progress?.xp_earned ? Math.min(progress.xp_earned % 100, 100) : 65;

  // Mission / Streak progress
  const missionProgress = motivation?.daily_mission
    ? Math.min(Math.round((motivation.daily_mission.progress / motivation.daily_mission.target) * 100), 100)
    : 50;

  return (
    <section className="space-y-3">
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
        Your progress
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Shopkeeper Level Mastery */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between min-h-[190px] shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-start justify-between">
            <div className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-accent">
              <Store01Icon size={20} color="currentColor" />
            </div>
            <button
              type="button"
              aria-label="More options"
              className="grid size-8 place-items-center rounded-full hover:bg-canvas text-muted hover:text-ink transition-colors"
            >
              <MoreHorizontalIcon size={18} color="currentColor" />
            </button>
          </div>

          <div className="mt-4">
            <h4 className="font-extrabold text-base sm:text-lg text-ink tracking-tight leading-snug">
              Shopkeeper Level {progress?.current_learning_level ?? 1}
            </h4>
            <p className="text-xs font-medium text-muted mt-0.5">
              {progress?.xp_earned ?? 0} Total XP Earned
            </p>
          </div>

          <div className="mt-5 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-canvas overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted">Progress</span>
              <span className="font-bold text-ink">{levelProgress}%</span>
            </div>
          </div>
        </article>

        {/* Card 2: Daily Streak & Missions */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between min-h-[190px] shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-start justify-between">
            <div className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-amber-500">
              <FireIcon size={20} color="currentColor" />
            </div>
            <button
              type="button"
              aria-label="More options"
              className="grid size-8 place-items-center rounded-full hover:bg-canvas text-muted hover:text-ink transition-colors"
            >
              <MoreHorizontalIcon size={18} color="currentColor" />
            </button>
          </div>

          <div className="mt-4">
            <h4 className="font-extrabold text-base sm:text-lg text-ink tracking-tight leading-snug">
              Daily Mission &amp; Streak
            </h4>
            <p className="text-xs font-medium text-muted mt-0.5">
              {progress?.daily_streak_days ?? 1}-Day Active Streak
            </p>
          </div>

          <div className="mt-5 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-canvas overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${missionProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted">Progress</span>
              <span className="font-bold text-ink">{missionProgress}%</span>
            </div>
          </div>
        </article>

        {/* Card 3: Math & Change Accuracy */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-6 flex flex-col justify-between min-h-[190px] shadow-sm hover:scale-[1.01] transition-all">
          <div className="flex items-start justify-between">
            <div className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-sky-500">
              <Award02Icon size={20} color="currentColor" />
            </div>
            <button
              type="button"
              aria-label="More options"
              className="grid size-8 place-items-center rounded-full hover:bg-canvas text-muted hover:text-ink transition-colors"
            >
              <MoreHorizontalIcon size={18} color="currentColor" />
            </button>
          </div>

          <div className="mt-4">
            <h4 className="font-extrabold text-base sm:text-lg text-ink tracking-tight leading-snug">
              Math &amp; Change Accuracy
            </h4>
            <p className="text-xs font-medium text-muted mt-0.5">
              {progress?.correct_answers ?? 0} Correct calculations
            </p>
          </div>

          <div className="mt-5 space-y-1.5">
            <div className="h-2 w-full rounded-full bg-canvas overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted">Progress</span>
              <span className="font-bold text-ink">{accuracy}%</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
