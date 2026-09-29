"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { gameplayApi } from "@/features/gameplay/api";

type BadgeItem = {
  id: string;
  name: string;
  description: string;
  tags: { label: string; accent?: boolean }[];
  reward: string;
  milestone: string;
  unlocked: boolean;
};

const defaultBadges: BadgeItem[] = [
  {
    id: "fast-cashier",
    name: "Master Cashier",
    description: "Calculates change correctly for 10 consecutive customer orders without hints.",
    tags: [
      { label: "Math Whiz", accent: true },
      { label: "Level 2" }
    ],
    reward: "+50 🪙",
    milestone: "10 correct checkouts",
    unlocked: true
  },
  {
    id: "streak-keeper",
    name: "Reliable Shopkeeper",
    description: "Keeps the duka open 5 days in a row and completes every morning inspection.",
    tags: [
      { label: "Consistency", accent: true },
      { label: "Streak" }
    ],
    reward: "+100 🪙",
    milestone: "5-day streak",
    unlocked: true
  },
  {
    id: "stock-guardian",
    name: "Stock Guardian",
    description: "Maintains optimal inventory of essentials so no customer leaves empty-handed.",
    tags: [
      { label: "Strategy" },
      { label: "Supply", accent: true }
    ],
    reward: "+75 🪙",
    milestone: "20 restocks completed",
    unlocked: false
  }
];

export function BadgesShowcaseCard() {
  const motivationQuery = useQuery({
    queryKey: ["motivation"],
    queryFn: gameplayApi.motivation
  });

  const apiBadges = motivationQuery.data?.badges;

  const badgesToDisplay: BadgeItem[] = defaultBadges.map((badge, idx) => {
    if (apiBadges && apiBadges[idx]) {
      return {
        ...badge,
        name: apiBadges[idx].name,
        description: apiBadges[idx].description,
        unlocked: true
      };
    }
    return badge;
  });

  return (
    <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <h3 className="text-xl font-bold tracking-tight text-ink">
          Your badges
        </h3>
        <span className="text-xs font-semibold text-accent">
          {badgesToDisplay.filter((b) => b.unlocked).length} Unlocked
        </span>
      </div>

      <div className="space-y-6">
        {badgesToDisplay.map((badge) => (
          <div
            key={badge.id}
            className="group relative pb-6 last:pb-0 border-b last:border-b-0 border-line transition-all"
          >
            {/* Tag Pills */}
            <div className="flex items-center gap-2">
              {badge.tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                    tag.accent
                      ? "bg-accent/10 border-line text-accent"
                      : "bg-canvas border-line text-muted"
                  }`}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Title and Reward */}
            <div className="mt-3 flex items-start justify-between gap-2">
              <h4 className="font-extrabold text-base sm:text-lg text-ink tracking-tight group-hover:text-accent transition-colors">
                {badge.name}
              </h4>
              <span className="font-black text-sm sm:text-base text-accent shrink-0">
                {badge.reward}
              </span>
            </div>

            {/* Description */}
            <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">
              {badge.description}
            </p>

            {/* Meta Row with milestone and action button */}
            <div className="mt-4 flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                {/* Micro avatar pile */}
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block size-6 rounded-full border border-line bg-canvas p-0.5 overflow-hidden">
                    <Image
                      src="/mascots/milo.PNG"
                      alt="Milo"
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="inline-block size-6 rounded-full border border-line bg-canvas p-0.5 overflow-hidden">
                    <Image
                      src="/illustrations/mario.PNG"
                      alt="Mario"
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-muted">
                  {badge.milestone}
                </span>
              </div>

              <button
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                  badge.unlocked
                    ? "bg-ink text-surface hover:scale-105"
                    : "bg-canvas border border-line text-muted"
                }`}
              >
                {badge.unlocked ? "Equip badge" : "Locked"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
