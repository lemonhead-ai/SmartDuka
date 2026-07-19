"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { playChatSound } from "@/features/feedback/sensory-feedback";

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
  onChatSubmit?: (message: string) => void;
};

export function CustomerConversationPanel({
  customerName,
  messages,
  isThinking = false,
  actionLabel,
  onAction,
  onChatSubmit,
}: CustomerConversationPanelProps) {
  const previousMessageCount = useRef(messages.length);
  const [scrollPreview, setScrollPreview] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const addedMessages = messages.slice(previousMessageCount.current);
    if (previousMessageCount.current > 0 && addedMessages.some((message) => message.side === "incoming")) {
      playChatSound("incoming");
    }
    previousMessageCount.current = messages.length;
  }, [messages]);

  return (
    <aside className="group/chat relative rounded-[20px] border border-line bg-canvas p-4" aria-label={`Conversation with ${customerName}`}>
      <p className="mb-4 text-center text-xs font-semibold text-muted">Chat with {customerName}</p>
      <div
        className="chat-scroll max-h-72 space-y-3 overflow-y-auto pr-2"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        onScroll={(event) => {
          const messagesInView = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-chat-message]")];
          const current = messagesInView.find((message) => message.offsetTop + message.offsetHeight > event.currentTarget.scrollTop);
          if (current?.textContent) setScrollPreview(current.textContent);
        }}
      >
        {messages.map((message) => <MessageBubble key={message.id} side={message.side}>{message.text}</MessageBubble>)}
        {isThinking && <TypingIndicator />}
      </div>
      {scrollPreview && <p className="pointer-events-none absolute right-7 top-12 max-w-[70%] truncate rounded-full bg-ink px-3 py-1 text-xs text-white opacity-0 shadow-elevated transition-opacity group-hover/chat:opacity-100">{scrollPreview}</p>}
      {onChatSubmit && (
        <form
          className="mt-4 flex items-center"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const message = draft.trim();
            if (!message || isThinking) return;
            playChatSound("outgoing");
            onChatSubmit(message);
            setDraft("");
          }}
        >
          <label className="sr-only" htmlFor="customer-message">Reply to {customerName}</label>
          <div className="relative flex min-w-0 flex-1 items-center rounded-full border border-line bg-surface dark:bg-[#1e1e1f] dark:border-zinc-800 p-1 pl-4 shadow-sm focus-within:border-accent">
            <input
              id="customer-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isThinking}
              placeholder="Reply"
              className="min-w-0 flex-1 bg-transparent border-0 p-0 text-sm text-ink dark:text-white placeholder:text-muted outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />
            <button
              type="submit"
              data-sound="none"
              disabled={isThinking || !draft.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white hover:bg-[#167FE5] disabled:opacity-40 transition-colors"
              aria-label="Send message"
            >
              <svg className="size-4 stroke-[3px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </form>
      )}
      {actionLabel && onAction && !isThinking && (
        <motion.button type="button" data-sound="none" whileTap={{ scale: 0.97 }} onClick={() => { playChatSound("outgoing"); onAction(); }} className="mt-4 w-full rounded-[18px] bg-accent px-4 py-3 text-sm font-semibold text-white">
          {actionLabel}
        </motion.button>
      )}
    </aside>
  );
}

function MessageBubble({ side, children }: { side: CustomerConversationMessage["side"]; children: React.ReactNode }) {
  return <motion.p data-chat-message initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`w-fit max-w-[90%] rounded-[18px] px-3 py-2 text-sm leading-relaxed ${side === "outgoing" ? "ml-auto bg-[#007AFF] text-white" : "bg-[#e5e5ea] text-[#1c1c1e] dark:bg-[#2c2c2e] dark:text-white"}`}>{children}</motion.p>;
}

function TypingIndicator() {
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-fit gap-1 rounded-[18px] bg-[#e5e5ea] px-3 py-3 dark:bg-[#2c2c2e]" aria-label="Customer is typing">{[0, 1, 2].map((dot) => <motion.span key={dot} animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }} className="size-1.5 rounded-full bg-muted" />)}</motion.div>;
}
