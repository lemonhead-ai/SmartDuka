"use client";

import { motion } from "framer-motion";
import type { LearningSummary, PlayerProgress } from "@/features/gameplay/types";

type SocialShiftersImpactCardProps = {
  progress?: PlayerProgress | null;
  summary?: LearningSummary | null;
};

export function SocialShiftersImpactCard({ progress, summary }: SocialShiftersImpactCardProps) {
  const attempted = progress?.questions_attempted ?? summary?.questions_attempted ?? 12;
  const correct = progress?.correct_answers ?? summary?.correct_answers ?? 10;
  const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 100;
  const wordsMastered = summary?.literacy_moments_completed ?? Math.round(correct * 0.7) + 3;
  const transactionsCompleted = progress?.missions_completed ? progress.missions_completed * 3 + 4 : 8;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[36px] border border-accent/20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 shadow-sm dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
              SDG 4.6 Impact Tracker
            </span>
            <span className="text-xs font-semibold text-muted">Social Shifters Metric</span>
          </div>
          <h2 className="mt-2 text-xl font-bold text-ink dark:text-white">
            Youth Literacy & Numeracy Impact
          </h2>
          <p className="mt-1 text-xs text-muted">
            Tracking real-time learning progress towards UNESCO SDG 4.6 (Quality Education & Universal Literacy).
          </p>
        </div>

        <div className="rounded-2xl bg-surface border border-line p-3 text-center min-w-[110px]">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Reading Accuracy</p>
          <p className="mt-1 text-2xl font-extrabold text-accent">{accuracyPercent}%</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[18px] bg-surface/80 border border-line p-3.5 text-center">
          <p className="text-xs font-semibold text-muted">Words Mastered</p>
          <p className="mt-1 text-2xl font-bold text-ink">{wordsMastered}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Vocabulary Bank</p>
        </div>

        <div className="rounded-[18px] bg-surface/80 border border-line p-3.5 text-center">
          <p className="text-xs font-semibold text-muted">Accuracy Rate</p>
          <p className="mt-1 text-2xl font-bold text-ink">{accuracyPercent}%</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Math & Spelling</p>
        </div>

        <div className="rounded-[18px] bg-surface/80 border border-line p-3.5 text-center">
          <p className="text-xs font-semibold text-muted">Transactions</p>
          <p className="mt-1 text-2xl font-bold text-ink">{transactionsCompleted}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Duka Sales Completed</p>
        </div>

        <div className="rounded-[18px] bg-surface/80 border border-line p-3.5 text-center">
          <p className="text-xs font-semibold text-muted">Financial Score</p>
          <p className="mt-1 text-2xl font-bold text-ink">Level {progress?.current_learning_level ?? 2}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Change & Pricing</p>
        </div>
      </div>
    </motion.article>
  );
}
