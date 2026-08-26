"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { PAYMENT_METHOD_LABELS_BN, PAYMENT_METHOD_LABELS_EN } from "@/lib/constants/categories";

const METHOD_COLORS: Record<string, string> = {
  BKASH: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800",
  NAGAD: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
  ROCKET: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  BANK_TRANSFER: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  CASH: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800",
  OTHER: "",
};

export function PaymentList({ payments }: { payments: any[]; isAdmin: boolean }) {
  const { t, language } = usePreferences();
  const methodMap = language === "bn" ? PAYMENT_METHOD_LABELS_BN : PAYMENT_METHOD_LABELS_EN;

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title={t("এই মাসে কোনো পেমেন্ট রেকর্ড নেই", "No payments this month")}
        description={t("পেমেন্ট যুক্ত করতে ওপরের বাটন ব্যবহার করুন।", "Use the button above to record a payment.")}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl divide-y divide-gray-100 dark:divide-slate-800">
      {payments.map((payment) => {
        const name = payment.member?.user?.name ?? "Unknown";
        const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{name}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{formatShortDate(payment.date)}</p>
            </div>
            <Badge variant="outline" className={`text-xs shrink-0 ${METHOD_COLORS[payment.method] ?? ""}`}>
              {methodMap[payment.method as keyof typeof methodMap] ?? payment.method}
            </Badge>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
              +{formatCurrency(Number(payment.amount))}
            </p>
          </div>
        );
      })}
    </div>
  );
}
