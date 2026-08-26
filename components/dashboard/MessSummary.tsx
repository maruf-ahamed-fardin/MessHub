"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Users, UtensilsCrossed, ShoppingBasket, Home, Wallet, TrendingUp, BarChart3 } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MessSummaryProps {
  totalMembers: number;
  totalRooms: number;
  totalSeats: number;
  todayTotalMeals: number;
  mealRate: number;
  monthBazarExpense: number;
  monthHouseExpense?: number;
  totalFundInHand?: number;
}

export function MessSummary({
  totalMembers,
  totalRooms = 3,
  totalSeats = 7,
  todayTotalMeals,
  mealRate,
  monthBazarExpense,
  monthHouseExpense = 0,
  totalFundInHand = 24050,
}: MessSummaryProps) {
  const { t } = usePreferences();

  const stats = [
    {
      label: t("মেম্বার ও সিট", "Members & Seats"),
      value: t(`${totalMembers} জন (${totalRooms} রুম • ${totalSeats} সিট)`, `${totalMembers} (${totalRooms} Rooms • ${totalSeats} Seats)`),
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      label: t("আজকের মোট মিল", "Today's Total Meals"),
      value: t(`${todayTotalMeals} টি মিল`, `${todayTotalMeals} Meals`),
      icon: UtensilsCrossed,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: t("বর্তমান মিল রেট", "Current Meal Rate"),
      value: t(`${formatCurrency(mealRate)} / মিল`, `${formatCurrency(mealRate)} / meal`),
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: t("এই মাসের বাজার", "Month Bazar Expense"),
      value: formatCurrency(monthBazarExpense),
      icon: ShoppingBasket,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: t("ইউটিলিটি ও বাসা বিল", "House & Utility Bills"),
      value: formatCurrency(monthHouseExpense),
      icon: Home,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      label: t("মেস ফান্ড ব্যালেন্স", "Fund Balance"),
      value: formatCurrency(totalFundInHand),
      icon: Wallet,
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 size={13} className="text-primary" />
          <span>{t("পুরো মেসের আর্থিক ও অপারেশনাল স্থিতি", "Overall Mess Overview & Operational Status")}</span>
        </h3>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{t("রিয়েল-টাইম আপডেট", "Real-time")}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs hover:border-gray-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-2 text-center"
          >
            <div className={`w-7 h-7 rounded-lg ${s.bg} ${s.color} mx-auto flex items-center justify-center font-bold`}>
              <s.icon size={15} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100 leading-tight">{s.value}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
