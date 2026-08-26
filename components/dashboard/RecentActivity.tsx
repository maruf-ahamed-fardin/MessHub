"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { formatRelativeDate } from "@/lib/utils/date";
import { ShoppingBasket, CreditCard, UserPlus, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface RecentActivityProps {
  bazar: any[];
  payments: any[];
  guestMeals: any[];
}

export function RecentActivity({ bazar, payments, guestMeals }: RecentActivityProps) {
  const { t } = usePreferences();

  const activities = [
    ...bazar.map((b) => ({
      id: `baz-${b.id}`,
      type: "bazar" as const,
      title: `${b.buyerMember?.user?.name ?? "Member"} ${t("বাজার করেছেন", "bought bazar")}`,
      sub: t("মেস বাজার", "Mess Bazar"),
      amount: Number(b.totalAmount),
      time: b.createdAt,
      href: "/bazar",
    })),
    ...payments.map((p) => ({
      id: `pay-${p.id}`,
      type: "payment" as const,
      title: `${p.member?.user?.name ?? "Member"} ${t("টাকা জমা দিয়েছেন", "deposited money")}`,
      sub: p.note || `${t("মেথড:", "Method:")} ${p.method}`,
      amount: Number(p.amount),
      time: p.createdAt,
      href: "/payments",
    })),
    ...guestMeals.map((gm) => ({
      id: `gst-${gm.id}`,
      type: "guest" as const,
      title: `${gm.addedBy?.user?.name ?? "Member"} ${t("গেস্ট মিল যোগ করেছেন", "added guest meal")}`,
      sub: `${t("গেস্ট:", "Guest:")} ${gm.guestName}`,
      amount: null,
      time: gm.createdAt,
      href: "/meals",
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

  const icons = {
    bazar: { icon: ShoppingBasket, bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800" },
    payment: { icon: CreditCard, bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" },
    guest: { icon: UserPlus, bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800" },
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs space-y-0">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
            {t("সাম্প্রতিক লেনদেন ও অ্যাক্টিভিটি", "Recent Transactions & Activity")}
          </h4>
        </div>
        <Link href="/payments" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
          <span>{t("সব দেখুন", "View All")}</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {activities.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
            {t("কোনো সাম্প্রতিক অ্যাক্টিভিটি নেই।", "No recent activity found.")}
          </p>
        ) : (
          activities.map((a) => {
            const { icon: Icon, bg } = icons[a.type];
            return (
              <Link
                key={a.id}
                href={a.href}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{a.title}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5">{formatRelativeDate(a.time)} • {a.sub}</p>
                  </div>
                </div>
                {a.amount !== null && (
                  <span className="text-xs font-bold text-gray-900 dark:text-slate-100 shrink-0 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {formatCurrency(a.amount)}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
