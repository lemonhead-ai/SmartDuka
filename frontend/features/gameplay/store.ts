import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Basket, Challenge, Customer } from "@/features/gameplay/types";

type GameplaySessionStore = {
  sessionId: string | null;
  customer: Customer | null;
  basket: Basket | null;
  challenge: Challenge | null;
  setSessionId: (sessionId: string) => void;
  setCustomer: (customer: Customer | null) => void;
  setBasket: (basket: Basket | null) => void;
  setChallenge: (challenge: Challenge | null) => void;
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
      setSessionId: (sessionId) => set({ sessionId, customer: null, basket: null, challenge: null }),
      setCustomer: (customer) => set({ customer }),
      setBasket: (basket) => set({ basket }),
      setChallenge: (challenge) => set({ challenge }),
      clearCurrentCustomer: () => set({ customer: null, basket: null, challenge: null }),
      clearSession: () => set({ sessionId: null, customer: null, basket: null, challenge: null })
    }),
    { name: "smart-duka-gameplay-session" }
  )
);
