"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";

import { LiteracyMoment } from "@/components/game/LiteracyMoment";
import { ShoppingListPanel } from "@/components/game/ShoppingListPanel";
import { AudioSpeakerButton } from "@/components/ui/AudioSpeakerButton";
import {
  CustomerConversationPanel,
  type CustomerConversationMessage,
} from "@/components/game/CustomerConversationPanel";
import { printSaleReceipt } from "@/components/game/SaleReceipt";
import { Receipt3DCard } from "@/components/game/Receipt3DModal";
import { triggerSensoryFeedback } from "@/features/feedback/sensory-feedback";
import { useToastStore, type ToastKind } from "@/features/feedback/toast-store";
import { gameplayApi } from "@/features/gameplay/api";
import { addLocalBasketItem, removeLocalBasketItem } from "@/features/gameplay/basket";
import { useGameplaySessionStore } from "@/features/gameplay/store";
import type { ApiError, Basket, Checkout, SessionSummary } from "@/features/gameplay/types";

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
  const [completion, setCompletion] = useState<{ checkout: Checkout; summary: SessionSummary; basket: Basket; customerName: string } | null>(null);
  const [customerConversation, setCustomerConversation] = useState<CustomerConversationMessage[]>(() => {
    if (customer) {
      if (customer.chat_history && customer.chat_history.length > 0) {
        return customer.chat_history.map((msg, idx) => ({
          id: `hist-${idx}`,
          side: msg.sender === "shopkeeper" ? "outgoing" : "incoming",
          text: msg.message,
        }));
      }
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
    staleTime: 0,
  });
  const shopQuery = useQuery({ queryKey: ["shop"], queryFn: gameplayApi.shop });
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
    onError: async (error) => {
      const msg = errorMessage(error);
      if (msg.includes("Finish the current customer") || msg.includes("409")) {
        try {
          const session = await startMutation.mutateAsync();
          setSessionId(session.session_id);
          nextCustomerMutation.mutate(session.session_id);
          return;
        } catch {
          // fall through
        }
      }
      notify("error", msg);
    },
  });
  const startMutation = useMutation({
    mutationFn: gameplayApi.startSession,
    onError: (error) => notify("error", errorMessage(error)),
  });
  const selectLocalItem = (item: import("@/features/gameplay/types").InventoryItem) => {
    if (!customer) return;
    const currentLiteracy = useGameplaySessionStore.getState().literacyChallenge;
    const nextBasket = addLocalBasketItem(customer, basket, item, currentLiteracy);
    if (nextBasket === null) {
      notify("warning", `Only ${item.stock} ${item.name.toLowerCase()} are available.`);
      return;
    }
    const literacy = nextBasket.literacy_challenge;
    if (literacy?.type === "spelling" && literacy.target_item_id) {
      nextBasket.literacy_challenge = {
        ...literacy,
        is_available: nextBasket.lines.some((line) => line.item.id === literacy.target_item_id),
      };
    }
    showBasketFeedback(nextBasket);
  };
  const removeLocalItem = (itemId: string) => {
    if (customer) {
      const currentLiteracy = useGameplaySessionStore.getState().literacyChallenge;
      showBasketFeedback(removeLocalBasketItem(customer, basket, itemId, currentLiteracy));
    }
  };
  const literacyAnswerMutation = useMutation({
    mutationFn: ({ answer: literacyAnswer }: { answer: string; itemId?: string }) =>
      gameplayApi.answerLiteracyChallenge(sessionId ?? "", literacyAnswer, basket),
    onSuccess: (result, variables) => {
      setLiteracyChallenge(result.challenge);
      notify(result.is_correct ? "success" : "warning", result.feedback);
      if (result.is_correct) {
        void queryClient.invalidateQueries({ queryKey: ["player-progress"] });
        void queryClient.invalidateQueries({ queryKey: ["motivation"] });
        void queryClient.invalidateQueries({ queryKey: ["learning-summary"] });
      }
      if (result.is_correct && variables.itemId) {
        const selected = inventoryQuery.data?.find((item) => item.id === variables.itemId);
        if (selected) selectLocalItem(selected);
      }
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const checkoutMutation = useMutation({
    mutationFn: () => gameplayApi.checkout(sessionId ?? "", basket as Basket),
    onSuccess: async (result) => {
      if (result.challenge) {
        setChallenge(result.challenge);
        notify("info", `Money received: KES ${result.challenge.amount_paid_kes}. Find the change.`);
        return;
      }
      const summary = await gameplayApi.sessionSummary(sessionId ?? "");
      if (!basket) return;
      clearCurrentCustomer();
      setCompletion({ checkout: result, summary, basket, customerName: customer?.name ?? "Customer" });
      void queryClient.invalidateQueries({ queryKey: ["inventory", sessionId] });
      void queryClient.invalidateQueries({ queryKey: ["player-progress"] });
      void queryClient.invalidateQueries({ queryKey: ["motivation"] });
      void queryClient.invalidateQueries({ queryKey: ["learning-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["shop-ledger"] });
      notify("success", result.reward?.message ?? "Checkout complete!");
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
      setBasket(result.basket);
      setLiteracyChallenge(result.literacy_challenge ?? result.basket.literacy_challenge);
      setCustomer(result.customer);
      const history = result.customer.chat_history ?? [
        { sender: "customer" as const, message: result.customer.greeting },
      ];
      setCustomerConversation(history.map((msg, idx) => ({
        id: `hist-${idx}`,
        side: msg.sender === "shopkeeper" ? "outgoing" : "incoming",
        text: msg.message
      })));
      notify("success", `${result.customer.name}: ${result.customer.greeting}`);
    },
    onError: (error) => notify("error", errorMessage(error)),
  });
  const chatMutation = useMutation({
    mutationFn: (messageText: string) => gameplayApi.chat(sessionId ?? "", messageText),
    onMutate: (messageText) => {
      setCustomerConversation((current) => [...current, message("outgoing", messageText)]);
    },
    onSuccess: (result, variables) => {
      setCustomerConversation((current) => [...current, message("incoming", result.reply)]);
      if (customer) {
        setCustomer({
          ...customer,
          chat_history: [
            ...(customer.chat_history ?? []),
            { sender: "shopkeeper", message: variables },
            { sender: "customer", message: result.reply }
          ]
        });
      }
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

  const startOrContinue = async () => {
    try {
      if (!sessionId || !customer) {
        const session = await startMutation.mutateAsync();
        setSessionId(session.session_id);
        nextCustomerMutation.mutate(session.session_id);
        return;
      }
      nextCustomerMutation.mutate(sessionId);
    } catch {
      return;
    }
  };
  if (completion) {
    const reward = completion.checkout.reward;
    const mission = completion.summary.mission;
    const missionProgress = Math.min(100, Math.round((mission.progress / mission.target) * 100));
    const accuracy = completion.summary.questions_attempted
      ? Math.round((completion.summary.correct_answers / completion.summary.questions_attempted) * 100)
      : null;
    const rawMessage = reward?.message ?? "Wonderful work at the counter!";
    const rewardMessage = rawMessage.replace(/^Sale complete[:—–-]\s*/i, "").replace(/[—–]/g, ": ");

    return (
      <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-4xl rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        <header className="text-center">
          <span className="inline-grid size-12 place-items-center rounded-2xl bg-leaf/15 text-2xl" aria-hidden="true">✓</span>
          <p className="mt-3 text-sm font-semibold text-muted">Sale complete</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{rewardMessage}</h1>
        </header>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
          {/* Live Interactive 3D WebGL Receipt Canvas */}
          <Receipt3DCard
            shopName={shopQuery.data?.name ?? "Smart Duka"}
            customerName={completion.customerName}
            basket={completion.basket}
            reward={reward}
            className="h-[480px] w-full shadow-md"
          />

          {/* Mission, Session Summary & 2x2 Awarding Stat Cards */}
          <div className="space-y-4">
            <article className="rounded-[20px] bg-canvas p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{mission.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {mission.completed ? "Mission complete. Brilliant work!" : `${mission.target - mission.progress} more to finish your mission.`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-accent">{mission.progress}/{mission.target}</span>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${missionProgress}%` }} />
              </div>
            </article>

            <article className="rounded-[20px] bg-canvas p-5">
              <p className="text-sm font-semibold">Session so far</p>
              <p className="mt-2 text-sm text-muted">
                {completion.summary.customers_served} customer{completion.summary.customers_served === 1 ? "" : "s"} helped
                {accuracy !== null ? ` · ${accuracy}% maths accuracy` : ""}
              </p>
              {completion.summary.achievements.length > 0 && (
                <p className="mt-2 text-sm font-medium text-leaf">Unlocked: {completion.summary.achievements.at(-1)}</p>
              )}
            </article>

            {/* 2x2 Grid of 4 Awarding Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Coins earned" value={reward?.coins ?? 0} prefix="+" />
              <Stat label="XP earned" value={reward?.xp ?? 0} prefix="+" />
              <Stat label="Stars earned" value={reward?.stars ?? 0} prefix="+" />
              <Stat label="Items sold" value={completion.basket.lines.reduce((sum, line) => sum + line.quantity, 0)} prefix="+" />
            </div>

            {/* Action Buttons directly below the 4 stat cards */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button 
                type="button" 
                onClick={() => printSaleReceipt({ shopName: shopQuery.data?.name ?? "Smart Duka", customerName: completion.customerName, basket: completion.basket, reward })} 
                className="flex-1 min-w-[130px] rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canvas transition-transform hover:scale-[1.02] text-center"
              >
                Print receipt
              </button>
              <motion.button 
                type="button" 
                whileTap={{ scale: 0.97 }} 
                onClick={() => { setCompletion(null); if (sessionId) nextCustomerMutation.mutate(sessionId); }} 
                className="flex-1 min-w-[150px] rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] transition-transform text-center"
              >
                Next customer
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  if (customer?.stock_offer?.status === "pending") {
    return (
      <section className="rounded-[24px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted">Customer at the counter</p>
            <h1 className="text-2xl font-semibold">{customer.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line px-3 py-2 text-sm font-medium">Stock Negotiation</span>
          </div>
        </div>
        
        <div className="mt-6 space-y-6">
          <ShoppingListPanel customer={customer} basket={basket} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-6">
            <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <h3 className="font-semibold text-base mb-2">Item Out of Stock</h3>
              <p className="text-sm leading-relaxed">{customer.stock_offer.message}</p>
            </div>
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <CustomerConversationPanel
              customerName={customer.name}
              messages={customerConversation}
              onChatSubmit={(message) => chatMutation.mutate(message)}
              isThinking={chatMutation.isPending || stockOfferMutation.isPending}
              actionLabel="Send availability update"
              onAction={() => stockOfferMutation.mutate()}
            />
          </div>
          </div>
        </div>
      </section>
    );
  }

  if (!customer) {
    const pending = startMutation.isPending || nextCustomerMutation.isPending;
    return <section className="rounded-[24px] border border-line bg-surface p-6" aria-busy={pending}><p className="text-sm font-medium text-muted">Smart Duka session</p><h1 className="mt-1 text-2xl font-semibold">Ready to serve a customer?</h1><p className="mt-3 text-muted">Start a live demo session to receive a customer and stock your basket.</p><div className="mt-6 flex flex-wrap gap-3"><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => void startOrContinue()} disabled={pending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Loading…" : sessionId ? "Next customer" : "Start session"}</motion.button><Link href="/shop?tab=stock" className="rounded-[14px] border border-line px-5 py-3 font-semibold">Manage stock</Link></div></section>;
  }

  const literacyNeedsAttention = Boolean(literacyChallenge && !literacyChallenge.complete && literacyChallenge.is_available);
  const answerLiteracy = (answerValue: string) => literacyAnswerMutation.mutate({ answer: answerValue });

  return (
    <section className="rounded-[36px] border border-line bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-muted">Customer at the counter</p><h1 className="text-2xl font-semibold">{customer.name}</h1></div><div className="flex items-center gap-2"><Link href="/shop?tab=stock" className="rounded-full border border-line px-3 py-2 text-sm font-semibold">Restock shop</Link><span className="rounded-full border border-line px-3 py-2 text-sm font-medium">Basket: KES {basket?.total_kes ?? 0}</span></div></div>
      
      <div className="mt-6 space-y-6">
        <ShoppingListPanel customer={customer} basket={basket} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* Left Column: Shelves, Basket, Checkout */}
        <div className="space-y-6">
          {literacyChallenge && literacyChallenge.type !== "spelling" && <LiteracyMoment challenge={literacyChallenge} isSubmitting={literacyAnswerMutation.isPending} onAnswer={answerLiteracy} />}
          
          <div className="flex items-end justify-between gap-3"><div><h2 className="font-bold">Available items</h2><p className="mt-1 text-sm text-muted">Use the shopping list above to fill the basket.</p></div><span className="text-sm font-semibold text-muted">Pick items</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {inventoryQuery.data?.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02 }}
                className="relative flex flex-col justify-between rounded-[28px] border border-line bg-canvas p-4"
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-ink leading-tight">{product.name}</p>
                  <AudioSpeakerButton text={`${product.name}, ${product.price_kes} Shillings`} size="sm" className="shrink-0" />
                </div>
                <p className="mt-2 text-xs font-medium text-muted">
                  KES {product.price_kes} · {product.stock} left
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    literacyChallenge?.type === "word_reading" && !literacyChallenge.complete
                      ? literacyAnswerMutation.mutate({ answer: product.id, itemId: product.id })
                      : selectLocalItem(product)
                  }
                  disabled={literacyAnswerMutation.isPending || Boolean(challenge)}
                  className="mt-3 w-full rounded-full bg-surface border border-line py-2 text-xs font-semibold text-ink hover:border-accent hover:text-accent disabled:opacity-50 transition-colors"
                >
                  + Add to basket
                </motion.button>
              </motion.div>
            ))}
          </div>
          {inventoryQuery.isLoading && <p className="text-sm text-muted" aria-live="polite">Loading inventory…</p>}
          
          <div className="rounded-[20px] bg-canvas p-4"><p className="font-medium">{basket?.lines.length ? basket.lines.map((line) => `${line.quantity} × ${line.item.name}`).join(", ") : "Add items to the basket."}</p>{basket?.lines.map((line) => <motion.button type="button" whileTap={{ scale: 0.97 }} key={line.item.id} onClick={() => removeLocalItem(line.item.id)} className="mr-2 mt-3 rounded-[14px] border border-line px-3 py-2 text-sm">Remove {line.item.name}</motion.button>)}</div>
          
          {literacyChallenge?.type === "spelling" && <LiteracyMoment challenge={literacyChallenge} isSubmitting={literacyAnswerMutation.isPending} onAnswer={answerLiteracy} />}
          
          {challenge && <div className="rounded-[20px] border border-line p-4"><p className="font-semibold">Math challenge</p><p className="mt-2">{challenge.prompt}</p><div className="mt-4 flex flex-wrap gap-3"><input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && answer && !answerMutation.isPending) answerMutation.mutate(); }} inputMode="numeric" aria-label="Your answer" className="rounded-[14px] border border-line bg-white px-4 py-3" placeholder="Your answer" /><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => answerMutation.mutate()} disabled={!answer || answerMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">Submit answer</motion.button><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => hintMutation.mutate()} disabled={hintMutation.isPending} className="rounded-[14px] border border-line px-5 py-3 font-semibold disabled:opacity-50">Need a hint</motion.button></div></div>}
          
          <div className="flex flex-wrap justify-between gap-3 rounded-[20px] bg-line p-4"><p className="font-medium">{literacyNeedsAttention ? "Help with the customer's reading moment to unlock checkout." : basket?.validation.is_valid ? "The basket matches the request." : "Match the shopping request to unlock checkout."}</p><motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => checkoutMutation.mutate()} disabled={!basket?.validation.is_valid || literacyNeedsAttention || checkoutMutation.isPending} className="rounded-[14px] bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{challenge ? "Complete checkout" : "Check basket"}</motion.button></div>
        </div>

        {/* Chat remains visible beside the shelf on desktop and follows it on mobile. */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <CustomerConversationPanel customerName={customer.name} messages={customerConversation} onChatSubmit={(message) => chatMutation.mutate(message)} isThinking={chatMutation.isPending} />
        </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, prefix = "" }: { label: string; value: number; prefix?: string }) {
  return <div className="rounded-[16px] bg-canvas p-3 text-center"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-xl font-semibold">{prefix}{value}</p></div>;
}
