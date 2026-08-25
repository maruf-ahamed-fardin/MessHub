// Shared types used across frontend and backend

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MemberSummary {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  roomName: string | null;
  seatLabel: string | null;
  isActive: boolean;
  seatRent: number;
  joinedAt: Date;
}

export interface DashboardData {
  personalSummary: {
    balance: number;
    thisMonthExpense: number;
    todayMeals: { breakfast: boolean; lunch: boolean; dinner: boolean } | null;
    totalMealsThisMonth: number;
    room: string | null;
    seat: string | null;
  };
  messSummary: {
    totalMembers: number;
    occupiedSeats: number;
    availableSeats: number;
    todayTotalMeals: number;
    thisMonthExpense: number;
  };
  recentActivity: ActivityItem[];
  importantNotice: NoticeItem | null;
  upcomingTasks: UpcomingTask[];
}

export interface ActivityItem {
  id: string;
  type:
    | "BAZAR"
    | "GUEST_MEAL"
    | "PAYMENT"
    | "CLEANING"
    | "NOTICE"
    | "MAINTENANCE"
    | "EXPENSE";
  message: string;
  actorName: string;
  amount?: number;
  createdAt: Date;
}

export interface NoticeItem {
  id: string;
  title: string;
  description: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  createdAt: Date;
  expiresAt: Date | null;
}

export interface UpcomingTask {
  id: string;
  type: "CLEANING" | "HOUSEHOLD" | "CALENDAR";
  title: string;
  assignedTo: string;
  dueDate: Date;
}

export type MealStatus = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

export interface SettlementSummary {
  month: number;
  year: number;
  mealRate: number;
  totalFoodExpense: number;
  totalNormalMeals: number;
  totalGuestMeals: number;
  totalUtility: number;
  totalOtherExpense: number;
  activeMembers: number;
  isFinalized: boolean;
  memberSummaries: MemberSettlementSummary[];
}

export interface MemberSettlementSummary {
  memberId: string;
  memberName: string;
  avatar: string | null;
  totalMeals: number;
  foodCost: number;
  guestMealCost: number;
  utilityCost: number;
  seatRent: number;
  otherCost: number;
  totalCost: number;
  totalPaid: number;
  balance: number;
}
