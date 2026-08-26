"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberSettlementSummary } from "@/types";
import { Separator } from "@/components/ui/separator";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function MemberSettlementCard({ data }: { data: MemberSettlementSummary }) {
  const isCredit = data.balance >= 0;
  const initials = data.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const { t } = usePreferences();

  const rows = [
    { label: t("খাবার খরচ", "Food Cost"), value: data.foodCost, meals: data.totalMeals },
    { label: t("গেস্ট মিল", "Guest Meals"), value: data.guestMealCost },
    { label: t("ইউটিলিটি বিল", "Utilities"), value: data.utilityCost },
    { label: t("সিট ভাড়া", "Seat Rent"), value: data.seatRent },
    { label: t("অন্যান্য খরচ", "Other"), value: data.otherCost },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <p className="font-bold text-sm text-gray-900 dark:text-slate-100 flex-1">{data.memberName}</p>
        <span className={cn("text-sm font-bold", isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
          {isCredit ? "+" : ""}{formatCurrency(Math.abs(data.balance))}
        </span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {rows.map(({ label, value, meals }: any) => value > 0 ? (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-slate-400">
              {label}{meals ? ` (${t(`${meals} টি মিল`, `${meals} meals`)})` : ""}
            </span>
            <span className="text-gray-900 dark:text-slate-100 font-semibold">{formatCurrency(value)}</span>
          </div>
        ) : null)}
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="text-gray-800 dark:text-slate-200">{t("মোট খরচ", "Total Due")}</span>
          <span className="text-gray-900 dark:text-slate-100">{formatCurrency(data.totalCost)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>{t("পরিশোধ করেছে", "Total Paid")}</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.totalPaid)}</span>
        </div>
      </div>
      <div className={cn("px-4 py-2.5 text-xs font-bold flex justify-between",
        isCredit ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300")}>
        <span>{isCredit ? t("ফেরত পাবে", "Credit") : t("দিতে হবে", "Due")}</span>
        <span>{formatCurrency(Math.abs(data.balance))}</span>
      </div>
    </div>
  );
}
