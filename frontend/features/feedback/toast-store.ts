import { create } from "zustand";

export type ToastKind = "success" | "error" | "warning" | "info";

export type Toast = { id: string; message: string; kind: ToastKind };

type ToastStore = {
  toast: Toast | null;
  showToast: (kind: ToastKind, message: string) => void;
  dismissToast: () => void;
};

export function formatMiloMessage(message: string): string {
  if (!message) return "";
  let clean = message.trim();
  clean = clean.replace(/Value error,\s*/gi, "");

  // Intercept and rewrite common validator message formats into Milo's style
  if (clean.toLowerCase().includes("enter a valid email address")) {
    return "Please enter a valid email address!";
  }
  if (clean.toLowerCase().includes("string should have at least 6 characters")) {
    return "Make sure your password is at least 6 characters long!";
  }
  if (clean.toLowerCase().includes("string should have at least 1 character")) {
    return "Oops! Please fill in all the required fields.";
  }
  if (clean.toLowerCase().includes("string should have at least 2 characters")) {
    return "Please use at least 2 characters for your name!";
  }
  if (clean.toLowerCase().includes("an account with this email already exists")) {
    return "An account with this email already exists!";
  }
  if (clean.toLowerCase().includes("email or password is incorrect")) {
    return "Oops! That email or password is incorrect.";
  }
  if (clean.toLowerCase().includes("this reset link is incomplete or has expired")) {
    return "Oops! This reset link is incomplete or has expired.";
  }
  if (clean.toLowerCase().includes("choose a password with at least 6 characters")) {
    return "Make sure your password is at least 6 characters long!";
  }
  if (clean.toLowerCase().includes("your passwords do not match yet")) {
    return "Oops! Your passwords do not match yet.";
  }
  if (clean.toLowerCase().includes("at least 2, up to 5 products")) {
    return "Please select between 2 and 5 products for your starter shelf!";
  }

  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!clean.endsWith(".") && !clean.endsWith("!") && !clean.endsWith("?")) {
      clean += ".";
    }
  }
  return clean;
}

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (kind, message) => set({ toast: { id: crypto.randomUUID(), kind, message: formatMiloMessage(message) } }),
  dismissToast: () => set({ toast: null })
}));
