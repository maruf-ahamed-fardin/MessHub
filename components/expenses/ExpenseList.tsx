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
import { Receipt, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { deleteExpenseAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function ExpenseList({ expenses, isAdmin }: { expenses: any[]; isAdmin: boolean }) {
  const { t, language } = usePreferences();
  const router = useRouter();
  const categoryLabels = language === "bn" ? EXPENSE_CATEGORY_LABELS_BN : EXPENSE_CATEGORY_LABELS_EN;
  const sharingLabels = language === "bn" ? SHARING_METHOD_LABELS_BN : SHARING_METHOD_LABELS_EN;

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm(t("আপনি কি এই খরচটি মুছে ফেলতে চান?", "Are you sure you want to delete this expense?"))) return;
    try {
      await deleteExpenseAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={t("এই মাসে কোনো মেস খরচ নেই", "No mess expenses this month")}
        description={t("ফিল্টার সার্ভিস, ক্লিনিং সামগ্রী বা অন্যান্য খরচ যোগ করুন।", "Add filter, cleaning, or other shared expenses.")}
      />
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50/30 dark:bg-slate-800/20">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center justify-between gap-3 p-3.5 sm:px-4 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 border border-rose-200/50 dark:border-rose-900/50">
              <Receipt size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100 truncate">{expense.title}</p>
                <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full font-bold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                  {categoryLabels[expense.category as keyof typeof categoryLabels] ?? expense.category}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                {expense.paidBy?.user?.name ?? expense.paidBy?.name} · {formatShortDate(expense.date)} · {sharingLabels[expense.sharingMethod as keyof typeof sharingLabels] ?? expense.sharingMethod}
                {expense.note ? ` · ${expense.note}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <p className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(Number(expense.amount))}</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleDelete(expense.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                title="Delete expense"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UtilitySection({ utilities }: { utilities: any[]; isAdmin: boolean; month: number; year: number }) {
  const { t, language } = usePreferences();
  const utilityLabels = language === "bn" ? UTILITY_LABELS_BN : UTILITY_LABELS_EN;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl divide-y divide-gray-100 dark:divide-slate-800 overflow-hidden">
      {utilities.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t("এই মাসে কোনো ইউটিলিটি বিল নেই", "No utility bills this month")}
          description={t("বিদ্যুৎ, গ্যাস, পানি ও ইন্টারনেট বিল যুক্ত করুন।", "Add electricity, gas, water, and internet bills.")}
        />
      ) : (
        utilities.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-slate-200">{utilityLabels[u.type as keyof typeof utilityLabels] ?? u.type}</p>
            <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100">{formatCurrency(Number(u.amount))}</p>
          </div>
        ))
      )}
      {utilities.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/60 font-black">
          <p className="text-xs sm:text-sm text-gray-900 dark:text-slate-100">{t("সর্বমোট", "Total")}</p>
          <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-black">
            {formatCurrency(utilities.reduce((sum: number, u: any) => sum + Number(u.amount), 0))}
          </p>
        </div>
      )}
    </div>
  );
}
