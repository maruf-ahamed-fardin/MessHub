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
export const EXPENSE_CATEGORY_LABELS_EN = EXPENSE_CATEGORY_LABELS;

export const EXPENSE_CATEGORY_LABELS_BN: Record<string, string> = {
  ELECTRICITY: "বিদ্যুৎ বিল",
  GAS: "গ্যাস বিল",
  WATER: "পানি বিল",
  INTERNET: "ইন্টারনেট বিল",
  CLEANING: "ক্লিনিং সামগ্রী",
  REPAIR: "মেরামত খরচ",
  FURNITURE: "আসবাবপত্র",
  OTHER: "অন্যান্য",
};

export const UTILITY_TYPES = {
  ELECTRICITY: "ELECTRICITY",
  GAS: "GAS",
  WATER: "WATER",
  INTERNET: "INTERNET",
  COOK: "COOK",
  WASTE: "WASTE",
  OTHER: "OTHER",
} as const;

export const UTILITY_LABELS: Record<string, string> = {
  ELECTRICITY: "Electricity",
  GAS: "Gas",
  WATER: "Water",
  INTERNET: "Internet / Wifi",
  COOK: "Cook / House Maid",
  WASTE: "Waste Management",
  OTHER: "Other Utility",
};
export const UTILITY_LABELS_EN = UTILITY_LABELS;

export const UTILITY_LABELS_BN: Record<string, string> = {
  ELECTRICITY: "বিদ্যুৎ বিল",
  GAS: "গ্যাস বিল",
  WATER: "পানি বিল",
  INTERNET: "ইন্টারনেট ও ওয়াইফাই",
  COOK: "বুয়া / বাবুর্চি বিল",
  WASTE: "ময়লা ও সার্ভিস বিল",
  OTHER: "অন্যান্য ইউটিলিটি",
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
export const PAYMENT_METHOD_LABELS_EN = PAYMENT_METHOD_LABELS;

export const PAYMENT_METHOD_LABELS_BN: Record<string, string> = {
  CASH: "নগদ ক্যাশ",
  BKASH: "বিকাশ",
  BANK: "ব্যাংক ট্রান্সফার",
  OTHER: "অন্যান্য",
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
export const SHARING_METHOD_LABELS_EN = SHARING_METHOD_LABELS;

export const SHARING_METHOD_LABELS_BN: Record<string, string> = {
  EQUAL: "সমান বণ্টন",
  MEAL_BASED: "মিল অনুপাতে বণ্টন",
  SELECTED_MEMBERS: "নির্দিষ্ট মেম্বার বণ্টন",
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
export const NOTICE_PRIORITY_LABELS_EN = NOTICE_PRIORITY_LABELS;

export const NOTICE_PRIORITY_LABELS_BN: Record<string, string> = {
  NORMAL: "সাধারণ",
  IMPORTANT: "জরুরি",
  URGENT: "অতি জরুরি",
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
export const MAINTENANCE_PRIORITY_LABELS_EN = MAINTENANCE_PRIORITY_LABELS;

export const MAINTENANCE_PRIORITY_LABELS_BN: Record<string, string> = {
  LOW: "কম",
  MEDIUM: "মাঝারি",
  HIGH: "উচ্চ",
  URGENT: "জরুরি",
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
export const POST_TYPE_LABELS_EN = POST_TYPE_LABELS;

export const POST_TYPE_LABELS_BN: Record<string, string> = {
  GENERAL: "সাধারণ",
  ANNOUNCEMENT: "ঘোষণা",
  BAZAR_UPDATE: "বাজার আপডেট",
  EVENT: "ইভেন্ট",
  IMPORTANT: "জরুরি নোটিশ",
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
export const RECURRENCE_LABELS_EN = RECURRENCE_LABELS;

export const RECURRENCE_LABELS_BN: Record<string, string> = {
  DAILY: "প্রতিদিন",
  EVERY_2_DAYS: "প্রতি ২ দিন পর",
  EVERY_3_DAYS: "প্রতি ৩ দিন পর",
  WEEKLY: "সাপ্তাহিক",
  CUSTOM: "কাস্টম",
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
