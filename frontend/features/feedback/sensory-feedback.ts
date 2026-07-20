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
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
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

/**
 * Unified haptic feedback function.
 * Supports standard Vibration API (Android/Chrome) and exploits the iOS Safari 17.4+ checkbox switch hack.
 */
export function triggerHapticFeedback(): void {
  if (typeof window === "undefined") return;

  // 1. Android/Chrome Vibration API
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(15);
      return;
    } catch {
      // Ignore vibration failures due to browser policies
    }
  }

  // 2. iOS Safari 17.4+ checkbox switch hack
  if (typeof document !== "undefined") {
    try {
      let input = document.getElementById("haptic-trigger-input") as HTMLInputElement | null;
      let label = document.getElementById("haptic-trigger-label") as HTMLLabelElement | null;

      if (!input || !label) {
        input = document.createElement("input");
        input.type = "checkbox";
        input.id = "haptic-trigger-input";
        input.setAttribute("switch", "");
        input.style.position = "absolute";
        input.style.opacity = "0";
        input.style.pointerEvents = "none";
        input.style.width = "0";
        input.style.height = "0";
        input.style.left = "-9999px";

        label = document.createElement("label");
        label.id = "haptic-trigger-label";
        label.htmlFor = "haptic-trigger-input";
        label.style.position = "absolute";
        label.style.opacity = "0";
        label.style.pointerEvents = "none";
        label.style.width = "0";
        label.style.height = "0";
        label.style.left = "-9999px";

        document.body.appendChild(input);
        document.body.appendChild(label);
      }

      label.click();
    } catch {
      // Ignore haptic failures
    }
  }
}

export function playInteractionSound(): void {
  triggerHapticFeedback();
  playTone({ frequency: 520, duration: 0.045, volume: 0.05, type: "triangle" });
}

export function playCarouselTick(): void {
  triggerHapticFeedback();
  playTone({ frequency: 780, duration: 0.035, volume: 0.03, type: "triangle" });
}

export function playChatSound(direction: "incoming" | "outgoing"): void {
  if (direction === "outgoing") {
    playTone({ frequency: 360, duration: 0.055, volume: 0.06, type: "triangle" });
    return;
  }
  playTone({ frequency: 610, duration: 0.06, volume: 0.05, type: "sine" });
  window.setTimeout(() => playTone({ frequency: 760, duration: 0.07, volume: 0.045, type: "sine" }), 58);
}

export function triggerSensoryFeedback(kind: ToastKind): void {
  if (!soundEnabled()) return;
  triggerHapticFeedback();
  playTone({ frequency: tones[kind], duration: 0.12, volume: 0.1 });
}
