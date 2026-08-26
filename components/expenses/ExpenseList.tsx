"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import {
  EXPENSE_CATEGORY_LABELS_BN,
  EXPENSE_CATEGORY_LABELS_EN,
  UTILITY_LABELS_BN,
  UTILITY_LABELS_EN,
  SHARING_METHOD_LABELS_BN,
  SHARING_METHOD_LABELS_EN,
} from "@/lib/constants/categories";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function ExpenseList({ expenses }: { expenses: any[]; isAdmin: boolean }) {
  const { t, language } = usePreferences();
  const categoryLabels = language === "bn" ? EXPENSE_CATEGORY_LABELS_BN : EXPENSE_CATEGORY_LABELS_EN;
  const sharingLabels = language === "bn" ? SHARING_METHOD_LABELS_BN : SHARING_METHOD_LABELS_EN;

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={t("এই মাসে কোনো ফ্ল্যাট খরচ নেই", "No expenses this month")}
        description={t("অন্যান্য খরচসমূহ এখানে প্রদর্শিত হবে।", "Non-food expenses will appear here.")}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl divide-y divide-gray-100 dark:divide-slate-800">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{expense.title}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                {categoryLabels[expense.category as keyof typeof categoryLabels] ?? expense.category}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {expense.paidBy?.user?.name} · {formatShortDate(expense.date)} · {sharingLabels[expense.sharingMethod as keyof typeof sharingLabels] ?? expense.sharingMethod}
            </p>
          </div>
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 shrink-0">{formatCurrency(Number(expense.amount))}</p>
        </div>
      ))}
    </div>
  );
}

export function UtilitySection({ utilities }: { utilities: any[]; isAdmin: boolean; month: number; year: number }) {
  const { t, language } = usePreferences();
  const utilityLabels = language === "bn" ? UTILITY_LABELS_BN : UTILITY_LABELS_EN;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl divide-y divide-gray-100 dark:divide-slate-800">
      {utilities.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("এই মাসে কোনো ইউটিলিটি বিল নেই", "No utility bills this month")}
          description={t("বিদ্যুৎ, গ্যাস, পানি ও ইন্টারনেট বিল যুক্ত করুন।", "Add electricity, gas, water, and internet bills.")}
        />
      ) : (
        utilities.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{utilityLabels[u.type as keyof typeof utilityLabels] ?? u.type}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{formatCurrency(Number(u.amount))}</p>
          </div>
        ))
      )}
      {utilities.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/60 font-bold">
          <p className="text-sm text-gray-900 dark:text-slate-100">{t("সর্বমোট", "Total")}</p>
          <p className="text-sm text-gray-900 dark:text-slate-100">
            {formatCurrency(utilities.reduce((sum: number, u: any) => sum + Number(u.amount), 0))}
          </p>
        </div>
      )}
    </div>
  );
}
