"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, gameplayApi } from "@/features/gameplay/api";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("My Duka");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const shop = useQuery({
    queryKey: ["shop"],
    queryFn: gameplayApi.shop,
    retry: false
  });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: gameplayApi.catalog });
  const setupRequired = shop.error instanceof ApiRequestError && shop.error.status === 404;

  useEffect(() => {
    if (shop.data) router.replace("/dashboard");
  }, [router, shop.data]);

  const categories = useMemo(() => [...new Set((catalog.data ?? []).map((item) => item.category))], [catalog.data]);
  const items = (catalog.data ?? []).filter((item) => item.category === category);
  const submit = async () => {
    if (!category || selected.length < 2) return;
    setSubmitError(null);
    try {
      await gameplayApi.createShop(name, category, selected);
      router.push("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create your duka. Please try again.");
    }
  };
  if (shop.isLoading || shop.data) {
    return <main className="mx-auto max-w-2xl p-6"><p className="text-sm font-medium text-muted">Checking your dukaâ€¦</p></main>;
  }

  if (!setupRequired) {
    return <main className="mx-auto max-w-2xl p-6"><p role="alert" className="rounded-[20px] border border-line bg-surface p-4 text-muted">We could not check your duka right now. Please refresh and try again.</p></main>;
  }

  return <main className="mx-auto max-w-2xl p-6"><p className="text-sm font-medium text-muted">Set up your duka</p><h1 className="mt-2 text-3xl font-semibold">What will you sell?</h1><input value={name} onChange={(event) => setName(event.target.value)} className="mt-6 w-full rounded-xl border border-line p-3" aria-label="Duka name" /><div className="mt-5 flex flex-wrap gap-2">{categories.map((value) => <button key={value} type="button" onClick={() => { setCategory(value); setSelected([]); setSubmitError(null); }} className={`rounded-xl border px-4 py-2 ${category === value ? "bg-ink text-white" : "border-line"}`}>{value.replaceAll("_", " ")}</button>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2">{items.map((item) => <button key={item.id} type="button" onClick={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : current.length < 5 ? [...current, item.id] : current)} className={`rounded-xl border p-4 text-left ${selected.includes(item.id) ? "border-ink bg-canvas" : "border-line"}`}><strong>{item.name}</strong><span className="block text-sm text-muted">KES {item.price_kes}</span></button>)}</div>{submitError && <p role="alert" className="mt-5 rounded-[20px] border border-line bg-surface p-3 text-sm font-medium text-muted">{submitError}</p>}<button type="button" disabled={!category || selected.length < 2} onClick={() => void submit()} className="mt-7 rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">Open my duka ({selected.length}/2 minimum)</button></main>;
}
