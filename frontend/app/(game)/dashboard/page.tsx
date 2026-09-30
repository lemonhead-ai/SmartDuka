"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { HeroBannerCard } from "@/components/dashboard/HeroBannerCard";
import { ProgressCardGrid } from "@/components/dashboard/ProgressCardGrid";
import { GuideCardGrid } from "@/components/dashboard/GuideCardGrid";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { BadgesShowcaseCard } from "@/components/dashboard/BadgesShowcaseCard";
import { MiloAlert } from "@/components/ui/MiloAlert";
import { gameplayApi } from "@/features/gameplay/api";
import { authApi } from "@/features/auth/api";

export default function DashboardPage() {
  const progressQuery = useQuery({
    queryKey: ["player-progress"],
    queryFn: gameplayApi.progress
  });
  const motivationQuery = useQuery({
    queryKey: ["motivation"],
    queryFn: gameplayApi.motivation
  });
  const accountQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    retry: false
  });

  const rawName = progressQuery.data?.student_name || accountQuery.data?.shopkeeper.display_name || "Martin";
  const childName = rawName.trim().split(" ")[0] || "Martin";

  return (
    <div className="space-y-2 sm:space-y-6 pb-6">
      {/* Top Header: Search pill, Duka Coins wallet balance, Notification bell, Profile avatar */}
      <DashboardHeader />

      {/* Mobile-only Salutation: Between Search and First Card */}
      <div className="sm:hidden text-center py-2 px-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">Welcome back</p>
        <h1 className="text-2xl font-black text-ink tracking-tight flex items-center justify-center gap-1.5 mt-0.5">
          <span>Hello {childName}!</span>
          <span className="inline-block animate-bounce">👋</span>
        </h1>
      </div>

      {/* Error alert fallback if queries fail */}
      {(progressQuery.isError || motivationQuery.isError) && (
        <MiloAlert
          kind="warning"
          message="Some live progress details could not be synced. You can still play and run your shop."
        />
      )}

      {/* Main Grid: Left Column (Hero, 3 Progress Cards, 2 Guides) & Right Column (Calendar, Badges) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-1 sm:gap-6 items-start">
        {/* Left / Center Main Stream */}
        <div className="space-y-1 sm:space-y-6">
          {/* Top Big Hero Card */}
          <HeroBannerCard />

          {/* Middle: 3 Progress Cards (Lavender, Warm Honey, Soft Rose) */}
          <ProgressCardGrid />

          {/* Bottom: 2 Wide Guide Cards */}
          <GuideCardGrid />
        </div>

        {/* Right Stream: Calendar & Badges */}
        <div className="space-y-1 sm:space-y-6">
          {/* Calendar Widget with 7-Day Pill Strip */}
          <DashboardCalendar />

          {/* 'Your Badges' Showcase Card (Replaces upcoming courses) */}
          <BadgesShowcaseCard />
        </div>
      </div>
    </div>
  );
}
