"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { MemberSettlementSummary } from "@/types";
import { usePreferences } from "@/lib/context/PreferencesContext";
import {
  TrendingUp, AlertCircle, CheckCircle2,
  Utensils, Wallet, Home, ArrowRight, CreditCard
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MySettlementSummaryCardProps {
  mySummary: MemberSettlementSummary | null;
  mealRate: number;
}

export function MySettlementSummaryCard({ mySummary, mealRate }: MySettlementSummaryCardProps) {
  const { t } = usePreferences();

  if (!mySummary) return null;

  const isCredit = mySummary.balance >= 0;
  const isZero = Math.abs(mySummary.balance) < 1;
  const otherAndRentCost = (mySummary.seatRent || 0) + (mySummary.utilityCost || 0) + (mySummary.otherCost || 0) + (mySummary.guestMealCost || 0);

  return (
    <div
      className={cn(
        "rounded-3xl border p-4 sm:p-6 transition-all shadow-sm relative overflow-hidden",
        isZero
          ? "bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-slate-900/5 border-blue-200 dark:border-blue-900/60"
          : isCredit
          ? "bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-900/60"
          : "bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-rose-600/5 border-rose-200 dark:border-rose-900/60"
      )}
    >
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs",
              isZero
                ? "bg-blue-600"
                : isCredit
                ? "bg-gradient-to-tr from-emerald-600 to-teal-500"
                : "bg-gradient-to-tr from-rose-600 to-orange-500"
            )}
          >
            {isZero ? (
              <CheckCircle2 size={22} />
            ) : isCredit ? (
              <TrendingUp size={22} />
            ) : (
              <AlertCircle size={22} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                {t("আপনার চলতি মাসের ব্যক্তিগত হিসাব", "My Personal Monthly Settlement")}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                  isZero
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                    : isCredit
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                )}
              >
                {isZero ? t("হিসাব পরিশোধিত", "Settled Up") : isCredit ? t("ফেরত পাবেন (Credit)", "Will Receive (Credit)") : t("বকেয়া জমা দিন (Due)", "Due to Pay")}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-slate-100 mt-1">
              {isZero ? (
                t("আপনার চলতি মাসের কোনো দেনা বা পাওনা নেই।", "You have zero dues or balance for this month.")
              ) : isCredit ? (
                <span>
                  {t("মেস আপনাকে ফেরত দিবে:", "The mess owes you:")}{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                    +{formatCurrency(mySummary.balance)}
                  </strong>
                </span>
              ) : (
                <span>
                  {t("মেসে আপনার বকেয়া জমা দিতে হবে:", "You need to pay to the mess:")}{" "}
                  <strong className="text-rose-600 dark:text-rose-400 font-black">
                    {formatCurrency(Math.abs(mySummary.balance))}
                  </strong>
                </span>
              )}
            </h2>
          </div>
        </div>

        {!isCredit && !isZero && (
          <Link href="/payments">
            <Button
              size="sm"
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs shrink-0 cursor-pointer"
            >
              <CreditCard size={14} />
              <span>{t("এখনই পেমেন্ট করুন", "Pay Due Now")}</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        )}
      </div>

      {/* 4 Breakdown KPI Tiles in 4 Rows on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        {/* 1. Food Cost */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-500 shrink-0 border border-amber-200/60 dark:border-amber-900/40">
              <Utensils size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate">{t("খাবার খরচ", "Food Cost")}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {t(`${mySummary.totalMeals} টি মিল @ ৳${mealRate}`, `${mySummary.totalMeals} meals @ ৳${mealRate}`)}
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 sm:mt-1 shrink-0">
            {formatCurrency(mySummary.foodCost)}
          </p>
        </div>

        {/* 2. Rent & Utilities */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-500 shrink-0 border border-blue-200/60 dark:border-blue-900/40">
              <Home size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate">{t("সিট ও ইউটিলিটি", "Rent & Utilities")}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {t(`ভাড়া ৳${mySummary.seatRent} + বিল ৳${mySummary.utilityCost}`, `Rent ৳${mySummary.seatRent} + Util ৳${mySummary.utilityCost}`)}
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 sm:mt-1 shrink-0">
            {formatCurrency(otherAndRentCost)}
          </p>
        </div>

        {/* 3. Total Paid */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-200/60 dark:border-emerald-900/40">
              <Wallet size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate">{t("মোট জমা দিয়েছেন", "Total Paid")}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {t(`মোট খরচ ৳${mySummary.totalCost}`, `Total Cost ৳${mySummary.totalCost}`)}
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 sm:mt-1 shrink-0">
            {formatCurrency(mySummary.totalPaid)}
          </p>
        </div>

        {/* 4. Final Balance */}
        <div
          className={cn(
            "rounded-2xl p-3 sm:p-3.5 shadow-2xs border flex sm:flex-col items-center sm:items-start justify-between gap-2",
            isZero
              ? "bg-blue-50/90 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900"
              : isCredit
              ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900"
              : "bg-rose-50/90 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                isZero
                  ? "bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                  : isCredit
                  ? "bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-rose-100 text-rose-600 border-rose-300 dark:bg-rose-900 dark:text-rose-300 dark:border-rose-800"
              )}
            >
              {isZero ? <CheckCircle2 size={15} /> : isCredit ? <TrendingUp size={15} /> : <AlertCircle size={15} />}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-xs font-bold truncate",
                  isZero
                    ? "text-blue-800 dark:text-blue-300"
                    : isCredit
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-rose-800 dark:text-rose-300"
                )}
              >
                {isZero ? t("ব্যালেন্স", "Balance") : isCredit ? t("ফেরত পাবেন", "Refund Credit") : t("মোট দেনা", "Total Due")}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                {isCredit ? t("মেস থেকে পাওনাদার", "Surplus credit in mess") : t("মেসকে পরিশোধযোগ্য", "Payable to mess")}
              </p>
            </div>
          </div>
          <p
            className={cn(
              "text-sm sm:text-base font-black sm:mt-1 shrink-0",
              isZero
                ? "text-blue-600 dark:text-blue-400"
                : isCredit
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {isCredit ? "+" : ""}{formatCurrency(mySummary.balance)}
          </p>
        </div>
      </div>
    </div>
  );
}
