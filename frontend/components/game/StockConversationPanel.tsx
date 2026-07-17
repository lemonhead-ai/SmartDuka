"use client";

import { motion } from "framer-motion";

import type { Customer, StockOffer } from "@/features/gameplay/types";

type StockConversationPanelProps = {
  customer: Customer;
  offer: StockOffer;
  isThinking: boolean;
  onSend: () => void;
};

export function StockConversationPanel({
  customer,
  offer,
  isThinking,
  onSend,
}: StockConversationPanelProps) {
  const availabilityMessage = `I only have ${offer.available_quantity} ${offer.name.toLowerCase()} left. Would you like to take that amount instead?`;

  return (
    <section className="rounded-[24px] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Stock check</p>
          <h1 className="mt-1 text-2xl font-semibold">Let&apos;s ask {customer.name}</h1>
        </div>
        <span className="rounded-full border border-line px-3 py-2 text-sm font-medium">Customer chat</span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="rounded-[20px] bg-canvas p-5">
          <p className="text-sm font-medium text-muted">Order details</p>
          <p className="mt-3 text-lg font-semibold">{customer.request}</p>
          <div className="mt-5 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {offer.message}
          </div>
        </div>

        <aside className="rounded-[20px] border border-line bg-[#f5f5f7] p-4" aria-label={`Conversation with ${customer.name}`}>
          <p className="mb-4 text-center text-xs font-semibold text-muted">{customer.name}</p>
          <div className="space-y-3">
            <MessageBubble side="incoming">{customer.greeting}</MessageBubble>
            <MessageBubble side="incoming">{customer.request}</MessageBubble>
            {isThinking ? (
              <>
                <MessageBubble side="outgoing">{availabilityMessage}</MessageBubble>
                <TypingIndicator />
              </>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={onSend}
                className="w-full rounded-[18px] bg-accent px-4 py-3 text-sm font-semibold text-white"
              >
                Send availability update
              </motion.button>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function MessageBubble({ side, children }: { side: "incoming" | "outgoing"; children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-fit max-w-[90%] rounded-[18px] px-3 py-2 text-sm leading-relaxed ${side === "outgoing" ? "ml-auto bg-[#007AFF] text-white" : "bg-[#e5e5ea] text-ink"}`}
    >
      {children}
    </motion.p>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-fit gap-1 rounded-[18px] bg-[#e5e5ea] px-3 py-3" aria-label="Customer is typing">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }}
          className="size-1.5 rounded-full bg-muted"
        />
      ))}
    </motion.div>
  );
}
