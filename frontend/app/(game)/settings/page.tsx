"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  PaintBoardIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
  TextFontIcon,
  Motion01Icon,
  GlobalIcon,
  CheckmarkCircle02Icon,
  SparklesIcon,
  ArrowLeft01Icon,
} from "hugeicons-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { usePreferences, type ThemePreference } from "@/components/theme/PreferencesProvider";

export default function SettingsPage() {
  const { preferences, setPreference } = usePreferences();
  const [testSoundPlaying, setTestSoundPlaying] = useState(false);

  // Play a cheerful, kid-friendly chime via Web Audio API
  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      setTestSoundPlaying(true);
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A5 (880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

      setTimeout(() => setTestSoundPlaying(false), 600);
    } catch {
      setTestSoundPlaying(false);
    }
  };

  const handleResetDefaults = () => {
    setPreference("theme", "system");
    setPreference("largeText", false);
    setPreference("reducedMotion", false);
    setPreference("sound", true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Header with wallet, search, notifications, profile */}
      <DashboardHeader />

      {/* Hero Banner Card */}
      <section className="rounded-[36px] border border-line bg-surface p-6 sm:p-8 md:p-9 relative overflow-hidden shadow-sm transition-all">
        {/* Soft theme glow */}
        <div className="pointer-events-none absolute right-0 top-0 size-72 bg-accent/5 rounded-full blur-3xl -z-10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-line px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              <SparklesIcon size={14} />
              <span>Store &amp; Gameplay Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink tracking-tight leading-tight">
              Make Learning Comfortable
            </h1>
            <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed">
              Personalize colors, adjust sound effects, and make reading text comfortable so you can run your duka with ease.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <div className="relative size-28 sm:size-32 rounded-3xl bg-canvas border border-line p-3 flex items-center justify-center shadow-inner">
              <Image
                src="/mascots/milo.PNG"
                alt="Milo Mascot"
                width={100}
                height={100}
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
              <span className="absolute -bottom-2 -right-2 size-7 rounded-full bg-accent text-white dark:text-black font-black grid place-items-center text-xs shadow-sm">
                ⚙️
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Settings Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Card 1: Theme & Appearance */}
        <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="grid size-10 place-items-center rounded-2xl bg-canvas border border-line text-accent">
                <PaintBoardIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Appearance</h2>
                <p className="text-xs text-muted">Pick daytime sunshine, cozy night mode, or follow your device.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3.5" role="radiogroup" aria-label="Color mode">
              <ThemeChoiceCard
                title="System"
                description="Auto"
                theme="system"
                active={preferences.theme === "system"}
                onClick={() => setPreference("theme", "system")}
              />
              <ThemeChoiceCard
                title="Light"
                description="Day"
                theme="light"
                active={preferences.theme === "light"}
                onClick={() => setPreference("theme", "light")}
              />
              <ThemeChoiceCard
                title="Dark"
                description="Night"
                theme="dark"
                active={preferences.theme === "dark"}
                onClick={() => setPreference("theme", "dark")}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-canvas p-3.5 flex items-center justify-between text-xs text-muted">
            <span>Current display theme:</span>
            <span className="font-bold text-ink capitalize bg-surface px-2.5 py-1 rounded-full border border-line">
              {preferences.theme} Mode
            </span>
          </div>
        </section>

        {/* Card 2: Audio & Cheerful Feedback */}
        <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="grid size-10 place-items-center rounded-2xl bg-canvas border border-line text-accent">
                {preferences.sound ? <VolumeHighIcon size={20} /> : <VolumeMute01Icon size={20} />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Audio &amp; Sounds</h2>
                <p className="text-xs text-muted">Auditory feedback on customer sales and answers.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ModernToggleRow
                icon={preferences.sound ? VolumeHighIcon : VolumeMute01Icon}
                label="Sound effects"
                detail="Play cheerful chimes on correct change, sales, and level ups."
                checked={preferences.sound}
                onChange={() => setPreference("sound", !preferences.sound)}
              />

              <div className="rounded-2xl border border-line bg-canvas p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">Test audio tone</p>
                  <p className="text-[11px] text-muted">Listen to the cashier success chime</p>
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={playTestChime}
                  disabled={testSoundPlaying}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold text-ink hover:border-accent hover:text-accent transition-colors shadow-sm"
                >
                  <span>{testSoundPlaying ? "🔔 Playing..." : "🔊 Play Chime"}</span>
                </motion.button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            Sound effects help learners get instant confirmation when a math calculation is correct.
          </p>
        </section>

        {/* Card 3: Reading & Accessibility */}
        <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-line">
            <div className="grid size-10 place-items-center rounded-2xl bg-canvas border border-line text-accent">
              <TextFontIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Accessibility</h2>
              <p className="text-xs text-muted">Tailor visual comfort and motion speed.</p>
            </div>
          </div>

          <div className="space-y-3">
            <ModernToggleRow
              icon={TextFontIcon}
              label="Larger reading text"
              detail="Makes product names, price tags, and shelf instructions easier to read."
              checked={preferences.largeText}
              onChange={() => setPreference("largeText", !preferences.largeText)}
            />

            <ModernToggleRow
              icon={Motion01Icon}
              label="Reduce motion"
              detail="Use gentle, calmer transitions instead of energetic bouncing."
              checked={preferences.reducedMotion}
              onChange={() => setPreference("reducedMotion", !preferences.reducedMotion)}
            />
          </div>
        </section>

        {/* Card 4: Language & Curriculum Info */}
        <section className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-line">
              <div className="grid size-10 place-items-center rounded-2xl bg-canvas border border-line text-accent">
                <GlobalIcon size={20} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Language &amp; Curriculum</h2>
                <p className="text-xs text-muted">Kenya CBC Competency alignment.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-line bg-canvas p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">Bilingual Learning</p>
                  <p className="text-[11px] text-muted">English with contextual Swahili vocabulary scaffolding</p>
                </div>
                <span className="rounded-full bg-surface border border-line px-3 py-1 text-xs font-bold text-accent">
                  Active
                </span>
              </div>

              <div className="rounded-2xl border border-line bg-canvas p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-ink">Target CBC Level</p>
                  <p className="text-[11px] text-muted">Grades 1 – 3 Foundation Literacy &amp; Money Math</p>
                </div>
                <span className="rounded-full bg-surface border border-line px-3 py-1 text-xs font-bold text-ink">
                  Grade 2 Core
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-bold text-muted hover:text-ink underline transition-colors"
            >
              Reset to default settings
            </button>
            <span className="text-[11px] text-muted">Version 2.4</span>
          </div>
        </section>
      </div>

      {/* Bottom Navigation Link */}
      <div className="pt-2 flex items-center justify-between">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-xs font-bold text-ink hover:bg-canvas transition-all shadow-sm"
        >
          <ArrowLeft01Icon size={16} />
          <span>Back to Profile</span>
        </Link>
      </div>
    </div>
  );
}

// Sleek theme preview mini card with zero hardcoded white borders
function ThemeChoiceCard({
  title,
  description,
  theme,
  active,
  onClick,
}: {
  title: string;
  description: string;
  theme: ThemePreference;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-2xl border p-2.5 sm:p-3 text-center transition-all ${
        active
          ? "border-accent bg-accent/5 shadow-sm scale-[1.02]"
          : "border-line bg-canvas hover:bg-surface hover:border-line"
      }`}
    >
      {/* Mini Mockup Visual */}
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line transition-all flex flex-col ${
          theme === "dark"
            ? "bg-[#18181b]"
            : theme === "light"
            ? "bg-[#f4f4f6]"
            : "bg-gradient-to-r from-[#f4f4f6] 50% to-[#18181b] 50%"
        }`}
      >
        {/* Top mini navbar */}
        <div
          className={`h-3 w-full border-b border-line flex items-center px-1.5 gap-1 ${
            theme === "dark"
              ? "bg-[#27272a]"
              : theme === "light"
              ? "bg-[#e4e4e7]"
              : "bg-gradient-to-r from-[#e4e4e7] 50% to-[#27272a] 50%"
          }`}
        >
          <div className="size-1.5 rounded-full bg-accent" />
          <div className="w-6 h-1 rounded-full bg-muted/40" />
        </div>

        {/* Content mini cards */}
        <div className="p-1.5 flex-1 flex flex-col justify-center gap-1">
          <div
            className={`h-2.5 rounded-md w-3/4 border border-line ${
              theme === "dark" ? "bg-[#27272a]" : theme === "light" ? "bg-white" : "bg-muted/20"
            }`}
          />
          <div
            className={`h-4 rounded-md w-full border border-line flex items-center px-1 ${
              theme === "dark" ? "bg-[#27272a]" : theme === "light" ? "bg-white" : "bg-muted/20"
            }`}
          >
            <div className="size-2 rounded-full bg-accent" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className={`text-xs font-bold ${active ? "text-accent" : "text-ink"}`}>{title}</span>
        {active && <CheckmarkCircle02Icon size={14} className="text-accent shrink-0" />}
      </div>
      <span className="text-[10px] text-muted">{description}</span>
    </button>
  );
}

// iOS-style tactile switch row
function ModernToggleRow({
  icon: Icon,
  label,
  detail,
  checked,
  onChange,
}: {
  icon: typeof TextFontIcon;
  label: string;
  detail: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-canvas p-3.5 sm:p-4 transition-all hover:bg-surface hover:border-line"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface border border-line text-muted mt-0.5">
          <Icon size={18} />
        </div>
        <div>
          <strong className="block text-xs sm:text-sm font-bold text-ink">{label}</strong>
          <span className="mt-0.5 block text-xs text-muted leading-relaxed max-w-sm sm:max-w-md">
            {detail}
          </span>
        </div>
      </div>

      {/* Tactile pill switch */}
      <div
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-line transition-colors duration-200 ease-in-out ${
          checked ? "bg-accent border-accent" : "bg-surface"
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-5 transform rounded-full bg-white dark:bg-black shadow-sm ring-0 transition duration-200 ease-in-out mt-[1px] ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </div>
  );
}
