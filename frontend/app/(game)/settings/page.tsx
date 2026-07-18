"use client";

import Link from "next/link";
import { usePreferences, type ThemePreference } from "@/components/theme/PreferencesProvider";

export default function SettingsPage() {
  const { preferences, setPreference } = usePreferences();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Preferences</p>
        <h1 className="mt-2 text-3xl font-semibold">Make learning comfortable</h1>
        <p className="mt-2 text-muted">Choose how Smart Duka feels and sounds while you play.</p>
      </header>

      <section className="rounded-[24px] border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold">Appearance</h2>
        <p className="mt-2 text-sm text-muted">Choose your colour mode. System follows your device automatically.</p>
        <div className="mt-6 grid grid-cols-3 gap-4" role="radiogroup" aria-label="Colour mode">
          <ThemeCard 
            theme="system" 
            active={preferences.theme === "system"} 
            onClick={() => setPreference("theme", "system")} 
          />
          <ThemeCard 
            theme="light" 
            active={preferences.theme === "light"} 
            onClick={() => setPreference("theme", "light")} 
          />
          <ThemeCard 
            theme="dark" 
            active={preferences.theme === "dark"} 
            onClick={() => setPreference("theme", "dark")} 
          />
        </div>
      </section>

      <section className="rounded-[24px] border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold">Accessibility</h2>
        <div className="mt-5 space-y-3">
          <PreferenceToggle 
            label="Larger text" 
            detail="Make words easier to read" 
            value={preferences.largeText} 
            onChange={() => setPreference("largeText", !preferences.largeText)} 
          />
          <PreferenceToggle 
            label="Reduce motion" 
            detail="Use calmer animations" 
            value={preferences.reducedMotion} 
            onChange={() => setPreference("reducedMotion", !preferences.reducedMotion)} 
          />
          <PreferenceToggle 
            label="Sound effects" 
            detail="Hear friendly feedback during play" 
            value={preferences.sound} 
            onChange={() => setPreference("sound", !preferences.sound)} 
          />
        </div>
      </section>

      <section className="rounded-[24px] border border-line bg-surface p-6">
        <h2 className="text-xl font-semibold">Language</h2>
        <p className="mt-2 text-sm text-muted">English is active for this learning adventure.</p>
        <span className="mt-4 inline-flex rounded-full bg-canvas px-3 py-2 text-sm font-semibold">English</span>
      </section>

      <Link href="/profile" className="inline-flex rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Back to profile</Link>
    </div>
  );
}

function ThemeCard({ theme, active, onClick }: { theme: ThemePreference; active: boolean; onClick: () => void }) {
  return (
    <button 
      type="button" 
      role="radio" 
      aria-checked={active} 
      onClick={onClick} 
      className={`group flex flex-col items-center gap-3 transition-transform hover:scale-[1.02] active:scale-100 ${
        active ? "opacity-100" : "opacity-60 hover:opacity-100"
      }`}
    >
      <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 p-1 transition-colors ${
        active ? "border-accent ring-4 ring-accent/10" : "border-line"
      }`}>
        <div className="h-full w-full rounded-xl overflow-hidden shadow-sm flex flex-col relative bg-white">
          {/* Mockup header */}
          <div className="h-4 w-full bg-[#E5E5EA]" />
          
          {/* Main content area split for system theme, full for others */}
          <div className="flex-1 flex w-full relative">
            {theme === "system" && (
              <>
                <div className="w-1/2 h-full bg-[#F2F2F7] flex flex-col p-2 gap-2 border-r border-[#E5E5EA]">
                  <div className="w-2/3 h-2 rounded bg-[#D1D1D6]" />
                  <div className="w-full h-8 rounded-lg bg-white shadow-sm" />
                  <div className="w-full h-8 rounded-lg bg-white shadow-sm" />
                </div>
                <div className="w-1/2 h-full bg-[#1C1C1E] flex flex-col p-2 gap-2">
                  <div className="w-2/3 h-2 rounded bg-[#3A3A3C]" />
                  <div className="w-full h-8 rounded-lg bg-[#2C2C2E]" />
                  <div className="w-full h-8 rounded-lg bg-[#2C2C2E]" />
                </div>
              </>
            )}
            
            {theme === "light" && (
              <div className="w-full h-full bg-[#F2F2F7] flex flex-col p-2 gap-2">
                <div className="w-1/2 h-2 rounded bg-[#D1D1D6] mx-auto" />
                <div className="w-full h-8 rounded-lg bg-white shadow-sm" />
                <div className="w-full h-8 rounded-lg bg-white shadow-sm" />
                <div className="w-full h-8 rounded-lg bg-white shadow-sm" />
              </div>
            )}
            
            {theme === "dark" && (
              <div className="w-full h-full bg-[#1C1C1E] flex flex-col p-2 gap-2">
                <div className="w-1/2 h-2 rounded bg-[#3A3A3C] mx-auto" />
                <div className="w-full h-8 rounded-lg bg-[#2C2C2E]" />
                <div className="w-full h-8 rounded-lg bg-[#2C2C2E]" />
                <div className="w-full h-8 rounded-lg bg-[#2C2C2E]" />
              </div>
            )}
          </div>
        </div>
      </div>
      <span className="text-sm font-medium capitalize">{theme}</span>
    </button>
  );
}

function PreferenceToggle({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-canvas p-4 transition-colors hover:bg-line">
      <span>
        <strong className="block">{label}</strong>
        <span className="mt-1 block text-sm text-muted">{detail}</span>
      </span>
      <input type="checkbox" checked={value} onChange={onChange} className="size-5 accent-accent" />
    </label>
  );
}
