import type { ToastKind } from "@/features/feedback/toast-store";

const vibrationPatterns: Record<ToastKind, number | number[]> = {
  success: 35,
  error: [40, 45, 40],
  warning: 25,
  info: 15
};

const tones: Record<ToastKind, number> = { success: 660, error: 220, warning: 420, info: 520 };

export function triggerSensoryFeedback(kind: ToastKind): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(vibrationPatterns[kind]);
  }
  if (typeof window === "undefined" || document.documentElement.dataset.sound === "false") return;
  const AudioContextConstructor = window.AudioContext ?? (
    window as typeof window & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;
  if (!AudioContextConstructor) return;
  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = tones[kind];
  gain.gain.setValueAtTime(0.04, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}
