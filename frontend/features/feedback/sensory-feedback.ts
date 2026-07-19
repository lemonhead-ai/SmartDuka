import type { ToastKind } from "@/features/feedback/toast-store";

const vibrationPatterns: Record<ToastKind, number | number[]> = {
  success: 35,
  error: [40, 45, 40],
  warning: 25,
  info: 15
};

const tones: Record<ToastKind, number> = { success: 660, error: 220, warning: 420, info: 520 };

type Tone = { frequency: number; duration: number; volume: number; type?: OscillatorType };

let audioContext: AudioContext | null = null;

function soundEnabled(): boolean {
  return typeof document === "undefined" || document.documentElement.dataset.sound !== "false";
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !soundEnabled()) return null;
  const AudioContextConstructor = window.AudioContext ?? (
    window as typeof window & { webkitAudioContext?: typeof AudioContext }
  ).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function playTone({ frequency, duration, volume, type = "sine" }: Tone): void {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export function playInteractionSound(): void {
  playTone({ frequency: 520, duration: 0.045, volume: 0.018, type: "triangle" });
}

export function playCarouselTick(): void {
  playTone({ frequency: 780, duration: 0.035, volume: 0.012, type: "triangle" });
}

export function playChatSound(direction: "incoming" | "outgoing"): void {
  if (direction === "outgoing") {
    playTone({ frequency: 360, duration: 0.055, volume: 0.022, type: "triangle" });
    return;
  }
  playTone({ frequency: 610, duration: 0.06, volume: 0.02, type: "sine" });
  window.setTimeout(() => playTone({ frequency: 760, duration: 0.07, volume: 0.018, type: "sine" }), 58);
}

export function triggerSensoryFeedback(kind: ToastKind): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(vibrationPatterns[kind]);
  }
  playTone({ frequency: tones[kind], duration: 0.12, volume: 0.04 });
}
