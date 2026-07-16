"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { gameplayApi } from "@/features/gameplay/api";
import { OfflineSyncManager, completeScenario, getOfflineMeta, getPlayableScenarios, queueGameEvent } from "@/features/offline";
import type { CachedScenario } from "@/features/offline";
import { triggerSensoryFeedback } from "@/features/feedback/sensory-feedback";
import { useToastStore, type ToastKind } from "@/features/feedback/toast-store";
import { useGameplaySessionStore } from "@/features/gameplay/store";
import type { ApiError, Basket, Challenge, Customer } from "@/features/gameplay/types";

function errorMessage(error: unknown): string {
  return typeof error === "object" && error !== null && "detail" in error
    ? (error as ApiError).detail
    : "The Smart Duka API is unavailable. Start the backend, then try again.";
}

export function ShopCounter() {
  const { sessionId, setSessionId } = useGameplaySessionStore();
  const showToast = useToastStore((state) => state.showToast);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [basket, setBasket] = useState<Basket | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [offlineScenario, setOfflineScenario] = useState<CachedScenario | null>(null);
  const [offlineBasket, setOfflineBasket] = useState<Record<string, number>>({});

  const notify = (kind: ToastKind, message: string) => {
    triggerSensoryFeedback(kind);
    showToast(kind, message);
  };
  const showBasketFeedback = (nextBasket: Basket) => {
    setBasket(nextBasket);
    notify(nextBasket.validation.is_valid ? "success" : "warning", nextBasket.validation.tutor_feedback);
  };
  const inventoryQuery = useQuery({
    queryKey: ["inventory", sessionId],
    queryFn: () => gameplayApi.inventory(sessionId ?? ""),
    enabled: Boolean(sessionId && customer)
  });
  const nextCustomerMutation = useMutation({
    mutationFn: gameplayApi.nextCustomer,
    onSuccess: (result) => {
      setCustomer(result.customer);
      setBasket(result.basket);
      setChallenge(null);
      setAnswer("");
      notify("info", `${result.customer.name} is ready at the counter.`);
    },
    onError: (error) => notify("error", errorMessage(error))
  });
  const startMutation = useMutation({
    mutationFn: gameplayApi.startSession,
    onError: (error) => notify("error", errorMessage(error))
  });
  const addItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => gameplayApi.addBasketItem(sessionId ?? "", itemId),
    onSuccess: showBasketFeedback,
    onError: (error) => notify("error", errorMessage(error))
  });
  const removeItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => gameplayApi.removeBasketItem(sessionId ?? "", itemId),
    onSuccess: showBasketFeedback,
    onError: (error) => notify("error", errorMessage(error))
  });
  const checkoutMutation = useMutation({
    mutationFn: () => gameplayApi.checkout(sessionId ?? ""),
    onSuccess: (result) => {
      if (result.challenge) {
        setChallenge(result.challenge);
        notify("info", `Money received: KES ${result.challenge.amount_paid_kes}. Find the change.`);
        return;
      }
      setCustomer(null);
      setBasket(null);
      notify("success", result.reward?.message ?? "Checkout complete!");
      void queueGameEvent("transaction_completed", {
        sessionId,
        customerId: customer?.id,
        totalKes: basket?.total_kes ?? 0
      }).then(() => new OfflineSyncManager().sync()).catch(() => {
        // The event remains queued and will retry on the next connectivity window.
      });
    },
    onError: (error) => notify("error", errorMessage(error))
  });
  const hintMutation = useMutation({
    mutationFn: () => gameplayApi.requestHint(sessionId ?? ""),
    onSuccess: (result) => notify("info", `${result.hint} ${result.encouragement}`),
    onError: (error) => notify("error", errorMessage(error))
  });
  const answerMutation = useMutation({
    mutationFn: () => gameplayApi.answerChallenge(sessionId ?? "", Number(answer)),
    onSuccess: (result) => {
      if (result.challenge_complete) {
        notify("success", result.feedback);
        checkoutMutation.mutate();
      } else {
        notify("error", result.feedback);
      }
    },
    onError: (error) => notify("error", errorMessage(error))
  });

  const startOrContinue = async () => {
    if (sessionId) {
      nextCustomerMutation.mutate(sessionId);
      return;
    }
    try {
      const session = await startMutation.mutateAsync();
      setSessionId(session.session_id);
      nextCustomerMutation.mutate(session.session_id);
    } catch {
      await loadOfflineScenario();
    }
  };
  const loadOfflineScenario = async () => {
    const childId = await getOfflineMeta<string>("active-child-id");
    if (!childId) return;
    const [scenario] = await getPlayableScenarios(childId);
    if (!scenario) return;
    setOfflineScenario(scenario);
    setOfflineBasket({});
  };
  const completeOfflineScenario = async () => {
    if (!offlineScenario) return;
    const items = (offlineScenario.payload.items ?? []) as { id: string; quantity: number }[];
    const matches = items.length > 0 && items.every((item) => offlineBasket[item.id] === item.quantity);
    if (!matches) {
      const tutor = await getOfflineMeta<{ hint: string; encouragement: string }>("tutor-guidance");
      notify("warning", tutor ? `${tutor.hint} ${tutor.encouragement}` : "Match the customer’s list before completing the sale.");
      return;
    }
    await completeScenario(offlineScenario.id);
    await queueGameEvent("transaction_completed", { scenarioId: offlineScenario.id, correct: true });
    void new OfflineSyncManager().sync().catch(() => undefined);
    notify("success", "Sale saved on this device. New adventures will sync when you are online.");
    setOfflineScenario(null);
    await loadOfflineScenario();
  };
  const pending = startMutation.isPending || nextCustomerMutation.isPending;

  if (offlineScenario) {
    const items = (offlineScenario.payload.items ?? []) as { id: string; name: string; quantity: number; unitPriceKes: number }[];
    return <section className="rounded-[24px] border border-line bg-surface p-6"><p className="text-sm font-medium text-muted">Offline adventure</p><h1 className="mt-1 text-2xl font-semibold">{offlineScenario.customerName} is at the counter</h1><p className="mt-3 text-muted">{String(offlineScenario.payload.greeting ?? "Jambo!")}</p><p className="mt-5 rounded-[20px] bg-canvas p-4 text-lg font-medium">{String(offlineScenario.payload.shoppingRequest ?? "")}</p><div className="mt-6 space-y-3">{items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-[16px] border border-line p-4"><div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted">KES {item.unitPriceKes} · needs {item.quantity}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => setOfflineBasket((basket) => ({ ...basket, [item.id]: Math.max(0, (basket[item.id] ?? 0) - 1) }))} className="rounded-lg border border-line px-3 py-1">−</button><span className="w-5 text-center">{offlineBasket[item.id] ?? 0}</span><button type="button" onClick={() => setOfflineBasket((basket) => ({ ...basket, [item.id]: Math.min(item.quantity + 2, (basket[item.id] ?? 0) + 1) }))} className="rounded-lg border border-line px-3 py-1">+</button></div></div>)}</div><button type="button" onClick={() => void completeOfflineScenario()} className="mt-6 rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Complete sale</button></section>;
  }

  if (!customer) {
    return <section className="rounded-[24px] border border-line bg-surface p-6"><p className="text-sm font-medium text-muted">Smart Duka session</p><h1 className="mt-1 text-2xl font-semibold">Ready to serve a customer?</h1><p className="mt-3 text-muted">Start a live demo session to receive a customer and stock your basket.</p><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void startOrContinue()} disabled={pending} className="mt-6 rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Loading…" : sessionId ? "Next customer" : "Start session"}</motion.button></section>;
  }

  return <section className="rounded-[24px] border border-line bg-surface p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-muted">Customer at the counter</p><h1 className="text-2xl font-semibold">{customer.name}</h1></div><span className="rounded-full border border-line px-3 py-2 text-sm font-medium">Basket: KES {basket?.total_kes ?? 0}</span></div><AnimatePresence mode="wait"><motion.div key={customer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: "easeOut" }}><p className="mt-2 text-sm text-muted">{customer.greeting}</p><p className="mt-5 rounded-[20px] bg-canvas p-4 text-lg font-medium">“{customer.request}”</p></motion.div></AnimatePresence><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{inventoryQuery.data?.map((product) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={product.id} onClick={() => addItemMutation.mutate({ itemId: product.id })} disabled={addItemMutation.isPending || Boolean(challenge)} className="rounded-[20px] border border-line bg-canvas p-4 text-left disabled:opacity-50"><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-muted">KES {product.price_kes} · {product.stock} left</p></motion.button>)}</div>{inventoryQuery.isLoading && <p className="mt-4 text-sm text-muted">Loading inventory…</p>}<div className="mt-6 rounded-[20px] bg-canvas p-4"><p className="font-medium">{basket?.lines.length ? basket.lines.map((line) => `${line.quantity} × ${line.item.name}`).join(", ") : "Add items to the basket."}</p>{basket?.lines.map((line) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={line.item.id} onClick={() => removeItemMutation.mutate({ itemId: line.item.id })} className="mr-2 mt-3 rounded-[14px] border border-line px-3 py-2 text-sm">Remove {line.item.name}</motion.button>)}</div>{challenge && <div className="mt-6 rounded-[20px] border border-line p-4"><p className="font-semibold">Math challenge</p><p className="mt-2">{challenge.prompt}</p><div className="mt-4 flex flex-wrap gap-3"><input value={answer} onChange={(event) => setAnswer(event.target.value)} inputMode="numeric" aria-label="Your answer" className="rounded-[14px] border border-line bg-white px-4 py-3" placeholder="Your answer" /><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => answerMutation.mutate()} disabled={!answer || answerMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">Submit answer</motion.button><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => hintMutation.mutate()} className="rounded-[14px] border border-line px-5 py-3 font-semibold">Need a hint</motion.button></div></div>}<div className="mt-6 flex flex-wrap justify-between gap-3 rounded-[20px] bg-line p-4"><p className="font-medium">{basket?.validation.is_valid ? "The basket matches the request." : "Match the shopping request to unlock checkout."}</p><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => checkoutMutation.mutate()} disabled={!basket?.validation.is_valid || checkoutMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{challenge ? "Complete checkout" : "Check basket"}</motion.button></div></section>;
}
