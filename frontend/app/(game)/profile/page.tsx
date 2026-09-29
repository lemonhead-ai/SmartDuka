"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Settings02Icon,
  Logout01Icon,
  Award01Icon,
  Award02Icon,
  CheckmarkCircle02Icon,
  PencilEdit01Icon,
  Store01Icon,
  FireIcon
} from "hugeicons-react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { gameplayApi } from "@/features/gameplay/api";
import { authApi } from "@/features/auth/api";
import { MiloAlert } from "@/components/ui/MiloAlert";
import { useGameplaySessionStore } from "@/features/gameplay/store";
import { avatarChoices, shopThemes, useKidProfileStore, type ShopTheme } from "@/features/kids/store";
import { useAuth } from "@/features/auth/AuthProvider";

const LockSVG = () => (
  <svg className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

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
  const [shopTheme, setShopTheme] = useState<ShopTheme>("leaf");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountQuery.data) {
      if (!editing) setName(accountQuery.data.shopkeeper.display_name);
      if (accountQuery.data.shopkeeper.avatar) {
        setAvatar(accountQuery.data.shopkeeper.avatar as any);
      }
    }
  }, [accountQuery.data, editing, setAvatar]);

  useEffect(() => {
    if (shopQuery.data) {
      setShopName(shopQuery.data.name);
      setShopTheme(shopQuery.data.theme as ShopTheme);
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
    router.push("/sign-in");
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

  useEffect(() => {
    if (deleteDialogOpen) deleteInputRef.current?.focus();
  }, [deleteDialogOpen]);

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
    setDeleteError(null);
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE" || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await authApi.deleteAccount();
      await logout();
    } catch {
      setDeleteError("We could not delete your account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-1 sm:space-y-6 pb-6">
      {/* Top Header */}
      <DashboardHeader />

      {/* Profile Hero Section */}
      <section className="rounded-[36px] border border-line bg-surface p-6 sm:p-10 text-center relative overflow-hidden shadow-sm">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10" />

        {/* Single-bordered avatar container */}
        <div className="mx-auto grid size-28 sm:size-32 place-items-center rounded-full bg-canvas border border-line shadow-sm relative z-10 overflow-hidden p-2">
          <Image
            src={avatarImageMap[avatar] || "/mascots/milo.PNG"}
            alt="Your avatar mascot"
            width={110}
            height={110}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="mt-5 flex flex-col items-center justify-center">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => void saveProfile()}
                onKeyDown={handleKeyDown}
                className="text-xl sm:text-2xl font-bold text-center bg-canvas border border-line rounded-full px-4 py-2 outline-none focus:border-accent text-ink w-64"
                placeholder="Your name"
              />
              <button
                onClick={() => void saveProfile()}
                className="grid size-10 place-items-center rounded-full bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm"
              >
                <CheckmarkCircle02Icon size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">{displayName}</h1>
              <button
                onClick={() => {
                  setName(displayName);
                  setEditing(true);
                }}
                className="grid size-9 place-items-center rounded-full bg-canvas border border-line text-muted hover:text-ink transition-colors"
                aria-label="Edit name"
                title="Edit name"
              >
                <PencilEdit01Icon size={16} />
              </button>
            </div>
          )}
          <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            Level {progress?.current_learning_level ?? 1} Shopkeeper
          </p>
        </div>

        {/* Avatar choices */}
        <div className="mt-8 pt-6 border-t border-line">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Choose your avatar</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2.5">
            {avatarChoices.map((choice) => {
              const isSelected = avatar === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => {
                    setAvatar(choice.value);
                    profileMutation.mutate({ avatar: choice.value });
                  }}
                  aria-label={`Choose ${choice.label}`}
                  className={`rounded-full size-14 sm:size-16 transition-all duration-200 overflow-hidden p-2 flex items-center justify-center ${
                    isSelected
                      ? "bg-surface border-2 border-accent shadow-sm scale-105"
                      : "bg-canvas border border-line opacity-70 hover:opacity-100 hover:scale-105"
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Duka Identity & Badges Grid */}
      <div className="grid gap-1 sm:gap-6 lg:grid-cols-2">
        {/* Duka Identity Card */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm transition-all duration-200">
          <div className="pb-3 border-b border-line">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Duka Identity</p>
            <h2 className="mt-0.5 text-xl font-bold text-ink tracking-tight">Your Shop Customization</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted" htmlFor="shop-name">
                Shop Name
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="shop-name"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  className="flex-1 rounded-full border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => shopMutation.mutate({ name: shopName.trim() })}
                  disabled={shopMutation.isPending || shopName.trim().length < 2}
                  className="rounded-full bg-ink text-surface px-5 py-2.5 text-xs font-bold disabled:opacity-50 transition-all hover:scale-105"
                >
                  {shopMutation.isPending ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <p className="block text-xs font-bold uppercase tracking-wider text-muted">Shop Color Theme</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {shopThemes.map((theme) => {
                  const isSelected = shopTheme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => {
                        setShopTheme(theme.value);
                        shopMutation.mutate({ theme: theme.value });
                      }}
                      className={`rounded-full px-4 py-2 text-xs font-bold border transition-all ${
                        isSelected
                          ? "border-accent bg-accent text-white dark:text-black shadow-sm scale-105"
                          : "border-line bg-canvas text-muted hover:text-ink hover:bg-surface"
                      }`}
                    >
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed pt-2">
              Your duka name and theme appear on customer receipts, shop counter, and leaderboard.
            </p>
          </div>
        </article>

        {/* Accomplishments & Little Wins */}
        <article className="rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm transition-all duration-200">
          <div className="pb-3 border-b border-line">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Your Collection</p>
            <h2 className="mt-0.5 text-xl font-bold text-ink tracking-tight">Milestones &amp; Badges</h2>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <BadgeCard icon={Store01Icon} title="First steps" detail="Opened your duka" unlocked={Boolean(progress)} />
            <BadgeCard icon={Award02Icon} title="Fast cashier" detail="Accurate change math" unlocked={(progress?.correct_answers ?? 0) > 0} />
            <BadgeCard icon={CheckmarkCircle02Icon} title="Helpful seller" detail="Complete missions" unlocked={(progress?.missions_completed ?? 0) > 0} />
            <BadgeCard icon={FireIcon} title="On a roll" detail="Active daily streak" unlocked={(progress?.daily_streak_days ?? 0) > 0} />
          </div>
        </article>
      </div>

      {/* Quick Navigation Links */}
      <section className="grid gap-2 sm:gap-4 sm:grid-cols-2">
        <Link
          href="/settings"
          className="group flex items-center gap-4 rounded-[24px] border border-line bg-surface p-4 sm:p-5 transition-all duration-200 hover:bg-canvas"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-ink">
            <Settings02Icon size={20} color="currentColor" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-bold text-ink">Settings</strong>
            <span className="text-xs text-muted">Appearance, text size, and sound effects</span>
          </span>
          <span className="text-lg text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>

        <Link
          href="/adventure"
          className="group flex items-center gap-4 rounded-[24px] border border-line bg-surface p-4 sm:p-5 transition-all duration-200 hover:bg-canvas"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-canvas border border-line text-accent">
            <Award01Icon size={20} color="currentColor" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm font-bold text-ink">Adventure &amp; Missions</strong>
            <span className="text-xs text-muted">View your learning roadmap and goals</span>
          </span>
          <span className="text-lg text-muted transition-transform group-hover:translate-x-1">›</span>
        </Link>
      </section>

      {/* Account Actions: Logout & Delete Account */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
        >
          <Logout01Icon size={16} color="currentColor" />
          <span>Log out</span>
        </button>

        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold transition-colors shadow-sm"
        >
          <span>Delete account</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
          <section
            role="alertdialog"
            className="w-full max-w-sm rounded-[28px] border border-line bg-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600">
                <Logout01Icon size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Log out of SmartDuka?</h3>
                <p className="text-xs text-muted">You can log back in anytime to continue playing.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-bold text-ink hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors"
              >
                Log out
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Delete Account Modal Dialog */}
      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === "Escape") closeDeleteDialog();
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            className="w-full max-w-md rounded-[28px] border border-line bg-surface p-6 shadow-2xl sm:p-7"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-rose-100 text-xl font-black text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" aria-hidden="true">
              !
            </div>
            <h2 id="delete-account-title" className="mt-4 text-2xl font-black text-ink tracking-tight">
              Delete your account?
            </h2>
            <p id="delete-account-description" className="mt-2 text-xs leading-relaxed text-muted">
              This permanently removes your duka, saved progress, and shopkeeper data. This action cannot be undone.
            </p>
            <label className="mt-5 grid gap-2 text-xs font-bold uppercase tracking-wider text-muted" htmlFor="delete-confirmation">
              Type <span className="text-rose-600">DELETE</span> to confirm
              <input
                ref={deleteInputRef}
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value.toUpperCase())}
                disabled={isDeleting}
                autoComplete="off"
                className="rounded-full border border-line bg-canvas px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-rose-500 disabled:opacity-60"
              />
            </label>
            {deleteError && <MiloAlert kind="error" message={deleteError} className="mt-3" />}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="rounded-full border border-line px-5 py-2.5 text-xs font-bold text-ink hover:bg-canvas transition-colors disabled:opacity-50"
              >
                Keep my account
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isDeleting ? "Deleting account…" : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function BadgeCard({
  icon: Icon,
  title,
  detail,
  unlocked
}: {
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  title: string;
  detail: string;
  unlocked: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 text-left transition-all duration-200 hover:scale-[1.02] ${
        unlocked
          ? "border-accent bg-accent/5"
          : "border-line bg-canvas opacity-70"
      }`}
    >
      <div
        className={`grid size-8 place-items-center rounded-xl ${
          unlocked
            ? "bg-accent/20 text-accent"
            : "bg-surface text-muted border border-line"
        }`}
      >
        {unlocked ? <Icon size={16} color="currentColor" /> : <LockSVG />}
      </div>
      <p className="mt-2.5 text-xs sm:text-sm font-bold text-ink">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted leading-tight">{unlocked ? detail : "Locked"}</p>
    </div>
  );
}
