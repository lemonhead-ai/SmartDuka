import type {
  Answer,
  ApiError,
  Basket,
  Challenge,
  Checkout,
  Customer,
  Hint,
  InventoryItem,
  PlayerProgress,
  Session
} from "@/features/gameplay/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    throw (await response.json()) as ApiError;
  }
  return response.json() as Promise<T>;
}

export const gameplayApi = {
  startSession: () => request<Session>("/gameplay/sessions", { method: "POST" }),
  nextCustomer: (sessionId: string) =>
    request<{ customer: Customer; basket: Basket }>(`/gameplay/sessions/${sessionId}/customers/next`, {
      method: "POST"
    }),
  inventory: (sessionId: string) => request<InventoryItem[]>(`/gameplay/sessions/${sessionId}/inventory`),
  addBasketItem: (sessionId: string, itemId: string) =>
    request<Basket>(`/gameplay/sessions/${sessionId}/basket/items`, {
      method: "POST",
      body: JSON.stringify({ item_id: itemId, quantity: 1 })
    }),
  removeBasketItem: (sessionId: string, itemId: string) =>
    request<Basket>(`/gameplay/sessions/${sessionId}/basket/items/${itemId}`, { method: "DELETE" }),
  checkout: (sessionId: string) =>
    request<Checkout>(`/gameplay/sessions/${sessionId}/checkout`, { method: "POST" }),
  answerChallenge: (sessionId: string, answer: number) =>
    request<Answer>(`/gameplay/sessions/${sessionId}/challenge/answer`, {
      method: "POST",
      body: JSON.stringify({ answer })
    }),
  requestHint: (sessionId: string) =>
    request<Hint>(`/gameplay/sessions/${sessionId}/hint`, { method: "POST" }),
  currentChallenge: (sessionId: string) =>
    request<Challenge | null>(`/gameplay/sessions/${sessionId}/challenge`),
  progress: () => request<PlayerProgress>("/gameplay/progress")
};
