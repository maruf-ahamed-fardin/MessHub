"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MemberStatusGridProps {
  members: any[];
}

export function MemberStatusGrid({ members }: MemberStatusGridProps) {
  const { t } = usePreferences();

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-primary" />
          <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
            {t(`${members.length} জন মেম্বারের লাইভ স্ট্যাটাস ও জমা-খরচের হিসাব`, `Live Status & Balances of ${members.length} Members`)}
          </h4>
        </div>
        <Link
          href="/rooms"
          className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <span>{t("রুম ও মেম্বারস", "Rooms & Members")}</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {members.map((m, idx) => {
          const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
          const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          const roomInfo = m.seat ? `${m.seat.room?.name ?? "Room"} (${m.seat.label})` : `Room 10${Math.floor(idx / 2) + 1}`;
          const totalPaid = m.totalPaid || 0;
          const balance = m.balance !== undefined ? m.balance : 0;
          const isCredit = balance >= 0;

          return (
            <div
              key={m.id}
              className="p-3 rounded-xl border border-gray-100/90 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/40 hover:bg-gray-50/80 dark:hover:bg-slate-800/70 transition-all flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{roomInfo}</p>
                </div>
              </div>

              {/* Deposit & Balance row */}
              <div className="pt-2 border-t border-gray-200/50 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 dark:text-slate-500">{t("জমা:", "Deposit:")}</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 dark:text-slate-500">{t("ব্যালেন্স:", "Balance:")}</span>
                  <span className={cn("font-bold", isCredit ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {isCredit ? "+" : ""}{formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
