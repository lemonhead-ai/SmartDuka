"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePreference = "system" | "light" | "dark";

export type Preferences = {
  theme: ThemePreference;
  largeText: boolean;
  reducedMotion: boolean;
  sound: boolean;
};

type PreferencesContextValue = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const storageKey = "smart-duka-preferences-v2";

const defaultPreferences: Preferences = {
  theme: "system",
  largeText: false,
  reducedMotion: false,
  sound: true,
};

function resolveTheme(preference: ThemePreference) {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyPreferences(prefs: Preferences) {
  const theme = resolveTheme(prefs.theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  
  if (prefs.largeText) {
    document.documentElement.dataset.largeText = "true";
  } else {
    delete document.documentElement.dataset.largeText;
  }

  if (prefs.reducedMotion) {
    document.documentElement.dataset.reducedMotion = "true";
  } else {
    delete document.documentElement.dataset.reducedMotion;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    let initialPreferences = defaultPreferences;
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old theme preference if it exists
        const oldTheme = window.localStorage.getItem("smart-duka-theme") as ThemePreference | null;
        if (oldTheme && !parsed.theme) {
            parsed.theme = oldTheme === "light" || oldTheme === "dark" ? oldTheme : "system";
        }
        
        initialPreferences = { ...defaultPreferences, ...parsed };
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    } else {
      // Check for legacy theme
      const oldTheme = window.localStorage.getItem("smart-duka-theme") as ThemePreference | null;
      if (oldTheme) {
        initialPreferences.theme = oldTheme === "light" || oldTheme === "dark" ? oldTheme : "system";
      }
      
      // Check for legacy preferences
      const oldPrefs = window.localStorage.getItem("smart-duka-preferences");
      if (oldPrefs) {
         try {
             initialPreferences = { ...initialPreferences, ...JSON.parse(oldPrefs) };
         } catch {}
      }
    }

    setPreferencesState(initialPreferences);
    applyPreferences(initialPreferences);
  }, []);

  useEffect(() => {
    if (preferences.theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => applyPreferences(preferences);
    mediaQuery.addEventListener("change", syncSystemTheme);
    return () => mediaQuery.removeEventListener("change", syncSystemTheme);
  }, [preferences]);

  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    setPreference: (key, nextValue) => {
      setPreferencesState((prev) => {
        const next = { ...prev, [key]: nextValue };
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        applyPreferences(next);
        return next;
      });
    },
  }), [preferences]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === null) throw new Error("usePreferences must be used within PreferencesProvider.");
  return context;
}
