"use client";

import { useCallback, useState } from "react";

export function useTTS() {
  const [isPlaying] = useState(false);
  const stop = useCallback(() => {}, []);
  const play = useCallback((_text?: string, _lang?: "en" | "sw") => {}, []);

  return { play, stop, isPlaying };
}
