"use client";

import Link from "next/link";

import type { Motivation } from "@/features/gameplay/types";

export function MissionCard({ motivation }: { motivation?: Motivation }) {
  const mission = motivation?.daily_mission;
  const progress = mission ? Math.round((mission.progress / mission.target) * 100) : 0;

  return (
    <section className="rounded-[24px] border border-line bg-surface p-7 sm:p-8 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.005]">
      {/* Subtle glow background */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex-1 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Today’s mission</p>
          <h2 className="text-2xl font-black leading-tight text-ink">
            {mission?.title ?? "Your duka adventure is loading"}
          </h2>
          <p className="text-sm text-muted leading-relaxed max-w-xl">
            {mission?.description ?? "Your next learning goal is being prepared. Complete checkout sessions to progress!"}
          </p>
          
          {mission && (
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs font-semibold text-muted">
                <span>{mission.progress} of {mission.target} complete</span>
                <span>{mission.completed ? "Complete!" : `${progress}%`}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-canvas border border-line/30">
                <div className="h-full rounded-full bg-[#30D158] transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Right side: Start Mission CTA */}
        <div className="shrink-0 flex items-center">
          <Link 
            href="/shop" 
            className="inline-flex items-center justify-center rounded-full bg-ink px-8 py-4 text-base font-bold text-white shadow-md shadow-ink/10 hover:bg-ink/95 hover:scale-[1.03] active:scale-100 transition-all duration-200"
          >
            Start Mission
          </Link>
        </div>
      </div>
    </section>
  );
}
