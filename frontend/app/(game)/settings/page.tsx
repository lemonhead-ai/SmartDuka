"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Preferences = { largeText: boolean; reducedMotion: boolean; sound: boolean };

const defaultPreferences: Preferences = { largeText: false, reducedMotion: false, sound: true };

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  useEffect(() => {
    const saved = window.localStorage.getItem("smart-duka-preferences");
    if (saved) {
      try { setPreferences({ ...defaultPreferences, ...JSON.parse(saved) as Partial<Preferences> }); } catch { window.localStorage.removeItem("smart-duka-preferences"); }
    }
  }, []);
  const update = (key: keyof Preferences) => setPreferences((current) => {
    const next = { ...current, [key]: !current[key] };
    window.localStorage.setItem("smart-duka-preferences", JSON.stringify(next));
    return next;
  });
  return <div className="mx-auto max-w-2xl space-y-6"><header><p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Preferences</p><h1 className="mt-2 text-3xl font-semibold">Make learning comfortable</h1><p className="mt-2 text-muted">Choose how Smart Duka feels and sounds while you play.</p></header><section className="rounded-[24px] border border-line bg-surface p-6"><h2 className="text-xl font-semibold">Accessibility</h2><div className="mt-5 space-y-3"><PreferenceToggle label="Larger text" detail="Make words easier to read" value={preferences.largeText} onChange={() => update("largeText")} /><PreferenceToggle label="Reduce motion" detail="Use calmer animations" value={preferences.reducedMotion} onChange={() => update("reducedMotion")} /><PreferenceToggle label="Sound effects" detail="Hear friendly feedback during play" value={preferences.sound} onChange={() => update("sound")} /></div></section><section className="rounded-[24px] border border-line bg-surface p-6"><h2 className="text-xl font-semibold">Language</h2><p className="mt-2 text-sm text-muted">English is active for this learning adventure.</p><span className="mt-4 inline-flex rounded-full bg-canvas px-3 py-2 text-sm font-semibold">English</span></section><Link href="/profile" className="inline-flex rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Back to profile</Link></div>;
}

function PreferenceToggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: () => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-canvas p-4"><span><strong className="block">{label}</strong><span className="mt-1 block text-sm text-muted">{detail}</span></span><input type="checkbox" checked={value} onChange={onChange} className="size-5 accent-black" /></label>;
}
