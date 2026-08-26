"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { SettlementSummary } from "@/types";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function SettlementOverview({ summary, isFinalized }: { summary: SettlementSummary; isFinalized: boolean }) {
  const { t } = usePreferences();

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-slate-100">{formatMonthYear(summary.month, summary.year)}</h2>
        <Badge
          className={cn(
            "font-black text-xs px-2.5 py-0.5 rounded-full border",
            isFinalized
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
          )}
        >
          {isFinalized ? t("চূড়ান্ত (লক করা)", "Finalized") : t("চলতি খসড়া", "Draft")}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: t("খাবার খরচ", "Food Expense"), value: formatCurrency(summary.totalFoodExpense) },
          { label: t("মোট মিল", "Total Meals"), value: t(`${summary.totalNormalMeals} টি`, `${summary.totalNormalMeals}`) },
          { label: t("মিল রেট", "Meal Rate"), value: `${formatCurrency(summary.mealRate)}/${t("মিল", "meal")}` },
          { label: t("মোট ইউটিলিটি", "Total Utility"), value: formatCurrency(summary.totalUtility) },
          { label: t("সক্রিয় মেম্বার", "Active Members"), value: t(`${summary.activeMembers} জন`, `${summary.activeMembers}`) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">{label}</p>
            <p className="font-bold text-sm text-gray-900 dark:text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
