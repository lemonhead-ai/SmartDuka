"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { LiteracyChallenge } from "@/features/gameplay/types";

type LiteracyMomentProps = {
  challenge: LiteracyChallenge;
  isSubmitting: boolean;
  onAnswer: (answer: string) => void;
};

// Vocabulary dictionary mapping English words to Swahili hints
const SWAHILI_HINTS: Record<string, string> = {
  juice: "juisi",
  milk: "maziwa",
  soap: "sabuni",
  bread: "mkate",
  sugar: "sukari",
  flour: "unga",
  tea: "chai",
  rice: "mchele",
  water: "maji",
  salt: "chumvi",
  oil: "mafuta",
  eggs: "mayai",
  biscuit: "biskuti",
  sweets: "pipi",
};

export function LiteracyMoment({ challenge, isSubmitting, onAnswer }: LiteracyMomentProps) {
  const [letters, setLetters] = useState<string[]>([]);
  const [showSwahiliHint, setShowSwahiliHint] = useState(false);

  const missingLetterCount = [...challenge.content].filter((character) => character === "_").length;
  const targetWordClean = challenge.content.replace(/_/g, "").trim().toLowerCase();
  const swahiliTranslation =
    SWAHILI_HINTS[targetWordClean] ||
    SWAHILI_HINTS[challenge.prompt.split(" ").at(-1)?.toLowerCase() ?? ""] ||
    null;

  useEffect(() => {
    setLetters([]);
    setShowSwahiliHint(false);
  }, [challenge.id]);

  if (challenge.complete) return null;

  if (!challenge.is_available) {
    return (
      <section className="mt-6 rounded-[28px] border border-line bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">A little shop word</p>
        <p className="mt-1 text-sm font-medium text-ink">
          Add the matching item to the basket, then Milo will help you spell it.
        </p>
      </section>
    );
  }

  const attempts = challenge.attempts ?? 0;

  return (
    <section
      className="mt-6 rounded-[32px] border border-line bg-surface p-5 sm:p-7 shadow-sm transition-all"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent border border-line">
            Reading Moment
          </span>
          {attempts > 0 && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-canvas px-2.5 py-1 rounded-full border border-line">
              Attempt {attempts + 1}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {swahiliTranslation && (
            <button
              type="button"
              onClick={() => setShowSwahiliHint((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-accent hover:bg-surface transition-colors"
            >
              <span>🌐</span>
              <span>{showSwahiliHint ? "Hide Swahili" : "Swahili Hint"}</span>
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-muted font-medium leading-relaxed">
        {challenge.prompt}
      </p>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p
          className={`font-black text-ink ${
            challenge.type === "sentence_reading"
              ? "whitespace-pre-line rounded-2xl bg-canvas border border-line p-4 text-sm sm:text-base leading-7"
              : "text-2xl sm:text-4xl tracking-wider"
          }`}
        >
          {challenge.content}
        </p>
      </div>

      {/* Swahili Translation Scaffolding Tooltip */}
      {showSwahiliHint && swahiliTranslation && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2.5 rounded-2xl bg-canvas border border-line p-3.5 text-xs sm:text-sm text-ink"
        >
          <span className="font-bold text-accent">🌐 Swahili Context:</span>
          <span>
            In Swahili, this product is called <strong>&ldquo;{swahiliTranslation}&rdquo;</strong>.
          </span>
        </motion.div>
      )}

      {/* 1st Wrong Pick: Visual Scaffolding Hint */}
      {attempts === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-2xl bg-canvas border border-line p-3.5 text-xs sm:text-sm text-ink flex items-center gap-2"
        >
          <span>
            💡 <strong>Visual Hint:</strong> Look for the shelf item matching the word{" "}
            <strong>&ldquo;{challenge.content.slice(0, 2)}&rdquo;</strong>...
          </span>
        </motion.div>
      )}

      {/* 2nd Wrong Pick: Reading Scaffolding Hint */}
      {attempts >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-2xl bg-canvas border border-line p-3.5 text-xs sm:text-sm text-ink flex flex-wrap items-center justify-between gap-2"
        >
          <div>
            <p className="font-bold">💡 Reading Tip:</p>
            <p className="text-xs text-muted mt-0.5">
              Read each letter carefully, then look for the shelf product that matches this word.
            </p>
          </div>
        </motion.div>
      )}

      {challenge.type === "word_reading" && (
        <p className="mt-4 text-xs sm:text-sm font-semibold text-muted">
          Choose the matching product from the shelf below.
        </p>
      )}

      {challenge.choices.length > 0 && (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3" role="group" aria-label="Answer choices">
          {challenge.choices.map((choice) => (
            <motion.button
              key={choice.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onAnswer(choice.id)}
              disabled={isSubmitting}
              className="rounded-2xl border border-line bg-canvas px-4 py-3 text-left text-xs sm:text-sm font-bold text-ink transition-all hover:border-accent hover:bg-surface disabled:opacity-50"
            >
              {choice.label}
            </motion.button>
          ))}
        </div>
      )}

      {challenge.type === "spelling" && (
        <div className="mt-4 space-y-3">
          <div
            className="flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-line bg-canvas px-3.5 py-2.5"
            aria-label="Selected letters"
          >
            {letters.length ? (
              letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="grid size-8 place-items-center rounded-xl bg-accent text-sm font-bold text-white dark:text-black shadow-sm"
                >
                  {letter}
                </span>
              ))
            ) : (
              <span className="text-xs sm:text-sm font-medium text-muted">
                Pick the missing letter{missingLetterCount > 1 ? "s" : ""}.
              </span>
            )}
            {letters.length > 0 && (
              <button
                type="button"
                onClick={() => setLetters((current) => current.slice(0, -1))}
                className="ml-auto text-xs font-bold text-muted hover:text-ink transition-colors underline"
              >
                Undo
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Letter tiles">
            {challenge.letter_options.map((letter) => (
              <motion.button
                key={letter}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  setLetters((current) =>
                    current.length < missingLetterCount ? [...current, letter] : current
                  )
                }
                disabled={isSubmitting || letters.length >= missingLetterCount}
                className="grid size-11 sm:size-12 place-items-center rounded-2xl border border-line bg-canvas text-base font-extrabold text-ink hover:border-accent hover:bg-surface disabled:opacity-40 transition-colors"
              >
                {letter.toUpperCase()}
              </motion.button>
            ))}
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onAnswer(letters.join(""))}
            disabled={isSubmitting || letters.length !== missingLetterCount}
            className="mt-3 rounded-full bg-ink px-7 py-3 text-xs sm:text-sm font-bold text-surface shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition-all"
          >
            Check word
          </motion.button>
        </div>
      )}
    </section>
  );
}
