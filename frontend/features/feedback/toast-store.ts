import { create } from "zustand";

export type ToastKind = "success" | "error" | "warning" | "info";

export type Toast = { id: string; message: string; kind: ToastKind };

type ToastStore = {
  toast: Toast | null;
  showToast: (kind: ToastKind, message: string) => void;
  dismissToast: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (kind, message) => set({ toast: { id: crypto.randomUUID(), kind, message } }),
  dismissToast: () => set({ toast: null })
}));
