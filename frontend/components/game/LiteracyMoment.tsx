"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { LiteracyChallenge } from "@/features/gameplay/types";

type LiteracyMomentProps = {
  challenge: LiteracyChallenge;
  isSubmitting: boolean;
  onAnswer: (answer: string) => void;
};

export function LiteracyMoment({ challenge, isSubmitting, onAnswer }: LiteracyMomentProps) {
  const [letters, setLetters] = useState<string[]>([]);
  const missingLetterCount = [...challenge.content].filter((character) => character === "_").length;

  useEffect(() => {
    setLetters([]);
  }, [challenge.id]);

  if (challenge.complete) return null;

  if (!challenge.is_available) {
    return (
      <section className="mt-6 rounded-[20px] border border-line bg-canvas p-4">
        <p className="text-sm font-semibold text-muted">A little shop word</p>
        <p className="mt-1 font-medium">Add the matching item to the basket, then Milo will help you spell it.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-[20px] border border-accent/20 bg-green-50 p-4" aria-live="polite">
      <p className="text-sm font-semibold text-accent">Customer conversation</p>
      <p className="mt-1 text-sm text-muted">{challenge.prompt}</p>
      <p className={`mt-4 font-semibold text-ink ${challenge.type === "sentence_reading" ? "whitespace-pre-line rounded-2xl bg-surface p-4 text-base leading-7" : "text-2xl"}`}>
        {challenge.content}
      </p>

      {challenge.type === "word_reading" && (
        <p className="mt-4 text-sm font-medium text-muted">Choose the matching product from the shelf below.</p>
      )}

      {challenge.choices.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="Answer choices">
          {challenge.choices.map((choice) => (
            <motion.button
              key={choice.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onAnswer(choice.id)}
              disabled={isSubmitting}
              className="rounded-[14px] border border-line bg-surface px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:border-accent disabled:opacity-50"
            >
              {choice.label}
            </motion.button>
          ))}
        </div>
      )}

      {challenge.type === "spelling" && (
        <div className="mt-4">
          <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-2xl bg-surface px-3 py-2" aria-label="Selected letters">
            {letters.length ? letters.map((letter, index) => <span key={`${letter}-${index}`} className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-white">{letter}</span>) : <span className="text-sm text-muted">Pick the missing letter{missingLetterCount > 1 ? "s" : ""}.</span>}
            {letters.length > 0 && <button type="button" onClick={() => setLetters((current) => current.slice(0, -1))} className="ml-auto text-sm font-semibold text-muted underline">Undo</button>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Letter tiles">
            {challenge.letter_options.map((letter) => (
              <motion.button
                key={letter}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setLetters((current) => current.length < missingLetterCount ? [...current, letter] : current)}
                disabled={isSubmitting || letters.length >= missingLetterCount}
                className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-base font-bold text-ink disabled:opacity-40"
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
            className="mt-4 rounded-[14px] bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Check word
          </motion.button>
        </div>
      )}
    </section>
  );
}
