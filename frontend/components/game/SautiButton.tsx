"use client";

import React, { useState } from "react";
import { Mic01Icon, VolumeHighIcon } from "hugeicons-react";
import { useTTS } from "@/hooks/useTTS";

interface SautiButtonProps {
  promptText?: string;
  onVoiceInput?: (transcript: string) => void;
}

export function SautiButton({ promptText = "Karibu duka yetu!", onVoiceInput }: SautiButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const { play: playTTS, stop: stopTTS, isPlaying: isPlayingAudio } = useTTS();

  const handleSpeechOutput = () => {
    if (isPlayingAudio) {
      stopTTS();
    } else {
      playTTS(promptText, "sw");
    }
  };

  const handleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const windowObj = window as unknown as Record<string, unknown>;
    const SpeechRecognitionClass =
      (windowObj.SpeechRecognition as new () => unknown) ||
      (windowObj.webkitSpeechRecognition as new () => unknown);

    if (!SpeechRecognitionClass) {
      alert("Sauti input Browser support is active. Try Chrome or Safari!");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionClass as any)();
    recognition.lang = "sw-KE";
    recognition.interimResults = false;

    setIsListening(true);
    recognition.start();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (onVoiceInput) onVoiceInput(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSpeechOutput}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
          isPlayingAudio
            ? "bg-amber-500 text-white border-amber-600 animate-pulse"
            : "bg-surface hover:bg-canvas text-ink border-line"
        }`}
        title="Sikiliza Sauti (Swahili Speech)"
      >
        <VolumeHighIcon size={16} />
        <span>Sauti</span>
      </button>

      <button
        type="button"
        onClick={handleVoiceInput}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
          isListening
            ? "bg-red-500 text-white border-red-600 animate-pulse"
            : "bg-accent/10 hover:bg-accent/20 text-accent border-accent/30"
        }`}
        title="Sema kwa Sauti (Voice Input)"
      >
        <Mic01Icon size={16} />
        <span>{isListening ? "Inasikiliza..." : "Sema"}</span>
      </button>
    </div>
  );
}
