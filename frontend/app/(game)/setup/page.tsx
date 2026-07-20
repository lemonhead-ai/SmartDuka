"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { SmartDukaLogo } from "@/components/common/SmartDukaLogo";
import { authApi } from "@/features/auth/api";
import { ApiRequestError, gameplayApi } from "@/features/gameplay/api";
import { MiloAlert } from "@/components/ui/MiloAlert";

const categoryLabels: Record<string, string> = {
  fruits: "Fresh fruit",
  vegetables: "Vegetables",
  drinks: "Drinks",
  snacks: "Snacks",
  school_supplies: "School supplies",
  household_items: "Home essentials"
};

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const account = useQuery({ queryKey: ["auth", "me"], queryFn: authApi.me, retry: false });
  const shop = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop, retry: false, enabled: Boolean(account.data) });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: gameplayApi.catalog, enabled: Boolean(account.data) });
  const setupRequired = shop.error instanceof ApiRequestError && shop.error.status === 404;

  useEffect(() => {
    if (account.data && !name) setName(`${account.data.shopkeeper.display_name}'s Duka`);
  }, [account.data, name]);
  useEffect(() => {
    if (shop.data) router.replace("/dashboard");
  }, [router, shop.data]);

  const categories = useMemo(() => [...new Set((catalog.data ?? []).map((item) => item.category))], [catalog.data]);
  const items = (catalog.data ?? []).filter(
    (item) => categoryFilter === "all" || item.category === categoryFilter,
  );
  const toggleItem = (itemId: string) => {
    setSelected((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : current.length < 5 ? [...current, itemId] : current);
  };
  const submit = async () => {
    if (!name.trim() || selected.length < 2) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await gameplayApi.createShop(name.trim(), selected);
      router.replace("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create your duka. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (account.isLoading || (account.data && shop.isLoading)) return <LoadingState />;
  if (account.error) return <AccessRequired />;
  if (shop.data) return <LoadingState />;
  if (!setupRequired) return <main id="main-content" className="grid min-h-dvh place-items-center bg-canvas p-6"><div className="w-full max-w-md"><MiloAlert kind="error" message="We could not open setup right now. Please refresh and try again." /></div></main>;

  return <main id="main-content" className="min-h-dvh bg-canvas px-5 py-6 sm:px-10">
    <div className="mx-auto max-w-5xl">
      <SmartDukaLogo />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="mt-10 rounded-[32px] border border-line bg-surface p-6 sm:p-10">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-accent">Your first shop</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Let&apos;s open your duka.</h1>
          <p className="mt-3 leading-6 text-muted">Choose a small starter shelf. You can add more products later in the Stock Room.</p>
        </div>
        <ol className="mt-8 grid gap-3 text-sm sm:grid-cols-3"><li className="rounded-[16px] bg-canvas p-4 font-semibold">1. Name your duka</li><li className="rounded-[16px] bg-canvas p-4 font-semibold">2. Choose what to sell</li><li className="rounded-[16px] bg-canvas p-4 font-semibold">3. Open your shelves</li></ol>
        <div className="mt-9 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section>
            <label className="grid gap-2 text-sm font-semibold">Duka name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className="rounded-[14px] border border-line bg-canvas px-4 py-3 font-normal" /></label>
            <div className="mt-7"><p className="text-sm font-semibold">Choose your starter products</p><p className="mt-1 text-sm leading-5 text-muted">Mix fruit, drinks, snacks, and more. These filters only help you browse; they never limit your duka.</p></div>
            <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setCategoryFilter("all")} aria-pressed={categoryFilter === "all"} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${categoryFilter === "all" ? "border-accent bg-accent text-white" : "border-line bg-canvas hover:border-accent"}`}>Everything</button>{categories.map((value) => <button key={value} type="button" onClick={() => setCategoryFilter(value)} aria-pressed={categoryFilter === value} className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${categoryFilter === value ? "border-accent bg-accent text-white" : "border-line bg-canvas hover:border-accent"}`}>{categoryLabels[value] ?? value.replaceAll("_", " ")}</button>)}</div>
          </section>
          <section className="rounded-[24px] bg-canvas p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold">Your starter shelf</h2><p className="mt-1 text-sm text-muted">Choose at least 2, up to 5 products from any category.</p></div><span className="rounded-full bg-surface px-3 py-1 text-sm font-bold">{selected.length}/5</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} key={item.id} type="button" onClick={() => toggleItem(item.id)} aria-pressed={selected.includes(item.id)} className={`rounded-[18px] border p-4 text-left ${selected.includes(item.id) ? "border-accent bg-surface" : "border-line bg-white"}`}><span className="text-xs font-semibold uppercase tracking-wide text-muted">{categoryLabels[item.category] ?? item.category.replaceAll("_", " ")}</span><strong className="mt-1 block">{item.name}</strong><span className="mt-1 block text-sm text-muted">KES {item.price_kes}</span></motion.button>)}</div></section>
        </div>
        {submitError && <MiloAlert kind="error" message={submitError} className="mt-6" />}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"><p className="text-sm text-muted">Your first products will be ready for your first customer.</p><motion.button whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }} type="button" disabled={!name.trim() || selected.length < 2 || isSubmitting} onClick={() => void submit()} className="rounded-full bg-ink px-6 py-3 font-bold text-white disabled:opacity-50">{isSubmitting ? "Opening your duka…" : "Open my duka"}</motion.button></div>
      </motion.section>
    </div>
  </main>;
}

function LoadingState() {
  return <main id="main-content" className="grid min-h-dvh place-items-center bg-canvas p-6"><p className="text-sm font-semibold text-muted">Getting your duka ready…</p></main>;
}

function AccessRequired() {
  return <main id="main-content" className="grid min-h-dvh place-items-center bg-canvas p-6"><section className="max-w-md rounded-[24px] border border-line bg-surface p-7 text-center"><h1 className="text-2xl font-bold">Start with an account</h1><p className="mt-3 text-sm leading-6 text-muted">Create an account or sign in before setting up your own duka.</p><div className="mt-6 flex justify-center gap-3"><Link href="/sign-in" className="rounded-full border border-line px-5 py-3 font-bold">Log in</Link><Link href="/sign-up" className="rounded-full bg-ink px-5 py-3 font-bold text-white">Sign up</Link></div></section></main>;
}
