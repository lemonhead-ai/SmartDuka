"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { gameplayApi } from "@/features/gameplay/api";
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
        setChallenge(null);
        notify("success", result.feedback);
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
    const session = await startMutation.mutateAsync();
    setSessionId(session.session_id);
    nextCustomerMutation.mutate(session.session_id);
  };
  const pending = startMutation.isPending || nextCustomerMutation.isPending;

  if (!customer) {
    return <section className="rounded-[24px] border border-line bg-surface p-6"><p className="text-sm font-medium text-muted">Smart Duka session</p><h1 className="mt-1 text-2xl font-semibold">Ready to serve a customer?</h1><p className="mt-3 text-muted">Start a live demo session to receive a customer and stock your basket.</p><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void startOrContinue()} disabled={pending} className="mt-6 rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Loading…" : sessionId ? "Next customer" : "Start session"}</motion.button></section>;
  }

  return <section className="rounded-[24px] border border-line bg-surface p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-muted">Customer at the counter</p><h1 className="text-2xl font-semibold">{customer.name}</h1></div><span className="rounded-full border border-line px-3 py-2 text-sm font-medium">Basket: KES {basket?.total_kes ?? 0}</span></div><AnimatePresence mode="wait"><motion.div key={customer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: "easeOut" }}><p className="mt-2 text-sm text-muted">{customer.greeting}</p><p className="mt-5 rounded-[20px] bg-canvas p-4 text-lg font-medium">“{customer.request}”</p></motion.div></AnimatePresence><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{inventoryQuery.data?.map((product) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={product.id} onClick={() => addItemMutation.mutate({ itemId: product.id })} disabled={addItemMutation.isPending || Boolean(challenge)} className="rounded-[20px] border border-line bg-canvas p-4 text-left disabled:opacity-50"><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-muted">KES {product.price_kes} · {product.stock} left</p></motion.button>)}</div>{inventoryQuery.isLoading && <p className="mt-4 text-sm text-muted">Loading inventory…</p>}<div className="mt-6 rounded-[20px] bg-canvas p-4"><p className="font-medium">{basket?.lines.length ? basket.lines.map((line) => `${line.quantity} × ${line.item.name}`).join(", ") : "Add items to the basket."}</p>{basket?.lines.map((line) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={line.item.id} onClick={() => removeItemMutation.mutate({ itemId: line.item.id })} className="mr-2 mt-3 rounded-[14px] border border-line px-3 py-2 text-sm">Remove {line.item.name}</motion.button>)}</div>{challenge && <div className="mt-6 rounded-[20px] border border-line p-4"><p className="font-semibold">Math challenge</p><p className="mt-2">{challenge.prompt}</p><div className="mt-4 flex flex-wrap gap-3"><input value={answer} onChange={(event) => setAnswer(event.target.value)} inputMode="numeric" aria-label="Your answer" className="rounded-[14px] border border-line bg-white px-4 py-3" placeholder="Your answer" /><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => answerMutation.mutate()} disabled={!answer || answerMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">Submit answer</motion.button><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => hintMutation.mutate()} className="rounded-[14px] border border-line px-5 py-3 font-semibold">Need a hint</motion.button></div></div>}<div className="mt-6 flex flex-wrap justify-between gap-3 rounded-[20px] bg-line p-4"><p className="font-medium">{basket?.validation.is_valid ? "The basket matches the request." : "Match the shopping request to unlock checkout."}</p><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => checkoutMutation.mutate()} disabled={!basket?.validation.is_valid || checkoutMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{challenge ? "Complete checkout" : "Check basket"}</motion.button></div></section>;
}
