"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Award01Icon, FireIcon, PencilEdit01Icon, Settings02Icon, Store01Icon, Logout01Icon } from "hugeicons-react";

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
  useEffect(() => {
    const savedName = window.localStorage.getItem("smart-duka-profile-name");
    if (savedName) setName(savedName);
  }, []);
  const displayName = name || progress?.student_name || "Shopkeeper";
  const initials = displayName.slice(0, 2).toUpperCase();
  const accuracy = progress?.questions_attempted
    ? Math.round((progress.correct_answers / progress.questions_attempted) * 100)
    : 0;

  const logout = () => {
    clearSession();
    if (typeof window !== "undefined") window.localStorage.removeItem("smart-duka-gameplay-session");
    router.push("/");
  };
  const saveProfile = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    window.localStorage.setItem("smart-duka-profile-name", trimmedName);
    setName(trimmedName);
    setEditing(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted">Your profile</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your learning space</h1>
          <p className="mt-2 text-muted">See your progress, update your details, and keep growing.</p>
        </div>
        <button type="button" onClick={() => { setName(progress?.student_name ?? ""); setEditing(true); }} className="inline-flex items-center gap-2 rounded-[14px] bg-ink px-4 py-3 text-sm font-semibold text-white">
          <PencilEdit01Icon size={17} color="currentColor" /> Edit profile
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid size-20 place-items-center rounded-[24px] bg-mango text-2xl font-bold text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted">Smart shopkeeper</p>
              <h2 className="mt-1 truncate text-2xl font-semibold">{displayName}</h2>
              <p className="mt-1 text-sm text-muted">Level {progress?.current_learning_level ?? 1} learner</p>
            </div>
            <span className="rounded-full bg-canvas px-3 py-2 text-xs font-semibold text-muted">English learner</span>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ProfileStat icon={FireIcon} label="Streak" value={`${progress?.daily_streak_days ?? 0} days`} />
            <ProfileStat icon={Award01Icon} label="Accuracy" value={`${accuracy}%`} />
            <ProfileStat icon={Store01Icon} label="Coins" value={`${progress?.coins_earned ?? 0}`} />
            <ProfileStat icon={Award01Icon} label="Missions" value={`${progress?.missions_completed ?? 0}`} />
          </div>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-6">
          <p className="text-sm font-medium text-muted">Learning snapshot</p>
          <h2 className="mt-1 text-xl font-semibold">You are building momentum</h2>
          <div className="mt-5 space-y-4">
            <SnapshotRow label="Questions answered" value={`${progress?.questions_attempted ?? 0}`} />
            <SnapshotRow label="Correct answers" value={`${progress?.correct_answers ?? 0}`} />
            <SnapshotRow label="Hints used" value={`${progress?.hints_used ?? 0}`} />
            <SnapshotRow label="XP earned" value={`${progress?.xp_earned ?? 0}`} />
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings" className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition-colors hover:bg-canvas">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Settings02Icon size={21} color="currentColor" /></span>
          <span className="min-w-0 flex-1"><strong className="block">Preferences</strong><span className="mt-1 block text-sm text-muted">Language, audio, and accessibility</span></span>
          <span className="text-xl text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
        <Link href="/adventure" className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition-colors hover:bg-canvas">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Award01Icon size={21} color="currentColor" /></span>
          <span className="min-w-0 flex-1"><strong className="block">Achievements</strong><span className="mt-1 block text-sm text-muted">Keep completing missions to earn more</span></span>
          <span className="text-xl text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-line bg-surface p-6">
          <p className="text-sm font-medium text-muted">Make it yours</p>
          <h2 className="mt-1 text-xl font-semibold">Choose your shopkeeper</h2>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {avatarChoices.map((choice) => <button key={choice.value} type="button" onClick={() => setAvatar(choice.value)} aria-label={`Choose ${choice.label}`} className={`rounded-2xl border p-3 text-center transition-transform hover:-translate-y-1 ${avatar === choice.value ? "border-ink bg-canvas ring-2 ring-ink/10" : "border-line"}`}><span className="text-3xl">{choice.value}</span><span className="mt-1 block text-[11px] font-semibold text-muted">{choice.label}</span></button>)}
          </div>
          <label className="mt-5 block text-sm font-medium" htmlFor="shop-name">Your shop name</label>
          <input id="shop-name" value={shopName} onChange={(event) => setShopName(event.target.value)} className="mt-2 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink" />
          <div className="mt-5 flex flex-wrap gap-2">{shopThemes.map((theme) => <button key={theme.value} type="button" onClick={() => setShopTheme(theme.value)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${theme.className} ${shopTheme === theme.value ? "border-ink ring-2 ring-ink/10" : "border-transparent"}`}>{theme.label}</button>)}</div>
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

      <section className="rounded-[24px] border border-line bg-surface p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-muted">Your adventure map</p><h2 className="mt-1 text-xl font-semibold">Next stops on your journey</h2></div><span className="rounded-full bg-canvas px-3 py-2 text-xs font-semibold text-muted">Level {progress?.current_learning_level ?? 1}</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><JourneyStep number="1" title="Open your duka" detail="Choose products and a name" done={Boolean(progress)} /><JourneyStep number="2" title="Serve customers" detail="Practice money skills" done={(progress?.questions_attempted ?? 0) > 0} /><JourneyStep number="3" title="Become a star seller" detail="Complete three missions" done={(progress?.missions_completed ?? 0) >= 3} /></div>
      </section>

      <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
        <Logout01Icon size={18} color="currentColor" /> Log out
      </button>

      {editing && <EditProfileDialog name={name} setName={setName} onClose={() => setEditing(false)} onSave={saveProfile} />}
    </div>
  );
}

function ProfileStat({ icon: Icon, label, value }: { icon: typeof FireIcon; label: string; value: string }) {
  return <div className="rounded-2xl bg-canvas p-3"><Icon size={18} color="currentColor" /><p className="mt-3 text-xs text-muted">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-line pb-3 text-sm last:border-0 last:pb-0"><span className="text-muted">{label}</span><strong>{value}</strong></div>;
}

function BadgeCard({ icon, title, detail, unlocked }: { icon: string; title: string; detail: string; unlocked: boolean }) {
  return <div className={`rounded-2xl border p-3 ${unlocked ? "border-yellow-200 bg-yellow-50" : "border-line bg-canvas opacity-50"}`}><span className="text-2xl">{unlocked ? icon : "🔒"}</span><p className="mt-2 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted">{unlocked ? detail : "Keep playing to unlock"}</p></div>;
}

function JourneyStep({ number, title, detail, done }: { number: string; title: string; detail: string; done: boolean }) {
  return <div className={`rounded-2xl border p-4 ${done ? "border-green-200 bg-green-50" : "border-line bg-canvas"}`}><div className={`grid size-8 place-items-center rounded-full text-sm font-bold ${done ? "bg-green-500 text-white" : "bg-white text-muted"}`}>{done ? "✓" : number}</div><p className="mt-4 font-semibold">{title}</p><p className="mt-1 text-sm text-muted">{detail}</p></div>;
}

function EditProfileDialog({ name, setName, onClose, onSave }: { name: string; setName: (value: string) => void; onClose: () => void; onSave: () => void }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/30 p-5" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
    <div className="w-full max-w-md rounded-[24px] bg-surface p-6 shadow-elevated">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted">Profile details</p><h2 id="edit-profile-title" className="mt-1 text-2xl font-semibold">Edit profile</h2></div><button type="button" onClick={onClose} aria-label="Close edit profile" className="grid size-9 place-items-center rounded-xl bg-canvas text-xl">×</button></div>
      <label className="mt-6 block text-sm font-medium" htmlFor="profile-name">Your name</label>
      <input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-ink" autoFocus />
      <p className="mt-2 text-xs text-muted">This name is shown on your learning dashboard.</p>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-3 text-sm font-semibold">Cancel</button><button type="button" onClick={onSave} disabled={!name.trim()} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Save changes</button></div>
    </div>
  </div>;
}
