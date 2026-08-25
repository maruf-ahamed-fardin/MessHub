export const EXPENSE_CATEGORIES = {
  ELECTRICITY: "ELECTRICITY",
  GAS: "GAS",
  WATER: "WATER",
  INTERNET: "INTERNET",
  CLEANING: "CLEANING",
  REPAIR: "REPAIR",
  FURNITURE: "FURNITURE",
  OTHER: "OTHER",
} as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  ELECTRICITY: "Electricity",
  GAS: "Gas",
  WATER: "Water",
  INTERNET: "Internet",
  CLEANING: "Cleaning",
  REPAIR: "Repair",
  FURNITURE: "Furniture",
  OTHER: "Other",
};

export const UTILITY_TYPES = {
  ELECTRICITY: "ELECTRICITY",
  GAS: "GAS",
  WATER: "WATER",
  INTERNET: "INTERNET",
} as const;

export const UTILITY_LABELS: Record<string, string> = {
  ELECTRICITY: "Electricity",
  GAS: "Gas",
  WATER: "Water",
  INTERNET: "Internet",
};

export const PAYMENT_METHODS = {
  CASH: "CASH",
  BKASH: "BKASH",
  BANK: "BANK",
  OTHER: "OTHER",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BKASH: "bKash",
  BANK: "Bank Transfer",
  OTHER: "Other",
};

export const SHARING_METHODS = {
  EQUAL: "EQUAL",
  MEAL_BASED: "MEAL_BASED",
  SELECTED_MEMBERS: "SELECTED_MEMBERS",
} as const;

export const SHARING_METHOD_LABELS: Record<string, string> = {
  EQUAL: "Equal Split",
  MEAL_BASED: "Meal Based",
  SELECTED_MEMBERS: "Selected Members",
};

export const NOTICE_PRIORITIES = {
  NORMAL: "NORMAL",
  IMPORTANT: "IMPORTANT",
  URGENT: "URGENT",
} as const;

export const NOTICE_PRIORITY_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  IMPORTANT: "Important",
  URGENT: "Urgent",
};

export const MAINTENANCE_PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export const MAINTENANCE_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const POST_TYPES = {
  GENERAL: "GENERAL",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  BAZAR_UPDATE: "BAZAR_UPDATE",
  EVENT: "EVENT",
  IMPORTANT: "IMPORTANT",
} as const;

export const POST_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  ANNOUNCEMENT: "Announcement",
  BAZAR_UPDATE: "Bazar Update",
  EVENT: "Event",
  IMPORTANT: "Important",
};

export const RECURRENCE_TYPES = {
  DAILY: "DAILY",
  EVERY_2_DAYS: "EVERY_2_DAYS",
  EVERY_3_DAYS: "EVERY_3_DAYS",
  WEEKLY: "WEEKLY",
  CUSTOM: "CUSTOM",
} as const;

export const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Daily",
  EVERY_2_DAYS: "Every 2 days",
  EVERY_3_DAYS: "Every 3 days",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

export const DEFAULT_PRODUCTS = [
  { name: "Rice", unit: "kg" },
  { name: "Chicken", unit: "kg" },
  { name: "Egg", unit: "dozen" },
  { name: "Oil", unit: "litre" },
  { name: "Onion", unit: "kg" },
  { name: "Potato", unit: "kg" },
  { name: "Salt", unit: "kg" },
  { name: "Vegetables", unit: "kg" },
  { name: "Fish", unit: "kg" },
  { name: "Lentils", unit: "kg" },
];
