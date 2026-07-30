"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    (text: string, lang: "en" | "sw" = "en") => {
      if (!text) return;
      stop();

      setIsPlaying(true);
      const apiHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const audioUrl = `${apiHost}/api/v1/tts/stream?text=${encodeURIComponent(text)}&lang=${lang}`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Fallback to Browser Web Speech API if backend audio fails
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang === "sw" ? "sw-KE" : "en-US";
          utterance.rate = 0.9; // Slightly slower for children
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsPlaying(false);
        }
      };

      audio.play().catch(() => {
        // Handle autoplay policy restriction by falling back or stopping gracefully
        audio.onerror?.(new Event("error"));
      });
    },
    [stop]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { play, stop, isPlaying };
}
