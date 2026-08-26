"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { SettlementSummary } from "@/types";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Utensils, PieChart, Users, Zap, HelpCircle, Calculator } from "lucide-react";

export function SettlementOverview({ summary, isFinalized }: { summary: SettlementSummary; isFinalized: boolean }) {
  const { t } = usePreferences();

  const metrics = [
    { label: t("খাবার / বাজার খরচ", "Food Expense"), value: formatCurrency(summary.totalFoodExpense), icon: Utensils, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/60" },
    { label: t("মোট খাওয়া মিল", "Total Meals"), value: t(`${summary.totalNormalMeals} টি`, `${summary.totalNormalMeals} meals`), icon: PieChart, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/60" },
    { label: t("লাইভ মিল রেট", "Live Meal Rate"), value: `${formatCurrency(summary.mealRate)}`, sub: t("/মিল", "/meal"), icon: Calculator, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60" },
    { label: t("মোট ইউটিলিটি বিল", "Total Utility"), value: formatCurrency(summary.totalUtility), icon: Zap, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60" },
    { label: t("সক্রিয় মেম্বার", "Active Members"), value: t(`${summary.activeMembers} জন`, `${summary.activeMembers} members`), icon: Users, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/60" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-black text-base sm:text-lg text-gray-900 dark:text-slate-100">
            {t(`${formatMonthYear(summary.month, summary.year)} - মেসের সার্বিক হিসাব`, `${formatMonthYear(summary.month, summary.year)} - Mess Overview`)}
          </h2>
        </div>
        <Badge
          className={cn(
            "font-black text-xs px-3 py-1 rounded-full border shadow-2xs",
            isFinalized
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
          )}
        >
          {isFinalized ? t("✓ চূড়ান্ত (লক করা)", "✓ Finalized (Locked)") : t("● চলতি মাসের খসড়া", "● Draft in Progress")}
        </Badge>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="p-3 bg-gray-50/70 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", color)}>
                <Icon size={13} />
              </div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 truncate">{label}</p>
            </div>
            <p className="font-black text-sm sm:text-base text-gray-900 dark:text-slate-100">
              {value} {sub && <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500">{sub}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Math Explanation Note */}
      <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
        <HelpCircle size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>{t("হিসাবের নিয়ম:", "Formula:")}</strong> {t("প্রতি মিলের খরচ = মোট বাজার খরচ ÷ মোট খাওয়া মিল। প্রতিটি মেম্বারের চূড়ান্ত ব্যালেন্স = তার মোট জমা টাকা - (খাবার খরচ + সিট ভাড়া + ইউটিলিটি বিল)।", "Live Meal Rate = Total Bazar Expense ÷ Total Meals. Member Balance = Total Paid - (Food Cost + Rent + Utilities).")}
        </p>
      </div>
    </div>
  );
}

