"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";

import { LiteracyMoment } from "@/components/game/LiteracyMoment";
import {
  CustomerConversationPanel,
  type CustomerConversationMessage,
} from "@/components/game/CustomerConversationPanel";
import { triggerSensoryFeedback } from "@/features/feedback/sensory-feedback";
import { useToastStore, type ToastKind } from "@/features/feedback/toast-store";
import { gameplayApi } from "@/features/gameplay/api";
import { useGameplaySessionStore } from "@/features/gameplay/store";
import type { ApiError, Basket, Checkout, SessionSummary } from "@/features/gameplay/types";
import {
  OfflineSyncManager,
  completeScenario,
  getOfflineMeta,
  getPlayableScenarios,
  queueGameEvent,
} from "@/features/offline";
import type { CachedScenario } from "@/features/offline";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "object" && error !== null && "detail" in error
    ? (error as ApiError).detail
    : "The Smart Duka API is unavailable. Start the backend, then try again.";
}

export function ShopCounter() {
  const {
    sessionId,
    setSessionId,
    customer,
    basket,
    challenge,
    literacyChallenge,
    setCustomer,
    setBasket,
    setChallenge,
    setLiteracyChallenge,
    clearCurrentCustomer,
  } = useGameplaySessionStore();
  const showToast = useToastStore((state) => state.showToast);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState("");
  const [completion, setCompletion] = useState<{ checkout: Checkout; summary: SessionSummary } | null>(null);
  const [offlineScenario, setOfflineScenario] = useState<CachedScenario | null>(null);
  const [offlineBasket, setOfflineBasket] = useState<Record<string, number>>({});
  const [customerConversation, setCustomerConversation] = useState<CustomerConversationMessage[]>(() => {
    if (customer) {
      return [
        { id: "init-greet", side: "incoming", text: customer.greeting },
      ];
    }
    return [];
  });
  const customerRevision = useRef(customer?.request_version ?? 0);

  const notify = (kind: ToastKind, message: string) => {
    triggerSensoryFeedback(kind);
    showToast(kind, message);
  };
  const message = (side: CustomerConversationMessage["side"], text: string): CustomerConversationMessage => ({ id: crypto.randomUUID(), side, text });
  const showBasketFeedback = (nextBasket: Basket) => {
    setBasket(nextBasket);
    setLiteracyChallenge(nextBasket.literacy_challenge);
    notify(nextBasket.validation.is_valid ? "success" : "warning", nextBasket.validation.tutor_feedback);
  };

  const inventoryQuery = useQuery({
    queryKey: ["inventory", sessionId],
    queryFn: () => gameplayApi.inventory(sessionId ?? ""),
    enabled: Boolean(sessionId && customer),
  });
  const nextCustomerMutation = useMutation({
    mutationFn: gameplayApi.nextCustomer,
    onSuccess: (result) => {
      customerRevision.current = result.customer.request_version;
      setCustomer(result.customer);
      setBasket(result.basket);
      setChallenge(null);
      setLiteracyChallenge(result.literacy_challenge ?? result.basket.literacy_challenge);
      setCompletion(null);
      setAnswer("");
      setCustomerConversation([
        message("incoming", result.customer.greeting),
      ]);
      notify("info", `${result.customer.name} is ready at the counter.`);
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const startMutation = useMutation({
    mutationFn: gameplayApi.startSession,
    onError: (error) => notify("error", errorMessage(error)),
  });
  const addItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string; revision: number }) => gameplayApi.addBasketItem(sessionId ?? "", itemId),
    onSuccess: (result, variables) => {
      if (variables.revision === customerRevision.current && result.request_version === variables.revision) showBasketFeedback(result);
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const removeItemMutation = useMutation({
    mutationFn: ({ itemId }: { itemId: string; revision: number }) => gameplayApi.removeBasketItem(sessionId ?? "", itemId),
    onSuccess: (result, variables) => {
      if (variables.revision === customerRevision.current && result.request_version === variables.revision) showBasketFeedback(result);
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const literacyAnswerMutation = useMutation({
    mutationFn: ({ answer: literacyAnswer }: { answer: string; itemId?: string }) =>
      gameplayApi.answerLiteracyChallenge(sessionId ?? "", literacyAnswer),
    onSuccess: (result, variables) => {
      setLiteracyChallenge(result.challenge);
      notify(result.is_correct ? "success" : "warning", result.feedback);
      if (result.is_correct) {
        void queryClient.invalidateQueries({ queryKey: ["player-progress"] });
        void queryClient.invalidateQueries({ queryKey: ["motivation"] });
        void queryClient.invalidateQueries({ queryKey: ["learning-summary"] });
      }
      if (result.is_correct && variables.itemId) addItemMutation.mutate({ itemId: variables.itemId, revision: customerRevision.current });
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const checkoutMutation = useMutation({
    mutationFn: () => gameplayApi.checkout(sessionId ?? ""),
    onSuccess: async (result) => {
      if (result.challenge) {
        setChallenge(result.challenge);
        notify("info", `Money received: KES ${result.challenge.amount_paid_kes}. Find the change.`);
        return;
      }
      const summary = await gameplayApi.sessionSummary(sessionId ?? "");
      clearCurrentCustomer();
      setCompletion({ checkout: result, summary });
      void queryClient.invalidateQueries({ queryKey: ["inventory", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["player-progress"] });
      void queryClient.invalidateQueries({ queryKey: ["motivation"] });
      void queryClient.invalidateQueries({ queryKey: ["learning-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["shop-ledger"] });
      notify("success", result.reward?.message ?? "Checkout complete!");
      void queueGameEvent("transaction_completed", {
        sessionId,
        customerId: customer?.id,
        totalKes: basket?.total_kes ?? 0,
        source: "live",
      })
        .then(() => new OfflineSyncManager().sync())
        .catch(() => undefined);
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const hintMutation = useMutation({
    mutationFn: () => gameplayApi.requestHint(sessionId ?? ""),
    onSuccess: (result) => notify("info", `${result.hint} ${result.encouragement}`),
    onError: (error) => notify("error", errorMessage(error)),
  });
  const stockOfferMutation = useMutation({
    mutationFn: () => gameplayApi.resolveStockOffer(sessionId ?? ""),
    onMutate: () => {
      dismissToast();
      if (customer?.stock_offer) {
        setCustomerConversation((current) => [
          ...current,
          message("outgoing", `I only have ${customer.stock_offer?.available_quantity} ${customer.stock_offer?.name.toLowerCase()} left. Would you like to take that amount instead?`),
        ]);
      }
    },
    onSuccess: (result) => {
      customerRevision.current = result.customer.request_version;
      setCustomer(result.customer);
      setBasket(result.basket);
      setLiteracyChallenge(result.literacy_challenge ?? result.basket.literacy_challenge);
      setCustomerConversation((current) => [
        ...current,
        message("incoming", result.customer.greeting),
      ]);
      notify("success", `${result.customer.name}: ${result.customer.greeting}`);
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const chatMutation = useMutation({
    mutationFn: (messageText: string) => gameplayApi.chat(sessionId ?? "", messageText),
    onMutate: (messageText) => {
      setCustomerConversation((current) => [...current, message("outgoing", messageText)]);
    },
    onSuccess: (result) => {
      setCustomerConversation((current) => [...current, message("incoming", result.reply)]);
      if (result.sentiment === "happy") notify("success", "The customer seems happy with that response!");
    },
    onError: (error) => notify("error", errorMessage(error)),
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
    onError: (error) => notify("error", errorMessage(error)),
  });

  const loadOfflineScenario = async () => {
    const childId = await getOfflineMeta<string>("active-child-id");
    if (!childId) return;
    const [scenario] = await getPlayableScenarios(childId);
    if (!scenario) return;
    setOfflineScenario(scenario);
    setOfflineBasket({});
  };
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
  const completeOfflineScenario = async () => {
    if (!offlineScenario) return;
    const items = (offlineScenario.payload.items ?? []) as { id: string; quantity: number }[];
    const matches = items.length > 0 && items.every((item) => offlineBasket[item.id] === item.quantity);
    if (!matches) {
      const tutor = await getOfflineMeta<{ hint: string; encouragement: string }>("tutor-guidance");
      notify("warning", tutor ? `${tutor.hint} ${tutor.encouragement}` : "Match the customer's list before completing the sale.");
      return;
    }
    await completeScenario(offlineScenario.id);
    await queueGameEvent("transaction_completed", { scenarioId: offlineScenario.id, correct: true, source: "offline" });
    void new OfflineSyncManager().sync().catch(() => undefined);
    notify("success", "Sale saved on this device. New adventures will sync when you are online.");
    setOfflineScenario(null);
    await loadOfflineScenario();
  };

  if (offlineScenario) {
    const items = (offlineScenario.payload.items ?? []) as { id: string; name: string; quantity: number; unitPriceKes: number }[];
    return (
      <section className="rounded-[24px] border border-line bg-surface p-6">
        <p className="text-sm font-medium text-muted">Offline adventure</p>
        <h1 className="mt-1 text-2xl font-semibold">{offlineScenario.customerName} is at the counter</h1>
        <p className="mt-3 text-muted">{String(offlineScenario.payload.greeting ?? "Jambo!")}</p>
        <p className="mt-5 rounded-[20px] bg-canvas p-4 text-lg font-medium">{String(offlineScenario.payload.shoppingRequest ?? "")}</p>
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-[16px] border border-line p-4">
              <div><p className="font-semibold">{item.name}</p><p className="text-sm text-muted">KES {item.unitPriceKes} · needs {item.quantity}</p></div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setOfflineBasket((current) => ({ ...current, [item.id]: Math.max(0, (current[item.id] ?? 0) - 1) }))} className="rounded-lg border border-line px-3 py-1">−</button>
                <span className="w-5 text-center">{offlineBasket[item.id] ?? 0}</span>
                <button type="button" onClick={() => setOfflineBasket((current) => ({ ...current, [item.id]: Math.min(item.quantity + 2, (current[item.id] ?? 0) + 1) }))} className="rounded-lg border border-line px-3 py-1">+</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => void completeOfflineScenario()} className="mt-6 rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Complete sale</button>
      </section>
    );
  }

  if (completion) {
    return (
      <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[24px] border border-line bg-surface p-6 text-center">
        <p className="text-sm font-medium text-muted">Sale complete</p>
        <h1 className="mt-1 text-2xl font-semibold">{completion.checkout.reward?.message ?? "Wonderful work at the counter!"}</h1>
        <div className="mt-6 grid grid-cols-3 gap-3"><Stat label="Coins" value={completion.summary.coins_earned} /><Stat label="XP" value={completion.summary.xp_earned} /><Stat label="Stars" value={completion.summary.stars_earned} /></div>
        <p className="mt-5 text-muted">Mission: {completion.summary.mission.title} ({completion.summary.mission.progress}/{completion.summary.mission.target})</p>
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => { setCompletion(null); if (sessionId) nextCustomerMutation.mutate(sessionId); }} className="mt-6 rounded-[14px] bg-ink px-5 py-3 font-semibold text-white">Serve next customer</motion.button>
      </motion.section>
    );
  }

  if (customer?.stock_offer?.status === "pending") {
    return (
      <section className="rounded-[24px] border border-line bg-surface p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-[20px] bg-canvas p-5">
            <p className="text-xs font-semibold text-muted mb-2">Shopping List</p>
            <ul className="space-y-1">
              {customer.requested_items.map((item) => (
                <li key={item.item_id} className="text-sm font-medium text-ink">
                  • {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{customer.stock_offer.message}</div>
          </div>
          <CustomerConversationPanel customerName={customer.name} messages={customerConversation} isThinking={stockOfferMutation.isPending} actionLabel="Send availability update" onAction={() => stockOfferMutation.mutate()} />
        </div>
      </section>
    );
  }

  if (!customer) {
    const pending = startMutation.isPending || nextCustomerMutation.isPending;
    return <section className="rounded-[24px] border border-line bg-surface p-6" aria-busy={pending}><p className="text-sm font-medium text-muted">Smart Duka session</p><h1 className="mt-1 text-2xl font-semibold">Ready to serve a customer?</h1><p className="mt-3 text-muted">Start a live demo session to receive a customer and stock your basket.</p><div className="mt-6 flex flex-wrap gap-3"><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void startOrContinue()} disabled={pending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Loading…" : sessionId ? "Next customer" : "Start session"}</motion.button><Link href="/dashboard#stock-room" className="rounded-[14px] border border-line px-5 py-3 font-semibold">Manage stock</Link></div></section>;
  }

  const literacyNeedsAttention = Boolean(literacyChallenge && !literacyChallenge.complete && literacyChallenge.is_available);
  const answerLiteracy = (answerValue: string) => literacyAnswerMutation.mutate({ answer: answerValue });

  return (
    <section className="rounded-[24px] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-muted">Customer at the counter</p><h1 className="text-2xl font-semibold">{customer.name}</h1></div><div className="flex items-center gap-2"><Link href="/dashboard#stock-room" className="rounded-full border border-line px-3 py-2 text-sm font-semibold">Restock shop</Link><span className="rounded-full border border-line px-3 py-2 text-sm font-medium">Basket: KES {basket?.total_kes ?? 0}</span></div></div>
      
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Left Column: Shopping List, Shelves, Basket, Checkout */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="rounded-[20px] bg-canvas p-4"
            >
              <p className="text-xs font-semibold text-muted mb-2">Shopping List</p>
              <ul className="space-y-2">
                {customer.requested_items.map((item) => (
                  <li key={item.item_id} className="text-sm font-medium text-ink">
                    • {item.quantity} × {item.name}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {literacyChallenge && literacyChallenge.type !== "spelling" && <LiteracyMoment challenge={literacyChallenge} isSubmitting={literacyAnswerMutation.isPending} onAnswer={answerLiteracy} />}
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {inventoryQuery.data?.map((product) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={product.id} onClick={() => literacyChallenge?.type === "word_reading" && !literacyChallenge.complete ? literacyAnswerMutation.mutate({ answer: product.id, itemId: product.id }) : addItemMutation.mutate({ itemId: product.id, revision: customerRevision.current })} disabled={addItemMutation.isPending || literacyAnswerMutation.isPending || Boolean(challenge)} className="rounded-[20px] border border-line bg-canvas p-4 text-left disabled:opacity-50"><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-muted">KES {product.price_kes} · {product.stock} left</p></motion.button>)}
          </div>
          {inventoryQuery.isLoading && <p className="text-sm text-muted" aria-live="polite">Loading inventory…</p>}
          
          <div className="rounded-[20px] bg-canvas p-4"><p className="font-medium">{basket?.lines.length ? basket.lines.map((line) => `${line.quantity} × ${line.item.name}`).join(", ") : "Add items to the basket."}</p>{basket?.lines.map((line) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={line.item.id} onClick={() => removeItemMutation.mutate({ itemId: line.item.id, revision: customerRevision.current })} className="mr-2 mt-3 rounded-[14px] border border-line px-3 py-2 text-sm">Remove {line.item.name}</motion.button>)}</div>
          
          {literacyChallenge?.type === "spelling" && <LiteracyMoment challenge={literacyChallenge} isSubmitting={literacyAnswerMutation.isPending} onAnswer={answerLiteracy} />}
          
          {challenge && <div className="rounded-[20px] border border-line p-4"><p className="font-semibold">Math challenge</p><p className="mt-2">{challenge.prompt}</p><div className="mt-4 flex flex-wrap gap-3"><input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && answer && !answerMutation.isPending) answerMutation.mutate(); }} inputMode="numeric" aria-label="Your answer" className="rounded-[14px] border border-line bg-white px-4 py-3" placeholder="Your answer" /><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => answerMutation.mutate()} disabled={!answer || answerMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">Submit answer</motion.button><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => hintMutation.mutate()} disabled={hintMutation.isPending} className="rounded-[14px] border border-line px-5 py-3 font-semibold disabled:opacity-50">Need a hint</motion.button></div></div>}
          
          <div className="flex flex-wrap justify-between gap-3 rounded-[20px] bg-line p-4"><p className="font-medium">{literacyNeedsAttention ? "Help with the customer's reading moment to unlock checkout." : basket?.validation.is_valid ? "The basket matches the request." : "Match the shopping request to unlock checkout."}</p><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => checkoutMutation.mutate()} disabled={!basket?.validation.is_valid || literacyNeedsAttention || checkoutMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{challenge ? "Complete checkout" : "Check basket"}</motion.button></div>
        </div>

        {/* Right Column: Larger Chat Area */}
        <div>
          <CustomerConversationPanel customerName={customer.name} messages={customerConversation} onChatSubmit={(message) => chatMutation.mutate(message)} isThinking={chatMutation.isPending} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-[16px] bg-canvas p-3"><p className="text-sm text-muted">{label}</p><p className="text-xl font-semibold">{value}</p></div>;
}
