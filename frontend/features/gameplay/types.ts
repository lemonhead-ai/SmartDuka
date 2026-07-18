export type Mission = { title: string; progress: number; target: number; completed: boolean };

export type Badge = { id: string; name: string; description: string };

export type DailyMission = {
  id: string;
  title: string;
  description: string;
  kind: "sales" | "math" | "literacy";
  progress: number;
  target: number;
  completed: boolean;
};

export type Motivation = {
  daily_mission: DailyMission;
  current_streak_days: number;
  badges: Badge[];
};

export type LearningSummary = {
  student_name: string;
  questions_attempted: number;
  correct_answers: number;
  literacy_moments_completed: number;
  parent_summary: {
    headline: string;
    celebrations: string[];
    next_step: string;
  };
  teacher_summary: {
    accuracy_percent: number;
    learning_level: number;
    strengths: string[];
    support_focus: string;
    suggested_activity: string;
  };
};

export type Session = {
  session_id: string;
  student_name: string;
  started_at: string;
  mission: Mission;
  motivation: Motivation;
};

export type Customer = {
  id: string;
  name: string;
  personality: "friendly" | "curious" | "busy" | "elderly" | "parent" | "child";
  greeting: string;
  request: string;
  requested_items: { item_id: string; name: string; quantity: number }[];
  stock_offer: StockOffer | null;
  request_version: number;
};

export type StockOffer = { item_id: string; name: string; requested_quantity: number; available_quantity: number; status: "pending" | "accepted" | "replaced"; message: string };

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  price_kes: number;
  image_placeholder: string;
  stock: number;
  educational_tags: string[];
};

export type Basket = {
  lines: { item: InventoryItem; quantity: number; line_total_kes: number }[];
  total_kes: number;
  validation: BasketValidation;
  literacy_challenge: LiteracyChallenge | null;
  request_version: number;
};

export type BasketValidation = {
  is_valid: boolean;
  missing_items: BasketValidationIssue[];
  unexpected_items: BasketValidationIssue[];
  quantity_mismatches: BasketValidationIssue[];
  tutor_feedback: string;
};

export type BasketValidationIssue = {
  item_id: string | null;
  name: string;
  expected_quantity: number;
  selected_quantity: number;
};

export type Challenge = {
  id: string;
  prompt: string;
  skill: string;
  difficulty_tier: number;
  attempts: number;
  hints_used: number;
  total_kes: number;
  amount_due_kes: number;
  amount_paid_kes: number;
  discount_kes: number;
};

export type LiteracyChallenge = {
  id: string;
  type: "word_reading" | "sentence_reading" | "spelling" | "conversation";
  prompt: string;
  content: string;
  choices: { id: string; label: string }[];
  letter_options: string[];
  difficulty_tier: number;
  attempts: number;
  complete: boolean;
  is_available: boolean;
};

export type LiteracyAnswer = {
  is_correct: boolean;
  feedback: string;
  attempts: number;
  challenge_complete: boolean;
  challenge: LiteracyChallenge;
  rewards_preview: Reward | null;
};

export type Checkout = {
  status: "challenge_required" | "completed";
  challenge: Challenge | null;
  reward: Reward | null;
  mission: Mission;
  next_customer_available: boolean;
};

export type Reward = { coins: number; xp: number; stars: number; message: string };

export type SessionSummary = {
  session_id: string;
  customers_served: number;
  questions_attempted: number;
  correct_answers: number;
  hints_used: number;
  coins_earned: number;
  xp_earned: number;
  stars_earned: number;
  achievements: string[];
  mission: Mission;
};

export type Answer = {
  is_correct: boolean;
  feedback: string;
  attempts: number;
  challenge_complete: boolean;
  rewards_preview: Reward | null;
};

export type Hint = { hint: string; encouragement: string; hints_used: number };

export type PlayerProgress = {
  student_name: string;
  questions_attempted: number;
  correct_answers: number;
  hints_used: number;
  time_spent_seconds: number;
  coins_earned: number;
  xp_earned: number;
  stars_earned: number;
  missions_completed: number;
  current_learning_level: number;
  skills_improving: string[];
  daily_streak_days: number;
};

export type ApiError = { detail: string; request_id?: string; errors?: { field?: string; message: string }[] };

export type CatalogItem = { id: string; name: string; category: string; price_kes: number; image_placeholder: string };
export type Duka = { id: string; name: string; category: string; cash_balance_kes: number; items: (CatalogItem & { stock: number; restock_cost_kes: number })[] };
export type ShopLedgerEntry = { id: string; entry_type: "sale" | "restock" | "new_stock"; amount_kes: number; description: string; created_at: string };
export type ShopLedger = { cash_balance_kes: number; daily_revenue_kes: number; daily_expenses_kes: number; daily_profit_kes: number; sales_count: number; recent_entries: ShopLedgerEntry[] };
