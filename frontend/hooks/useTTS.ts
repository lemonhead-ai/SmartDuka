"use client";

import { useCallback, useEffect, useState } from "react";

let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activePlaybackListener: ((isPlaying: boolean) => void) | null = null;

function stopActivePlayback() {
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio.removeAttribute("src");
    activeAudio.load();
    activeAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (activeUtterance) {
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
  activePlaybackListener?.(false);
  activePlaybackListener = null;
}

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(() => {
    if (activePlaybackListener === setIsPlaying) {
      stopActivePlayback();
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    (text: string, lang: "en" | "sw" = "en") => {
      if (!text) return;
      stopActivePlayback();

      setIsPlaying(true);
      activePlaybackListener = setIsPlaying;
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const audioUrl = `${apiHost}/api/v1/tts/stream?text=${encodeURIComponent(text)}&lang=${lang}`;

      const audio = new Audio(audioUrl);
      activeAudio = audio;
      let hasHandledFallback = false;

      const triggerSpeechFallback = () => {
        if (hasHandledFallback) return;
        hasHandledFallback = true;

        if (activeAudio === audio) {
          audio.onended = null;
          audio.onerror = null;
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
          activeAudio = null;
        }

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          activeUtterance = utterance;
          utterance.lang = lang === "sw" ? "sw-KE" : "en-US";
          utterance.rate = 0.9; // Slightly slower for children
          utterance.onend = () => {
            if (activeUtterance === utterance) stopActivePlayback();
          };
          utterance.onerror = () => {
            if (activeUtterance === utterance) stopActivePlayback();
          };
          window.speechSynthesis.speak(utterance);
        } else {
          stopActivePlayback();
        }
      };

      audio.onended = () => {
        if (activeAudio === audio) stopActivePlayback();
      };

      audio.onerror = () => {
        if (activeAudio !== audio) return;
        triggerSpeechFallback();
      };

      audio.play().catch((err: unknown) => {
        if (activeAudio !== audio) return;
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        triggerSpeechFallback();
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { play, stop, isPlaying };
}
