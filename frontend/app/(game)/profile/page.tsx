"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings02Icon, Logout01Icon, Award01Icon, Award02Icon, CheckmarkCircle02Icon, PencilEdit01Icon, Store01Icon, FireIcon } from "hugeicons-react";

import { gameplayApi } from "@/features/gameplay/api";
import { authApi } from "@/features/auth/api";

const LockSVG = () => (
  <svg className="size-5 text-muted/65" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
import { useGameplaySessionStore } from "@/features/gameplay/store";
import { avatarChoices, shopThemes, useKidProfileStore } from "@/features/kids/store";
import { useAuth } from "@/features/auth/AuthProvider";

const avatarImageMap: Record<string, string> = {
  mario: "/illustrations/mario.PNG",
  milo: "/mascots/milo.PNG",
  stitch: "/illustrations/stitch.PNG",
  kirby: "/illustrations/kirby.PNG",
  jack: "/illustrations/jack.PNG"
};

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearSession = useGameplaySessionStore((state) => state.clearSession);
  const { signOut } = useAuth();
  const { avatar, setAvatar } = useKidProfileStore();
  const progressQuery = useQuery({ queryKey: ["player-progress"], queryFn: gameplayApi.progress });
  const accountQuery = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.me, retry: false });
  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop });
  const progress = progressQuery.data;
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopTheme, setShopTheme] = useState<"sunrise" | "ocean" | "leaf" | "berry">("leaf");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountQuery.data && !editing) setName(accountQuery.data.shopkeeper.display_name);
  }, [accountQuery.data, editing]);
  useEffect(() => {
    if (shopQuery.data) {
      setShopName(shopQuery.data.name);
      setShopTheme(shopQuery.data.theme);
    }
  }, [shopQuery.data]);

  const displayName = name || accountQuery.data?.shopkeeper.display_name || progress?.student_name || "Shopkeeper";
  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (result) => {
      queryClient.setQueryData(["auth", "me"], result);
      void queryClient.invalidateQueries({ queryKey: ["player-progress"] });
    },
  });
  const shopMutation = useMutation({
    mutationFn: gameplayApi.updateShop,
    onSuccess: (shop) => queryClient.setQueryData(["shop"], shop),
  });

  const logout = async () => {
    await signOut().catch(() => undefined);
    clearSession();
    if (typeof window !== "undefined") window.localStorage.removeItem("smart-duka-gameplay-session");
    router.push("/");
  };

  const saveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
        setName(accountQuery.data?.shopkeeper.display_name || progress?.student_name || "Shopkeeper");
        setEditing(false);
        return;
    }
    try {
      await profileMutation.mutateAsync(trimmedName);
      setName(trimmedName);
      setEditing(false);
    } catch {
      setName(accountQuery.data?.shopkeeper.display_name || progress?.student_name || "Shopkeeper");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void saveProfile();
    if (e.key === "Escape") {
        setName(accountQuery.data?.shopkeeper.display_name || progress?.student_name || "Shopkeeper");
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
        
        <div className="mx-auto grid size-32 place-items-center rounded-full bg-white border-4 border-line shadow-sm shadow-elevated relative z-10 overflow-hidden">
          <Image 
            src={avatarImageMap[avatar] || "/mascots/milo.PNG"} 
            alt="Your avatar mascot" 
            width={110} 
            height={110} 
            className="w-full h-full object-contain p-2"
          />
        </div>
        
        <div className="mt-6 flex flex-col items-center justify-center">
            {editing ? (
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => void saveProfile()}
                        onKeyDown={handleKeyDown}
                        className="text-2xl font-semibold text-center bg-canvas border border-line rounded-xl px-4 py-2 outline-none focus:border-accent w-64"
                        placeholder="Your name"
                    />
                    <button 
                        onClick={() => void saveProfile()} 
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
                        className={`rounded-full size-16 transition-all duration-200 hover:-translate-y-1 overflow-hidden p-2 flex items-center justify-center ${
                            avatar === choice.value ? "bg-white dark:bg-canvas border-2 border-accent ring-2 ring-accent/25 shadow-md scale-110" : "bg-canvas border border-line opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                    >
                        <Image 
                            src={avatarImageMap[choice.value]} 
                            alt={choice.label} 
                            width={48} 
                            height={48} 
                            className="w-full h-full object-contain"
                        />
                    </button>
                ))}
            </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[24px] border border-line bg-surface p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <p className="text-sm font-medium text-muted">Duka Identity</p>
          <h2 className="mt-1 text-xl font-semibold">Your Shop</h2>
          
          <label className="mt-6 block text-sm font-medium text-ink/80" htmlFor="shop-name">Shop name</label>
          <input 
            id="shop-name" 
            value={shopName} 
            onChange={(event) => setShopName(event.target.value)} 
            className="mt-2 w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none focus:border-ink transition-colors" 
          />
          <button type="button" onClick={() => shopMutation.mutate({ name: shopName.trim() })} disabled={shopMutation.isPending || shopName.trim().length < 2} className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{shopMutation.isPending ? "Saving…" : "Save shop name"}</button>
          
          <p className="mt-6 block text-sm font-medium text-ink/80">Shop theme</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {shopThemes.map((theme) => (
                <button 
                    key={theme.value} 
                    type="button" 
                    onClick={() => { setShopTheme(theme.value); shopMutation.mutate({ theme: theme.value }); }} 
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${theme.className} ${
                        shopTheme === theme.value 
                          ? `border-2 ring-2 shadow-sm scale-105 ${theme.selectedClass}` 
                          : "border-transparent opacity-70 hover:opacity-100 hover:scale-[1.03]"
                    }`}
                >
                    {theme.label}
                </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">Your duka name appears in the shop, receipts, and stock snapshot. Its theme is saved to your account too.</p>
        </article>

        <article className="rounded-[24px] border border-line bg-surface p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
          <p className="text-sm font-medium text-muted">Your collection</p>
          <h2 className="mt-1 text-xl font-semibold">Little wins</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <BadgeCard icon={Store01Icon} title="First steps" detail="Start your duka" unlocked={Boolean(progress)} />
            <BadgeCard icon={Award02Icon} title="Careful counter" detail="Answer correctly" unlocked={(progress?.correct_answers ?? 0) > 0} />
            <BadgeCard icon={CheckmarkCircle02Icon} title="Helpful seller" detail="Complete a mission" unlocked={(progress?.missions_completed ?? 0) > 0} />
            <BadgeCard icon={FireIcon} title="On a roll" detail="Build a streak" unlocked={(progress?.daily_streak_days ?? 0) > 0} />
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/settings" className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition-all duration-300 hover:bg-canvas hover:scale-[1.02] hover:shadow-md active:scale-[0.98]">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Settings02Icon size={21} color="currentColor" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-ink">Settings</strong><span className="mt-1 block text-sm text-muted">Appearance, text, and sound</span></span>
          <span className="text-xl text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
        <Link href="/adventure" className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition-all duration-300 hover:bg-canvas hover:scale-[1.02] hover:shadow-md active:scale-[0.98]">
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas"><Award01Icon size={21} color="currentColor" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-ink">Explore Adventure</strong><span className="mt-1 block text-sm text-muted">Start missions and progress</span></span>
          <span className="text-xl text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
      </section>

      <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-[14px] border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
        <Logout01Icon size={18} color="currentColor" /> Log out
      </button>

    </div>
  );
}

function BadgeCard({ icon: Icon, title, detail, unlocked }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; detail: string; unlocked: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-md ${
      unlocked 
        ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/20 dark:bg-emerald-950/10" 
        : "border-line bg-canvas/45 opacity-65"
    }`}>
        <div className={`grid size-9 place-items-center rounded-xl ${
          unlocked 
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-[#047857] dark:text-[#30D158]" 
            : "bg-line/45 text-muted"
        }`}>
          {unlocked ? <Icon size={18} className="stroke-[2.5]" /> : <LockSVG />}
        </div>
        <p className="mt-3 text-sm font-bold text-ink">{title}</p>
        <p className="mt-1 text-xs text-muted leading-relaxed">{unlocked ? detail : "Keep playing to unlock"}</p>
    </div>
  );
}
