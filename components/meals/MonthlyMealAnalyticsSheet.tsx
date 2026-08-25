"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UtensilsCrossed, ShoppingBasket, Calculator, TrendingUp,
  Sun, Moon, Flame, UserPlus, Info, CheckCircle2, AlertCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/useT";

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
}

export function MonthlyMealAnalyticsSheet({ analytics }: MonthlyMealAnalyticsSheetProps) {
  const T = useT();

  const {
    totalBazarExpense,
    totalNormalMeals,
    totalGuestMeals,
    totalMeals,
    mealRate,
    memberBreakdowns,
  } = analytics;

  return (
    <div className="space-y-5">
      {/* 1. Live Meal Rate Formula & Calculation Overview Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border border-amber-500/20 dark:border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                <Calculator size={17} />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-slate-100">
                লাইভ মিল রেট ও বাজার হিসাব (Meal Rate Engine)
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300">
              চাল, ডাল, তেল, মাছ, মাংস সহ সকল মেস বাজার খরচকে মোট মেম্বার মিল দিয়ে ভাগ করে প্রতি মিলের খরচ নির্ধারিত হয়।
            </p>
          </div>

          {/* Large Meal Rate Indicator */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 px-4 py-2.5 rounded-2xl shadow-xs shrink-0">
            <div>
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                চলতি মিল রেট (Per Meal Rate)
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-0.5">
                ৳{mealRate.toFixed(2)}{" "}
                <span className="text-xs font-normal text-gray-400">/ মিল</span>
              </p>
            </div>
          </div>
        </div>

        {/* Formula breakdown bar */}
        <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
            <ShoppingBasket size={15} className="text-amber-600 shrink-0" />
            <span>মোট বাজার খরচ: <strong className="font-extrabold text-gray-900 dark:text-slate-100">৳{formatCurrency(totalBazarExpense)}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
            <UtensilsCrossed size={15} className="text-blue-600 shrink-0" />
            <span>মোট নরমাল মিল: <strong className="font-extrabold text-gray-900 dark:text-slate-100">{totalNormalMeals} টি</strong></span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
            <UserPlus size={15} className="text-indigo-600 shrink-0" />
            <span>মোট মেহমান মিল: <strong className="font-extrabold text-gray-900 dark:text-slate-100">{totalGuestMeals} টি</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Member-by-Member Breakdown Table (Desktop & Tablet) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/70 dark:bg-slate-800/60">
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-slate-100">
              সদস্যদের মিল ও বাজার হিসাবের পূর্ণ তালিকা (Individual Breakdown)
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              কার কতটি মিল হয়েছে, মিল বাবদ কত খরচ এবং বাজার বাবদ কার কত জমা/পাওনা
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-200/60 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            মোট মেম্বার: {memberBreakdowns.length} জন
          </span>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/30 text-[11px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">মেম্বারের নাম</th>
                <th className="py-3 px-3 text-center">সকাল (B)</th>
                <th className="py-3 px-3 text-center">দুপুর (L)</th>
                <th className="py-3 px-3 text-center">রাত (D)</th>
                <th className="py-3 px-3 text-center">গেস্ট (G)</th>
                <th className="py-3 px-3 text-center">মোট মিল</th>
                <th className="py-3 px-4 text-right">খাবারের খরচ (৳)</th>
                <th className="py-3 px-4 text-right">বাজার করেছে (৳)</th>
                <th className="py-3 px-4 text-right">বাজারের স্থিতি (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
              {memberBreakdowns.map((m) => {
                const initials = m.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const isBazarSurplus = m.bazarBalance >= 0;

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
                    <td className="py-3 px-3 text-center text-amber-700 dark:text-amber-400 font-bold">{m.breakfastCount}</td>
                    <td className="py-3 px-3 text-center text-blue-700 dark:text-blue-400 font-bold">{m.lunchCount}</td>
                    <td className="py-3 px-3 text-center text-indigo-700 dark:text-indigo-400 font-bold">{m.dinnerCount}</td>
                    <td className="py-3 px-3 text-center text-purple-700 dark:text-purple-400 font-bold">{m.guestMealsCount}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {m.totalMealsCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-slate-100">
                      ৳{formatCurrency(m.foodCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      ৳{formatCurrency(m.totalBazarDone)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={cn(
                          "font-black text-xs px-2 py-0.5 rounded-md",
                          isBazarSurplus
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        )}
                      >
                        {isBazarSurplus ? "+" : ""}৳{formatCurrency(m.bazarBalance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Totals Footer */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/80 font-black text-xs">
                <td className="py-3 px-4 text-gray-900 dark:text-slate-100">সর্বমোট (Total)</td>
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
                <td className="py-3 px-4 text-right text-gray-900 dark:text-slate-100">
                  ৳{formatCurrency(memberBreakdowns.reduce((s, m) => s + m.foodCost, 0))}
                </td>
                <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                  ৳{formatCurrency(totalBazarExpense)}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 dark:text-slate-400">—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-800">
          {memberBreakdowns.map((m) => {
            const initials = m.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isBazarSurplus = m.bazarBalance >= 0;

            return (
              <div key={m.memberId} className="p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={m.avatar ?? undefined} />
                      <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{m.memberName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{m.seat}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "font-black text-xs px-2 py-0.5 rounded-md shrink-0",
                      isBazarSurplus
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    )}
                  >
                    {isBazarSurplus ? "ফেরত: +" : "দিতে হবে: "}৳{formatCurrency(Math.abs(m.bazarBalance))}
                  </span>
                </div>

                {/* Sub-counts */}
                <div className="grid grid-cols-4 gap-1.5 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl text-center text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[9px]">সকাল</span>
                    <strong className="text-amber-700 dark:text-amber-400">{m.breakfastCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">দুপুর</span>
                    <strong className="text-blue-700 dark:text-blue-400">{m.lunchCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">রাত</span>
                    <strong className="text-indigo-700 dark:text-indigo-400">{m.dinnerCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">মোট মিল</span>
                    <strong className="text-gray-900 dark:text-slate-100">{m.totalMealsCount}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-slate-800/60">
                  <span className="text-gray-500 dark:text-slate-400">
                    খাবারের খরচ: <strong className="text-gray-900 dark:text-slate-100">৳{formatCurrency(m.foodCost)}</strong>
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">
                    বাজার করেছে: <strong className="text-emerald-600 dark:text-emerald-400">৳{formatCurrency(m.totalBazarDone)}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
