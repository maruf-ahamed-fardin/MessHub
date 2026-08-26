"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberSettlementSummary } from "@/types";
import { Separator } from "@/components/ui/separator";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Utensils, UserPlus, Zap, Home, Boxes, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";

export function MemberSettlementCard({
  data,
  isCurrentMember = false,
}: {
  data: MemberSettlementSummary;
  isCurrentMember?: boolean;
}) {
  const isCredit = data.balance >= 0;
  const isZero = Math.abs(data.balance) < 1;
  const initials = data.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const { t } = usePreferences();

  const rows = [
    { label: t("খাবার খরচ", "Food Cost"), value: data.foodCost, meals: data.totalMeals, icon: Utensils, iconColor: "text-amber-500" },
    { label: t("গেস্ট মিল", "Guest Meals"), value: data.guestMealCost, icon: UserPlus, iconColor: "text-indigo-500" },
    { label: t("ইউটিলিটি বিল", "Utilities"), value: data.utilityCost, icon: Zap, iconColor: "text-blue-500" },
    { label: t("সিট ভাড়া", "Seat Rent"), value: data.seatRent, icon: Home, iconColor: "text-purple-500" },
    { label: t("অন্যান্য খরচ", "Other"), value: data.otherCost, icon: Boxes, iconColor: "text-emerald-500" },
  ];

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-2xs transition-all hover:shadow-xs",
        isCurrentMember
          ? "border-primary/80 dark:border-primary/60 ring-2 ring-primary/20"
          : "border-gray-200 dark:border-slate-800"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/40">
        <Avatar className="h-8.5 w-8.5 shrink-0 ring-1 ring-gray-200 dark:ring-slate-700">
          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">{data.memberName}</p>
            {isCurrentMember && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                {t("আপনি", "You")}
              </span>
            )}
          </div>
        </div>

        <span
          className={cn(
            "text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1",
            isZero
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              : isCredit
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          )}
        >
          {isZero ? (
            <Check size={11} />
          ) : isCredit ? (
            <ArrowUpRight size={12} />
          ) : (
            <ArrowDownRight size={12} />
          )}
          {isCredit ? "+" : ""}{formatCurrency(Math.abs(data.balance))}
        </span>
      </div>

      {/* Breakdown Rows */}
      <div className="px-4 py-3 space-y-2">
        {rows.map(({ label, value, meals, icon: Icon, iconColor }: any) =>
          value > 0 ? (
            <div key={label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                <Icon size={12} className={cn("shrink-0", iconColor)} />
                <span>
                  {label}
                  {meals ? ` (${t(`${meals} টি মিল`, `${meals} meals`)})` : ""}
                </span>
              </div>
              <span className="text-gray-900 dark:text-slate-100 font-semibold">{formatCurrency(value)}</span>
            </div>
          ) : null
        )}

        <Separator className="my-2" />

        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-gray-700 dark:text-slate-300">{t("মোট প্রযোজ্য খরচ", "Total Cost Due")}</span>
          <span className="text-gray-900 dark:text-slate-100 font-extrabold">{formatCurrency(data.totalCost)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
          <span>{t("পরিশোধ / জমা করেছে", "Total Paid / Deposited")}</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.totalPaid)}</span>
        </div>
      </div>

      {/* Footer Banner */}
      <div
        className={cn(
          "px-4 py-2.5 text-xs font-bold flex items-center justify-between border-t",
          isZero
            ? "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/60"
            : isCredit
            ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/60"
            : "bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/60"
        )}
      >
        <span>
          {isZero
            ? t("পরিশোধিত স্থিতি:", "Settled Status:")
            : isCredit
            ? t("মেস থেকে ফেরত পাবে:", "Will Refund from Mess:")
            : t("মেসে বকেয়া দিতে হবে:", "Must Pay to Mess:")}
        </span>
        <span className="text-sm font-black">
          {isCredit ? "+" : ""}{formatCurrency(Math.abs(data.balance))}
        </span>
      </div>
    </div>
  );
}

