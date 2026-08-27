"use client";

import { TrendingUp, ShoppingBag, Utensils, Wallet, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { GeminiAiIcon } from "./GeminiAiIcon";

interface AIMessStatsCardProps {
  data: {
    mealRate: number;
    totalFoodExpense: number;
    totalMeals: number;
    userDeposit: number;
    userMeals: number;
    userBalance: number;
    userName: string;
  };
}

export function AIMessStatsCard({ data }: AIMessStatsCardProps) {
  const { t } = usePreferences();

  const isPositive = data.userBalance >= 0;

  return (
    <div className="my-2 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/40 dark:to-slate-900 overflow-hidden shadow-md text-xs">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <TrendingUp size={14} />
          <span>{t("মেস লাইভ আর্থিক ও মিল সামারি", "Mess Live Financial & Meal Summary")}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-700/80 px-2 py-0.5 rounded-lg">
          <GeminiAiIcon size={12} className="text-amber-300 animate-pulse" />
          <span>চলতি মাস</span>
        </div>
      </div>

      <div className="p-3.5 space-y-2.5">
        {/* 4 Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* 1. Meal Rate */}
          <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-semibold mb-0.5">
              <Utensils size={11} className="text-amber-500" />
              <span>{t("বর্তমান মিল রেট", "Current Meal Rate")}</span>
            </div>
            <p className="text-sm font-black text-amber-600 dark:text-amber-400">
              ৳{Number(data.mealRate).toFixed(2)}
            </p>
          </div>

          {/* 2. Total Food Expense */}
          <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-semibold mb-0.5">
              <ShoppingBag size={11} className="text-indigo-500" />
              <span>{t("মোট বাজার খরচ", "Total Bazar Expense")}</span>
            </div>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
              ৳{Number(data.totalFoodExpense).toLocaleString()}
            </p>
          </div>

          {/* 3. Total Meals */}
          <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-semibold mb-0.5">
              <Utensils size={11} className="text-emerald-500" />
              <span>{t("মোট মেস মিল", "Total Mess Meals")}</span>
            </div>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {data.totalMeals} টি
            </p>
          </div>

          {/* 4. User Balance */}
          <div className="bg-white dark:bg-slate-800/80 p-2 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-semibold mb-0.5">
              <Wallet size={11} className={isPositive ? "text-emerald-500" : "text-rose-500"} />
              <span>{t("আপনার ব্যালেন্স", "Your Balance")}</span>
            </div>
            <p className={`text-sm font-black ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              ৳{Number(data.userBalance).toLocaleString()}
            </p>
          </div>
        </div>

        {/* User stats overview */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <span>{data.userName}: {t("জমা", "Deposit")} ৳{data.userDeposit.toLocaleString()} ({data.userMeals} {t("মিল", "meals")})</span>
          <Link
            href="/settlement"
            className="font-bold underline text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5 hover:opacity-80"
          >
            <span>{t("হিসাব দেখুন", "View Breakdown")}</span>
            <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
