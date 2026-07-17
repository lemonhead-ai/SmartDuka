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
  SessionSummary,
  Session,
  CatalogItem,
  Duka
} from "@/features/gameplay/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiRequestError extends Error {
  readonly detail: string;
  readonly status: number;

  constructor(detail: string, status: number) {
    super(detail);
    this.name = "ApiRequestError";
    this.detail = detail;
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiError | null;
    throw new ApiRequestError(
      typeof payload?.detail === "string" ? payload.detail : "Something went wrong. Please try again.",
      response.status
    );
  }
  return response.json() as Promise<T>;
}

export const gameplayApi = {
  startSession: () => request<Session>("/gameplay/sessions", { method: "POST" }),
  nextCustomer: (sessionId: string) =>
    request<{ customer: Customer; basket: Basket }>(`/gameplay/sessions/${sessionId}/customers/next`, {
      method: "POST"
    }),
  resolveStockOffer: (sessionId: string) => request<{ customer: Customer; basket: Basket }>(`/gameplay/sessions/${sessionId}/customers/stock-offer`, { method: "POST" }),
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
  progress: () => request<PlayerProgress>("/gameplay/progress"),
  sessionSummary: (sessionId: string) => request<SessionSummary>(`/gameplay/sessions/${sessionId}/summary`),
  catalog: () => request<CatalogItem[]>("/shop/catalog"),
  shop: () => request<Duka>("/shop"),
  createShop: (name: string, category: string, itemIds: string[]) => request<Duka>("/shop", { method: "POST", body: JSON.stringify({ name, category, item_ids: itemIds }) }),
  addShopItems: (itemIds: string[]) => request<Duka>("/shop/items", { method: "POST", body: JSON.stringify({ item_ids: itemIds }) }),
  restock: (itemId: string, quantity: number) => request<Duka>("/shop/restock", { method: "POST", body: JSON.stringify({ item_id: itemId, quantity }) })
};
