"use client";

import { motion } from "framer-motion";
import { useTTS } from "@/hooks/useTTS";

type AudioSpeakerButtonProps = {
  text: string;
  lang?: "en" | "sw";
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function AudioSpeakerButton({
  text,
  lang = "en",
  label,
  size = "md",
  className = "",
}: AudioSpeakerButtonProps) {
  const { play, isPlaying } = useTTS();

  const iconSizes = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={(e) => {
        e.stopPropagation();
        if (isPlaying) {
          stop();
        } else {
          play(text, lang);
        }
      }}
      title={`Listen: "${text}"`}
      aria-label={label ?? `Listen to ${text}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50 ${className}`}
    >
      <svg
        className={`${iconSizes[size]} ${isPlaying ? "animate-pulse text-accent" : "text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
      {label && <span>{label}</span>}
    </motion.button>
  );
}
