import { create } from "zustand";

type GameplaySessionStore = {
  sessionId: string | null;
  setSessionId: (sessionId: string) => void;
  clearSession: () => void;
};

export const useGameplaySessionStore = create<GameplaySessionStore>((set) => ({
  sessionId: null,
  setSessionId: (sessionId) => set({ sessionId }),
  clearSession: () => set({ sessionId: null })
}));
