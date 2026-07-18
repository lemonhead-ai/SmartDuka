"use client";

import Link from "next/link";

import type { Motivation } from "@/features/gameplay/types";

export function MissionCard({ motivation }: { motivation?: Motivation }) {
  const mission = motivation?.daily_mission;
  const progress = mission ? Math.round((mission.progress / mission.target) * 100) : 0;

  return (
    <section className="rounded-[24px] border border-line bg-surface p-7">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Today’s mission</p>
      <h2 className="mt-3 max-w-lg text-2xl font-semibold leading-tight">
        {mission?.title ?? "Your duka adventure is loading"}
      </h2>
      <p className="mt-3 max-w-xl text-muted">
        {mission?.description ?? "Your next learning goal is being prepared."}
      </p>
      {mission && (
        <div className="mt-5 max-w-xl">
          <div className="flex items-center justify-between text-sm font-medium text-muted">
            <span>{mission.progress} of {mission.target} complete</span>
            <span>{mission.completed ? "Complete!" : `${progress}%`}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className="mt-6">
        <Link href="/shop" className="inline-flex rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Open shop</Link>
      </div>
    </section>
  );
}
