"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UtensilsCrossed, ShoppingBasket, Calculator, UserPlus, Users, User
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

export interface MonthlyMealAnalyticsSheetProps {
  analytics: {
    month: number;
    year: number;
    totalBazarExpense: number;
    totalNormalMeals: number;
    totalGuestMeals: number;
    totalMeals: number;
    mealRate: number;
    memberBreakdowns: Array<{
      memberId: string;
      memberName: string;
      email: string;
      avatar: string | null;
      seat: string;
      breakfastCount: number;
      lunchCount: number;
      dinnerCount: number;
      normalMealsCount: number;
      guestMealsCount: number;
      totalMealsCount: number;
      foodCost: number;
      totalBazarDone: number;
      bazarBalance: number;
    }>;
  };
  currentMemberId?: string | null;
  isAdmin?: boolean;
}

export function MonthlyMealAnalyticsSheet({
  analytics,
  currentMemberId = null,
  isAdmin = false,
}: MonthlyMealAnalyticsSheetProps) {
  const { t } = usePreferences();
  const [viewMode, setViewMode] = useState<"my" | "all">(isAdmin ? "all" : "my");
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  const {
    totalBazarExpense,
    totalNormalMeals,
    totalGuestMeals,
    totalMeals,
    mealRate,
    memberBreakdowns,
    month,
    year,
  } = analytics;

  const isCurrent = month === currentMonth && year === currentYear;

  // Filter list to only current user unless admin chooses "all"
  const myBreakdown =
    memberBreakdowns.find((m) => m.memberId === currentMemberId) ||
    memberBreakdowns[0] ||
    null;

  const displayList =
    viewMode === "my" && myBreakdown
      ? [myBreakdown]
      : memberBreakdowns;

  const engineTitle = isCurrent
    ? t("লাইভ মিল রেট ও বাজার হিসাব ইঞ্জিন", "Live Meal Rate & Bazar Engine")
    : t("চূড়ান্ত মিল রেট ও বাজার হিসাব", "Final Meal Rate & Bazar Calculation");

  const mealRateLabel = isCurrent
    ? t("চলতি মিল রেট", "Current Meal Rate")
    : t("চূড়ান্ত মিল রেট", "Final Meal Rate");

  return (
    <div className="space-y-5">
      {/* 1. Compact Compressed Meal Rate & Formula Bar */}
      <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
            <Calculator size={14} />
          </div>
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">
              {engineTitle}
            </span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800 shrink-0">
              {mealRateLabel}: <strong>{formatCurrency(mealRate)}</strong>
              <span className="text-[9px] font-normal text-amber-700 dark:text-amber-400">/{t("মিল", "meal")}</span>
            </span>
          </div>
        </div>

        {/* Inline quick stats */}
        <div className="flex items-center gap-2.5 text-[11px] text-gray-600 dark:text-slate-300 flex-wrap shrink-0">
          <span className="flex items-center gap-1">
            <ShoppingBasket size={12} className="text-amber-600 shrink-0" />
            <span>{t("বাজার:", "Bazar:")}</span>
            <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(totalBazarExpense)}</strong>
          </span>
          <span className="text-gray-300 dark:text-slate-700 hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <UtensilsCrossed size={12} className="text-blue-600 shrink-0" />
            <span>{t("মিল:", "Meals:")}</span>
            <strong className="text-gray-900 dark:text-slate-100 font-bold">{t(`${totalNormalMeals} টি`, `${totalNormalMeals}`)}</strong>
          </span>
          {totalGuestMeals > 0 && (
            <>
              <span className="text-gray-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <UserPlus size={12} className="text-indigo-600 shrink-0" />
                <span>{t("গেস্ট:", "Guest:")}</span>
                <strong className="text-gray-900 dark:text-slate-100 font-bold">{t(`${totalGuestMeals} টি`, `${totalGuestMeals}`)}</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. Member-by-Member Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2.5 bg-gray-50/70 dark:bg-slate-800/60">
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-slate-100">
              {viewMode === "my"
                ? t("আপনার মিল ও বাজার হিসাব", "Your Meal & Bazar Breakdown")
                : t("সদস্যদের মিল ও বাজার হিসাবের তালিকা", "Member Meal & Bazar Breakdown")}
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {t(
                "কার কতটি মিল হয়েছে, মিল বাবদ কত খরচ এবং বাজার বাবদ কার কত জমা/পাওনা",
                "Individual meal counts, food cost, and bazar balance breakdown"
              )}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-1 p-0.5 bg-gray-200/80 dark:bg-slate-700/80 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("my")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1",
                  viewMode === "my"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
                    : "text-gray-600 dark:text-slate-400"
                )}
              >
                <User size={12} />
                <span>{t("আমার হিসাব", "My Breakdown")}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1",
                  viewMode === "all"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
                    : "text-gray-600 dark:text-slate-400"
                )}
              >
                <Users size={12} />
                <span>{t("সব মেম্বার", "All Members")}</span>
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-200/60 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {t("ব্যক্তিগত হিসাব", "Personal Breakdown")}
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/30 text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">{t("মেম্বারের নাম", "Member Name")}</th>
                <th className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <span>🍳</span>
                    <span>{t("সকাল", "Breakfast")}</span>
                  </span>
                </th>
                <th className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                    <span>🍛</span>
                    <span>{t("দুপুর", "Lunch")}</span>
                  </span>
                </th>
                <th className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                    <span>🍲</span>
                    <span>{t("রাত", "Dinner")}</span>
                  </span>
                </th>
                <th className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-400">
                    <span>👥</span>
                    <span>{t("গেস্ট", "Guest")}</span>
                  </span>
                </th>
                <th className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-gray-900 dark:text-slate-100">
                    <span>🍽️</span>
                    <span>{t("মোট মিল", "Total Meals")}</span>
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                    <span>🛒</span>
                    <span>{t("বাজার করেছে", "Bazar Done")}</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
              {displayList.map((m) => {
                const initials = m.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <tr key={m.memberId} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={m.avatar ?? undefined} />
                          <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-slate-100 truncate">{m.memberName}</p>
                          <p className="text-[10px] text-gray-400 truncate">{m.seat}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md text-xs">
                        {m.breakfastCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md text-xs">
                        {m.lunchCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md text-xs">
                        {m.dinnerCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md text-xs">
                        {m.guestMealsCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs">
                        {m.totalMealsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.totalBazarDone)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals Footer */}
            {viewMode === "all" && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/80 font-black text-xs">
                  <td className="py-3 px-4 text-gray-900 dark:text-slate-100">{t("সর্বমোট", "Total")}</td>
                  <td className="py-3 px-3 text-center text-amber-700 dark:text-amber-400">
                    {memberBreakdowns.reduce((s, m) => s + m.breakfastCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-blue-700 dark:text-blue-400">
                    {memberBreakdowns.reduce((s, m) => s + m.lunchCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-indigo-700 dark:text-indigo-400">
                    {memberBreakdowns.reduce((s, m) => s + m.dinnerCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-purple-700 dark:text-purple-400">{totalGuestMeals}</td>
                  <td className="py-3 px-3 text-center text-gray-900 dark:text-slate-100">{totalMeals}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalBazarExpense)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {displayList.map((m) => {
            const initials = m.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const total = m.totalMealsCount || 1;
            const bPct = (m.breakfastCount / total) * 100;
            const lPct = (m.lunchCount / total) * 100;
            const dPct = (m.dinnerCount / total) * 100;

            return (
              <div key={m.memberId} className="p-3.5 sm:p-4 space-y-3">
                {/* Header: Member info & Bazar Done Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
                      <AvatarImage src={m.avatar ?? undefined} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-gray-900 dark:text-slate-100 truncate">{m.memberName}</p>
                      <p className="text-[10px] font-medium text-gray-400 truncate">{m.seat}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "font-black text-xs px-2.5 py-1 rounded-xl shrink-0 border shadow-2xs flex items-center gap-1",
                      m.totalBazarDone > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    )}
                  >
                    <ShoppingBasket size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t("বাজার:", "Bazar:")} {formatCurrency(m.totalBazarDone)}</span>
                  </span>
                </div>

                {/* Cool Meal Breakdown Badges */}
                <div className="grid grid-cols-4 gap-1.5">
                  {/* Breakfast Badge */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 rounded-xl p-2 text-center transition-all">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-0.5">
                      <span>🍳</span>
                      <span className="truncate">{t("সকাল", "Breakfast")}</span>
                    </span>
                    <p className="text-sm font-black text-amber-900 dark:text-amber-200 mt-0.5">
                      {m.breakfastCount}
                    </p>
                  </div>

                  {/* Lunch Badge */}
                  <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 rounded-xl p-2 text-center transition-all">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-0.5">
                      <span>🍛</span>
                      <span className="truncate">{t("দুপুর", "Lunch")}</span>
                    </span>
                    <p className="text-sm font-black text-blue-900 dark:text-blue-200 mt-0.5">
                      {m.lunchCount}
                    </p>
                  </div>

                  {/* Dinner Badge */}
                  <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60 rounded-xl p-2 text-center transition-all">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-0.5">
                      <span>🍲</span>
                      <span className="truncate">{t("রাত", "Dinner")}</span>
                    </span>
                    <p className="text-sm font-black text-indigo-900 dark:text-indigo-200 mt-0.5">
                      {m.dinnerCount}
                    </p>
                  </div>

                  {/* Total Meals Badge */}
                  <div className="bg-gray-100/90 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2 text-center transition-all">
                    <span className="text-[10px] font-black text-gray-700 dark:text-slate-300 flex items-center justify-center gap-0.5">
                      <span>🍽️</span>
                      <span className="truncate">{t("মোট", "Total")}</span>
                    </span>
                    <p className="text-sm font-black text-gray-900 dark:text-slate-100 mt-0.5">
                      {m.totalMealsCount}
                    </p>
                  </div>
                </div>

                {/* Micro Visual Meal Ratio Strip */}
                {m.totalMealsCount > 0 && (
                  <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-gray-200 dark:bg-slate-700 opacity-90">
                    <div style={{ width: `${bPct}%` }} className="bg-amber-500 h-full" title={`Breakfast: ${m.breakfastCount}`} />
                    <div style={{ width: `${lPct}%` }} className="bg-blue-500 h-full" title={`Lunch: ${m.lunchCount}`} />
                    <div style={{ width: `${dPct}%` }} className="bg-indigo-500 h-full" title={`Dinner: ${m.dinnerCount}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
