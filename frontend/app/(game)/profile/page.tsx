"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Settings02Icon, Logout01Icon, Award01Icon, CheckmarkCircle02Icon, PencilEdit01Icon } from "hugeicons-react";

import { gameplayApi } from "@/features/gameplay/api";
import { useGameplaySessionStore } from "@/features/gameplay/store";
import { avatarChoices, shopThemes, useKidProfileStore } from "@/features/kids/store";

export default function ProfilePage() {
  const router = useRouter();
  const clearSession = useGameplaySessionStore((state) => state.clearSession);
  const { avatar, setAvatar, shopName, setShopName, shopTheme, setShopTheme } = useKidProfileStore();
  const progressQuery = useQuery({ queryKey: ["player-progress"], queryFn: gameplayApi.progress });
  const progress = progressQuery.data;
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedName = window.localStorage.getItem("smart-duka-profile-name");
    if (savedName) setName(savedName);
  }, []);

  const displayName = name || progress?.student_name || "Shopkeeper";

  const logout = () => {
    clearSession();
    if (typeof window !== "undefined") window.localStorage.removeItem("smart-duka-gameplay-session");
    router.push("/");
  };

  const saveProfile = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        setName(progress?.student_name || "Shopkeeper");
        setEditing(false);
        return;
    }
    window.localStorage.setItem("smart-duka-profile-name", trimmedName);
    setName(trimmedName);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") saveProfile();
    if (e.key === "Escape") {
        setName(window.localStorage.getItem("smart-duka-profile-name") || progress?.student_name || "Shopkeeper");
        setEditing(false);
    }
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your Profile</h1>
          <p className="mt-2 text-muted">Update your details and choose your look.</p>
        </div>
      </header>

      <section className="rounded-[32px] border border-line bg-surface p-8 text-center sm:p-12 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="mx-auto grid size-32 place-items-center rounded-full bg-white border-4 border-line shadow-sm text-6xl shadow-elevated relative z-10">
          {avatar}
        </div>
        
        <div className="mt-6 flex flex-col items-center justify-center">
            {editing ? (
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={saveProfile}
                        onKeyDown={handleKeyDown}
                        className="text-2xl font-semibold text-center bg-canvas border border-line rounded-xl px-4 py-2 outline-none focus:border-accent w-64"
                        placeholder="Your name"
                    />
                    <button 
                        onClick={saveProfile} 
                        className="grid size-11 place-items-center rounded-xl bg-accent text-white hover:bg-accent/90"
                    >
                        <CheckmarkCircle02Icon size={24} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">{displayName}</h2>
                    <button 
                        onClick={() => {
                            setName(displayName);
                            setEditing(true);
                        }}
                        className="grid size-10 place-items-center rounded-full bg-canvas text-muted hover:bg-line transition-colors"
                        aria-label="Edit name"
                    >
                        <PencilEdit01Icon size={18} />
                    </button>
                </div>
            )}
            <p className="mt-2 font-medium text-muted">Level {progress?.current_learning_level ?? 1} Learner</p>
        </div>

        <div className="mt-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">Choose your avatar</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
                {avatarChoices.map((choice) => (
                    <button 
                        key={choice.value} 
                        type="button" 
                        onClick={() => setAvatar(choice.value)} 
                        aria-label={`Choose ${choice.label}`} 
                        className={`rounded-full size-16 text-3xl transition-transform hover:-translate-y-1 ${
                            avatar === choice.value ? "bg-white border-2 border-accent shadow-md scale-110" : "bg-canvas border border-line opacity-60 hover:opacity-100"
                        }`}
                    >
                        {choice.value}
                    </button>
                ))}
            </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-line bg-surface p-6">
          <p className="text-sm font-medium text-muted">Duka Identity</p>
          <h2 className="mt-1 text-xl font-semibold">Your Shop</h2>
          
          <label className="mt-6 block text-sm font-medium" htmlFor="shop-name">Shop name</label>
          <input 
            id="shop-name" 
            value={shopName} 
            onChange={(event) => setShopName(event.target.value)} 
            className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-ink transition-colors" 
          />
          
          <p className="mt-6 block text-sm font-medium">Shop theme</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {shopThemes.map((theme) => (
                <button 
                    key={theme.value} 
                    type="button" 
                    onClick={() => setShopTheme(theme.value)} 
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${theme.className} ${
                        shopTheme === theme.value ? "border-ink ring-2 ring-ink/20 shadow-sm" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                >
                    {theme.label}
                </button>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-6">
          <p className="text-sm font-medium text-muted">Your collection</p>
          <h2 className="mt-1 text-xl font-semibold">Little wins</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <BadgeCard icon="🌟" title="First steps" detail="Start your duka" unlocked={Boolean(progress)} />
            <BadgeCard icon="🧮" title="Careful counter" detail="Answer correctly" unlocked={(progress?.correct_answers ?? 0) > 0} />
            <BadgeCard icon="🛍️" title="Helpful seller" detail="Complete a mission" unlocked={(progress?.missions_completed ?? 0) > 0} />
            <BadgeCard icon="🔥" title="On a roll" detail="Build a streak" unlocked={(progress?.daily_streak_days ?? 0) > 0} />
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings" className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition-colors hover:bg-canvas">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Settings02Icon size={21} color="currentColor" /></span>
          <span className="min-w-0 flex-1"><strong className="block">Settings</strong><span className="mt-1 block text-sm text-muted">Appearance, text, and sound</span></span>
          <span className="text-xl text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
        <Link href="/adventure" className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition-colors hover:bg-canvas">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Award01Icon size={21} color="currentColor" /></span>
          <span className="min-w-0 flex-1"><strong className="block">Missions & Progress</strong><span className="mt-1 block text-sm text-muted">View your learning stats</span></span>
          <span className="text-xl text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
      </section>

      <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
        <Logout01Icon size={18} color="currentColor" /> Log out
      </button>

    </div>
  );
}

function BadgeCard({ icon, title, detail, unlocked }: { icon: string; title: string; detail: string; unlocked: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${unlocked ? "border-yellow-200 bg-yellow-50" : "border-line bg-canvas opacity-50"}`}>
        <span className="text-2xl">{unlocked ? icon : "🔒"}</span>
        <p className="mt-2 text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted">{unlocked ? detail : "Keep playing to unlock"}</p>
    </div>
  );
}
