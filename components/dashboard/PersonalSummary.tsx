"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { TrendingDown, TrendingUp, UtensilsCrossed, BedDouble, Receipt, Sparkles } from "lucide-react";
import { Meal } from "@prisma/client";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface PersonalSummaryProps {
  balance: number;
  foodCost: number;
  totalMeals: number;
  utilityShare?: number;
  todayMeal: Meal | null;
  room: string | null;
  seat: string | null;
  mealRate: number;
}

export function PersonalSummary({
  balance,
  foodCost,
  totalMeals,
  utilityShare = 4550,
  todayMeal,
  room,
  seat,
  mealRate,
}: PersonalSummaryProps) {
  const { t } = usePreferences();
  const isCredit = balance >= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" />
          <span>{t("আমার ব্যক্তিগত আর্থিক স্থিতি", "My Personal Financial Summary")}</span>
        </h3>
        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{t("চলতি মাস", "This Month")}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Live Running Balance */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("আমার ব্যালেন্স", "My Balance")}
            </span>
            <span
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs",
                isCredit ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
              )}
            >
              {isCredit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            </span>
          </div>
          <div>
            <p className={cn("text-xl font-extrabold tracking-tight", isCredit ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(balance))}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
              {isCredit ? t("মেসে জমা উদ্বৃত্ত আছে ✓", "In credit ✓") : t("টাকা বকেয়া আছে", "Due balance")}
            </p>
          </div>
        </div>

        {/* 2. Food Cost */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("মিল খরচ", "Food Cost")}
            </span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              <UtensilsCrossed size={13} />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{formatCurrency(foodCost)}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t(`${totalMeals} টি মিল • ${formatCurrency(mealRate)}/মিল`, `${totalMeals} meals • ${formatCurrency(mealRate)}/meal`)}
            </p>
          </div>
        </div>

        {/* 3. Rent & Utility Share */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("বাসা ও ইউটিলিটি", "Rent & Utilities")}
            </span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
              <Receipt size={13} />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{formatCurrency(utilityShare)}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t("ভাড়া, বিদ্যুৎ, গ্যাস ও নেট", "Rent, electricity, gas & wifi")}
            </p>
          </div>
        </div>

        {/* 4. Room & Seat */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {t("আমার রুম ও সিট", "Room & Seat")}
            </span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
              <BedDouble size={13} />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">{room ?? "Room 101"}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t(`সিট ${seat ?? "A"}`, `Seat ${seat ?? "A"}`)}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Meal Status Strip */}
      {todayMeal !== undefined && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
              {t("আজকের আমার মিল:", "My Today's Meals:")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              ☀️ {t("সকাল:", "Breakfast:")}{" "}
              <strong className={cn("text-xs font-bold", todayMeal?.breakfast ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400")}>
                {todayMeal?.breakfast ? t("চালু ✓", "ON ✓") : t("বন্ধ ✕", "OFF ✕")}
              </strong>
            </span>
            <span className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              🍽️ {t("দুপুর:", "Lunch:")}{" "}
              <strong className={cn("text-xs font-bold", todayMeal?.lunch ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400")}>
                {todayMeal?.lunch ? t("চালু ✓", "ON ✓") : t("বন্ধ ✕", "OFF ✕")}
              </strong>
            </span>
            <span className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              🌙 {t("রাত:", "Dinner:")}{" "}
              <strong className={cn("text-xs font-bold", todayMeal?.dinner ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400")}>
                {todayMeal?.dinner ? t("চালু ✓", "ON ✓") : t("বন্ধ ✕", "OFF ✕")}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
