"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getOfflineMeta } from "@/features/offline";

type Mission = { title: string; briefing: string; targetValue: number };

export function MissionCard() {
  const [mission, setMission] = useState<Mission | null>(null);
  useEffect(() => { void getOfflineMeta<Mission[]>("active-missions").then((missions) => setMission(missions?.[0] ?? null)); }, []);
  return <section className="rounded-[24px] border border-line bg-surface p-7"><p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Today’s mission</p><h2 className="mt-3 max-w-lg text-2xl font-semibold leading-tight">{mission?.title ?? "Your duka adventure is loading"}</h2><p className="mt-3 max-w-xl text-muted">{mission?.briefing ?? "Connect once to receive a mission, then continue learning offline."}</p><div className="mt-6"><Link href="/shop" className="inline-flex rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Open shop</Link></div></section>;
}
