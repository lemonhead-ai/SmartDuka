"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { AudioSpeakerButton } from "@/components/ui/AudioSpeakerButton";
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
  const swahiliTranslation = SWAHILI_HINTS[targetWordClean] || SWAHILI_HINTS[challenge.prompt.split(" ").at(-1)?.toLowerCase() ?? ""] || null;

  useEffect(() => {
    setLetters([]);
    setShowSwahiliHint(false);
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

  const attempts = challenge.attempts ?? 0;

  return (
    <section className="mt-6 rounded-[32px] border border-accent/20 bg-green-50 p-4 sm:p-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">Reading Moment</span>
          {attempts > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Attempt {attempts + 1}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AudioSpeakerButton text={challenge.content} label="Listen" size="sm" />
          {swahiliTranslation && (
            <button
              type="button"
              onClick={() => setShowSwahiliHint((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-surface px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              🌐 {showSwahiliHint ? "Hide Swahili" : "Swahili Hint"}
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">{challenge.prompt}</p>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className={`font-bold text-ink ${challenge.type === "sentence_reading" ? "whitespace-pre-line rounded-2xl bg-surface p-4 text-base leading-7" : "text-3xl tracking-wide"}`}>
          {challenge.content}
        </p>
      </div>

      {/* Swahili Translation Scaffolding Tooltip */}
      {showSwahiliHint && swahiliTranslation && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-950"
        >
          <span className="font-semibold">🌐 Swahili Context:</span>
          <span>In Swahili, this product is called <strong>"{swahiliTranslation}"</strong>.</span>
          <AudioSpeakerButton text={swahiliTranslation} lang="sw" size="sm" className="ml-auto" />
        </motion.div>
      )}

      {/* 1st Wrong Pick: Visual Scaffolding Hint */}
      {attempts === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-xl bg-sky-50 border border-sky-200 p-3 text-sm text-sky-900 flex items-center gap-2">
          <span>💡 <strong>Visual Hint:</strong> Look for the shelf item matching the word <strong>"{challenge.content.slice(0, 2)}"</strong>...</span>
        </motion.div>
      )}

      {/* 2nd Wrong Pick: Full Audio & Code-Switching Prompt */}
      {attempts >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-xl bg-purple-50 border border-purple-200 p-3 text-sm text-purple-950 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">🔊 Spoken Scaffolding:</p>
            <p className="text-xs text-purple-900 mt-0.5">Listen to the word pronounced clearly before picking the shelf item.</p>
          </div>
          <AudioSpeakerButton text={challenge.content} label="Play spoken word" size="md" className="bg-purple-600 text-white hover:bg-purple-700 border-none" />
        </motion.div>
      )}

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
