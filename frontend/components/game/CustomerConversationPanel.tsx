"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Chat01Icon } from "hugeicons-react";

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
    <aside
      className="group/chat relative rounded-[32px] border border-line bg-canvas p-4 sm:p-5 flex flex-col h-full min-h-[480px] lg:min-h-[560px] justify-between shadow-xs transition-all"
      aria-label={`Conversation with ${customerName}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-line shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-accent animate-pulse" />
          <p className="text-xs font-bold text-ink">Chat with {customerName}</p>
        </div>
        <span className="text-[10px] font-bold text-muted bg-surface px-2.5 py-0.5 rounded-full border border-line">
          Customer
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="chat-scroll flex-1 space-y-3 overflow-y-auto pr-1 flex flex-col justify-start"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        onScroll={(event) => {
          const messagesInView = [
            ...event.currentTarget.querySelectorAll<HTMLElement>("[data-chat-message]"),
          ];
          const current = messagesInView.find(
            (message) => message.offsetTop + message.offsetHeight > event.currentTarget.scrollTop
          );
          if (current?.textContent) setScrollPreview(current.textContent);
        }}
      >
        {/* Centered 'Start a Chat' pill indicator in the middle */}
        <div className="flex items-center justify-center my-auto py-4 shrink-0">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1 text-[11px] font-bold text-muted shadow-xs">
            <Chat01Icon size={13} className="text-accent" />
            <span>Start a Chat</span>
          </div>
        </div>

        {messages.map((message) => (
          <MessageBubble key={message.id} side={message.side}>
            {message.text}
          </MessageBubble>
        ))}

        {isThinking && <TypingIndicator />}
      </div>

      {scrollPreview && (
        <p className="pointer-events-none absolute right-7 top-14 max-w-[70%] truncate rounded-full bg-ink px-3 py-1 text-xs text-white opacity-0 shadow-elevated transition-opacity group-hover/chat:opacity-100 z-10">
          {scrollPreview}
        </p>
      )}

      {/* Bottom Reply Form and Action Controls */}
      <div className="mt-3 shrink-0 space-y-2">
        {/* Quick tap response suggestion chips */}
        {onChatSubmit && !isThinking && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {["Karibu!", "Checking shelf...", "Habari!"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  playChatSound("outgoing");
                  onChatSubmit(chip);
                }}
                className="shrink-0 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted hover:text-ink hover:border-accent transition-all"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {onChatSubmit && (
          <form
            className="flex items-center"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const message = draft.trim();
              if (!message || isThinking) return;
              playChatSound("outgoing");
              onChatSubmit(message);
              setDraft("");
            }}
          >
            <label className="sr-only" htmlFor="customer-message">
              Reply to {customerName}
            </label>
            <div className="relative flex min-w-0 flex-1 items-center rounded-full border border-line bg-surface dark:bg-[#1e1e1f] p-1 pl-4 shadow-sm focus-within:border-accent transition-all">
              <input
                id="customer-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={isThinking}
                placeholder="Reply..."
                className="min-w-0 flex-1 bg-transparent border-0 p-0 text-xs sm:text-sm text-ink placeholder:text-muted outline-none focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                data-sound="none"
                disabled={isThinking || !draft.trim()}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white hover:bg-[#167FE5] disabled:opacity-40 transition-colors shadow-sm"
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
          <motion.button
            type="button"
            data-sound="none"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              playChatSound("outgoing");
              onAction();
            }}
            className="w-full rounded-2xl bg-accent px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:scale-[1.01] transition-transform"
          >
            {actionLabel}
          </motion.button>
        )}
      </div>
    </aside>
  );
}

function MessageBubble({
  side,
  children,
}: {
  side: CustomerConversationMessage["side"];
  children: React.ReactNode;
}) {
  return (
    <motion.div
      data-chat-message
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-1.5 ${side === "outgoing" ? "justify-end" : "justify-start"}`}
    >
      <p
        className={`w-fit max-w-[90%] rounded-[18px] px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
          side === "outgoing"
            ? "ml-auto bg-[#007AFF] text-white shadow-xs"
            : "bg-surface text-ink border border-line shadow-xs"
        }`}
      >
        {children}
      </p>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex w-fit gap-1 rounded-[18px] bg-surface border border-line px-3 py-2.5"
      aria-label="Customer is typing"
    >
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
