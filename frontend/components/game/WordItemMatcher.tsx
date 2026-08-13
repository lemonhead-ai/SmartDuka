"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckmarkCircle01Icon, BookOpen01Icon, RefreshIcon } from "hugeicons-react";
import { CbcBadge } from "@/components/learning/CbcBadge";
import { MiloAlert } from "@/components/ui/MiloAlert";
import { SautiButton } from "@/components/game/SautiButton";
import type { ToastKind } from "@/features/feedback/toast-store";

interface MatchPair {
  id: string;
  nameSwahili: string;
  nameEnglish: string;
  icon: string;
}

const MATCH_PAIRS: MatchPair[] = [
  { id: "p1", nameSwahili: "Maziwa", nameEnglish: "Milk", icon: "🥛" },
  { id: "p2", nameSwahili: "Unga wa Sembe", nameEnglish: "Maize Flour", icon: "🌾" },
  { id: "p3", nameSwahili: "Sabuni ya Kipande", nameEnglish: "Bar Soap", icon: "🧼" },
  { id: "p4", nameSwahili: "Mandazi", nameEnglish: "Fried Doughnut", icon: "🍩" },
  { id: "p5", nameSwahili: "Sukari", nameEnglish: "Sugar", icon: "🍚" },
];

export function WordItemMatcher() {
  const [selectedWord, setSelectedWord] = useState<MatchPair | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [miloFeedback, setMiloFeedback] = useState<{ kind: ToastKind; message: string }>({
    kind: "info",
    message: "Karibu rafiki! Soma jina la bidhaa Upande wa Shoto (1), kisha chague picha yake Shelfi (2)!",
  });

  const handleItemClick = (item: MatchPair) => {
    if (!selectedWord) {
      setMiloFeedback({
        kind: "warning",
        message: "Soma na uchague jina la bidhaa kwanza kisha uchague picha yake!",
      });
      return;
    }

    if (selectedWord.id === item.id) {
      const newMatched = [...matchedIds, item.id];
      setMatchedIds(newMatched);
      setSelectedWord(null);

      if (newMatched.length === MATCH_PAIRS.length) {
        setMiloFeedback({
          kind: "success",
          message: "Hongera sana rafiki! 🎉 Umefananisha bidhaa zote kwa usahihi kabisa!",
        });
      } else {
        setMiloFeedback({
          kind: "success",
          message: `Safi sana! "${item.nameSwahili}" inafanana na ${item.icon} (${item.nameEnglish}). Endelea hivi!`,
        });
      }
    } else {
      setMiloFeedback({
        kind: "error",
        message: `Pole sana! "${selectedWord.nameSwahili}" siyo picha hiyo. Jaribu tena au chagua jina lingine!`,
      });
      setSelectedWord(null);
    }
  };

  const resetGame = () => {
    setMatchedIds([]);
    setSelectedWord(null);
    setMiloFeedback({
      kind: "info",
      message: "Tumeanza upya! Soma jina la bidhaa kisha utafute picha yake!",
    });
  };

  return (
    <div className="rounded-3xl bg-surface p-6 border border-line shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <BookOpen01Icon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">Kufananisha Majina ya Bidhaa (Word-to-Item Matching)</h3>
            <p className="text-xs text-muted">
              Soma jina la bidhaa kwa Kiswahili kisha chagua picha inayolingana kwenye shelfi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CbcBadge gradeLevel="Grade 1-3" subStrand="3.1 Swahili Vocabulary & Literacy" competencyId="CBC-LANG-G1-01" />
          <SautiButton promptText={miloFeedback.message} />
          <button
            type="button"
            onClick={resetGame}
            className="flex items-center gap-1 rounded-xl bg-canvas p-2 text-xs font-bold text-muted hover:text-ink border border-line"
            title="Anza Upya"
          >
            <RefreshIcon size={14} />
          </button>
        </div>
      </div>

      {/* Milo Mascot Toast Feedback */}
      <MiloAlert kind={miloFeedback.kind} message={miloFeedback.message} />

      {/* Matching Workbench */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column: Word Cards */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted px-1">1. Chagua Jina la Bidhaa:</h4>
          <div className="grid grid-cols-1 gap-2.5">
            {MATCH_PAIRS.map((pair) => {
              const isMatched = matchedIds.includes(pair.id);
              const isSelected = selectedWord?.id === pair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => setSelectedWord(pair)}
                  className={`flex items-center justify-between rounded-2xl p-3.5 text-xs font-bold transition-all border ${
                    isMatched
                      ? "bg-accent/10 border-accent/30 text-accent opacity-60 cursor-default"
                      : isSelected
                      ? "bg-accent text-white border-accent shadow-sm ring-2 ring-accent/20"
                      : "bg-canvas hover:bg-surface border-line text-ink"
                  }`}
                >
                  <span>{pair.nameSwahili}</span>
                  {isMatched ? (
                    <CheckmarkCircle01Icon size={16} className="text-accent shrink-0" />
                  ) : (
                    <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted"}`}>
                      ({pair.nameEnglish})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Picture Shelf Cards */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted px-1">2. Chagua Picha Inayofaa:</h4>
          <div className="grid grid-cols-2 gap-3">
            {MATCH_PAIRS.map((pair) => {
              const isMatched = matchedIds.includes(pair.id);
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleItemClick(pair)}
                  className={`flex flex-col items-center justify-center rounded-2xl p-4 transition-all border ${
                    isMatched
                      ? "bg-accent/10 border-accent/30 opacity-40 cursor-default"
                      : "bg-canvas hover:bg-surface border-line hover:border-accent"
                  }`}
                >
                  <span className="text-4xl mb-1">{pair.icon}</span>
                  {isMatched && (
                    <span className="text-[10px] font-bold text-accent">{pair.nameSwahili}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
