import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Basket, Challenge, Customer, LiteracyChallenge } from "@/features/gameplay/types";

type GameplaySessionStore = {
  sessionId: string | null;
  customer: Customer | null;
  basket: Basket | null;
  challenge: Challenge | null;
  literacyChallenge: LiteracyChallenge | null;
  setSessionId: (sessionId: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setBasket: (basket: Basket | null) => void;
  setChallenge: (challenge: Challenge | null) => void;
  setLiteracyChallenge: (challenge: LiteracyChallenge | null) => void;
  clearCurrentCustomer: () => void;
  clearSession: () => void;
};

export const useGameplaySessionStore = create<GameplaySessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      customer: null,
      basket: null,
      challenge: null,
      literacyChallenge: null,
      setSessionId: (sessionId) => set({ sessionId, customer: null, basket: null, challenge: null, literacyChallenge: null }),
      setCustomer: (customer) => set({ customer }),
      setBasket: (basket) => set({ basket }),
      setChallenge: (challenge) => set({ challenge }),
      setLiteracyChallenge: (literacyChallenge) => set({ literacyChallenge }),
      clearCurrentCustomer: () => set({ customer: null, basket: null, challenge: null, literacyChallenge: null }),
      clearSession: () => set({ sessionId: null, customer: null, basket: null, challenge: null, literacyChallenge: null })
    }),
    { name: "smart-duka-gameplay-session" }
  )
);
