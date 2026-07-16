export type Mission = { title: string; progress: number; target: number; completed: boolean };

export type Session = { session_id: string; student_name: string; started_at: string; mission: Mission };

export type Customer = {
  id: string;
  name: string;
  personality: "friendly" | "curious" | "busy" | "elderly" | "parent" | "child";
  greeting: string;
  request: string;
  requested_items: { item_id: string; name: string; quantity: number }[];
};

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
  amount_paid_kes: number;
};

export type Checkout = {
  status: "challenge_required" | "completed";
  challenge: Challenge | null;
  reward: Reward | null;
  mission: Mission;
  next_customer_available: boolean;
};

export type Reward = { coins: number; xp: number; stars: number; message: string };

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
export type Duka = { id: string; name: string; category: string; items: CatalogItem[] };
