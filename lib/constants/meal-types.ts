export const MEAL_TYPES = {
  BREAKFAST: "BREAKFAST",
  LUNCH: "LUNCH",
  DINNER: "DINNER",
} as const;

export type MealType = (typeof MEAL_TYPES)[keyof typeof MEAL_TYPES];

export const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};

export const MEAL_ICONS: Record<string, string> = {
  BREAKFAST: "☀️",
  LUNCH: "🍽️",
  DINNER: "🌙",
};

export const MEAL_TIMES: Record<string, string> = {
  BREAKFAST: "Morning",
  LUNCH: "Afternoon",
  DINNER: "Evening",
};
