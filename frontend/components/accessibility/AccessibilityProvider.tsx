"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AccessibilityPreferences = {
  largeText: boolean;
  reducedMotion: boolean;
  sound: boolean;
};

type AccessibilityContextValue = {
  preferences: AccessibilityPreferences;
  setPreference: (key: keyof AccessibilityPreferences, value: boolean) => void;
};

const storageKey = "smart-duka-preferences";
const defaults: AccessibilityPreferences = { largeText: false, reducedMotion: false, sound: true };
const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function applyPreferences(preferences: AccessibilityPreferences) {
  document.documentElement.dataset.largeText = String(preferences.largeText);
  document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
  document.documentElement.dataset.sound = String(preferences.sound);
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaults);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const next = saved ? { ...defaults, ...(JSON.parse(saved) as Partial<AccessibilityPreferences>) } : defaults;
      setPreferences(next);
      applyPreferences(next);
    } catch {
      window.localStorage.removeItem(storageKey);
      applyPreferences(defaults);
    }
  }, []);

  const value = useMemo<AccessibilityContextValue>(() => ({
    preferences,
    setPreference: (key, value) => {
      const next = { ...preferences, [key]: value };
      setPreferences(next);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      applyPreferences(next);
    },
  }), [preferences]);

  return (
    <AccessibilityContext.Provider value={value}>
      <MotionConfig reducedMotion={preferences.reducedMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibilityPreferences must be used within AccessibilityProvider.");
  return context;
}
