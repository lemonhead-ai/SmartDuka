import { ApiRequestError } from "@/features/gameplay/api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type Shopkeeper = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
};

export type AuthResponse = { shopkeeper: Shopkeeper; access_token: string | null };

const sessionTokenKey = "smart-duka-session-token";

function sessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(sessionTokenKey);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken() ? { Authorization: `Bearer ${sessionToken()}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string; errors?: { field?: string; message: string }[] } | null;
    throw new ApiRequestError(payload?.detail ?? "Something went wrong. Please try again.", response.status, payload?.errors);
  }
  return response.json() as Promise<T>;
}

export const authApi = {
  storeSessionToken: (token: string) => {
    if (typeof window !== "undefined") window.localStorage.setItem(sessionTokenKey, token);
  },
  clearSessionToken: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(sessionTokenKey);
  },
  signUp: (email: string, displayName: string, password: string) =>
    request<AuthResponse>("/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({ email, display_name: displayName, password })
    }),
  signIn: (email: string, password: string) =>
    request<AuthResponse>("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  signOut: () => request<{ message: string }>("/auth/sign-out", { method: "POST" }),
  me: () => request<AuthResponse>("/auth/me"),
  updateProfile: (displayName: string) => request<AuthResponse>("/auth/me", { method: "PATCH", body: JSON.stringify({ display_name: displayName }) }),
  requestPasswordReset: (email: string) =>
    request<{ message: string }>("/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, password })
    }),
  deleteAccount: () => request<{ message: string }>("/auth/me", { method: "DELETE" })
};
