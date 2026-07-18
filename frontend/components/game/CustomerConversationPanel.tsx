"use client";

import { motion } from "framer-motion";

export type CustomerConversationMessage = {
  id: string;
  side: "incoming" | "outgoing";
  text: string;
};

type CustomerConversationPanelProps = {
  customerName: string;
  messages: CustomerConversationMessage[];
  isThinking?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function CustomerConversationPanel({
  customerName,
  messages,
  isThinking = false,
  actionLabel,
  onAction,
}: CustomerConversationPanelProps) {
  return (
    <aside className="rounded-[20px] border border-line bg-canvas p-4" aria-label={`Conversation with ${customerName}`}>
      <p className="mb-4 text-center text-xs font-semibold text-muted">Chat with {customerName}</p>
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1" role="log" aria-live="polite" aria-relevant="additions text">
        {messages.map((message) => <MessageBubble key={message.id} side={message.side}>{message.text}</MessageBubble>)}
        {isThinking && <TypingIndicator />}
      </div>
      {actionLabel && onAction && !isThinking && (
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onAction} className="mt-4 w-full rounded-[18px] bg-accent px-4 py-3 text-sm font-semibold text-white">
          {actionLabel}
        </motion.button>
      )}
    </aside>
  );
}

function MessageBubble({ side, children }: { side: CustomerConversationMessage["side"]; children: React.ReactNode }) {
  return <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`w-fit max-w-[90%] rounded-[18px] px-3 py-2 text-sm leading-relaxed ${side === "outgoing" ? "ml-auto bg-[#007AFF] text-white" : "bg-[#e5e5ea] text-[#1C1C1E] dark:bg-[#2C2C2E] dark:text-white"}`}>{children}</motion.p>;
}

function TypingIndicator() {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-fit gap-1 rounded-[18px] bg-[#e5e5ea] dark:bg-[#2C2C2E] px-3 py-3" aria-label="Customer is typing">{[0, 1, 2].map((dot) => <motion.span key={dot} animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }} className="size-1.5 rounded-full bg-[#8E8E93]" />)}</motion.div>;
}
