"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getOfflineMeta } from "@/features/offline";

type Mission = { title: string; briefing: string; targetValue: number };

export default function AdventurePage() {
  const [mission, setMission] = useState<Mission | null>(null);

  useEffect(() => { void getOfflineMeta<Mission[]>("active-missions").then((missions) => setMission(missions?.[0] ?? null)); }, []);

  return <section className="max-w-2xl rounded-[24px] border border-line bg-surface p-7"><p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Today’s mission</p><h1 className="mt-3 text-3xl font-semibold">{mission?.title ?? "Your next adventure is loading"}</h1><p className="mt-4 text-lg leading-relaxed text-muted">{mission?.briefing ?? "Connect once to receive a locally generated duka mission, then keep playing offline."}</p><p className="mt-6 rounded-[16px] bg-canvas p-4 font-medium">Goal: serve {mission?.targetValue ?? 3} customers</p><Link href="/shop" className="mt-6 inline-flex rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Go to my shop</Link></section>;
}
