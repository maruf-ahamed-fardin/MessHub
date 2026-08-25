"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate, formatDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Wallet, TrendingUp, TrendingDown, Receipt, UtensilsCrossed,
  ChefHat, Zap, Droplets, Flame, Wifi, Trash2, Home, CreditCard,
  Calendar, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft,
  FileText, UserPlus, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/useT";

export interface PersonalBalanceSheetProps {
  member: {
    id: string;
    seatRent: number;
    phone?: string | null;
    joinedAt: Date | string;
    avatar?: string | null;
    user: {
      name?: string | null;
      email: string;
      image?: string | null;
    };
    seat?: {
      label: string;
      room?: { name: string } | null;
    } | null;
  };
  totalPaid: number;
  totalMeals: number;
  mealRate: number;
  foodCost: number;
  guestMealCost: number;
  totalGuestMeals: number;
  utilityShare: number;
  utilityDetails: {
    buaBill: number;
    electricity: number;
    gas: number;
    water: number;
    internet: number;
    waste: number;
  };
  seatRent: number;
  otherExpenseShare: number;
  balance: number;
  paymentHistory: Array<{
    id: string;
    amount: number;
    date: Date | string;
    method: string;
    note?: string | null;
  }>;
  month: number;
  year: number;
}

export function PersonalBalanceSheet({
  member,
  totalPaid,
  totalMeals,
  mealRate,
  foodCost,
  guestMealCost,
  totalGuestMeals,
  utilityShare,
  utilityDetails,
  seatRent,
  otherExpenseShare,
  balance,
  paymentHistory,
  month,
  year,
}: PersonalBalanceSheetProps) {
  const T = useT();
  const [activeTab, setActiveTab] = useState<"summary" | "expenses" | "payments">("summary");

  const totalCost = foodCost + guestMealCost + utilityShare + seatRent + otherExpenseShare;
  const isCredit = balance >= 0;
  const initials = (member.user.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const expenseItems = [
    {
      id: "food",
      label: `${T.common.foodCost} (${totalMeals} মিল × ৳${mealRate})`,
      amount: foodCost,
      icon: UtensilsCrossed,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      id: "guest",
      label: `গেস্ট মিল চার্জ (${totalGuestMeals} টি গেস্ট মিল)`,
      amount: guestMealCost,
      icon: UserPlus,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    },
    {
      id: "bua",
      label: "বুয়া / কুক বিলের অংশ (Cook / Bua Share)",
      amount: utilityDetails.buaBill,
      icon: ChefHat,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    {
      id: "electricity",
      label: "বিদ্যুৎ / কারেন্ট বিলের অংশ (Electricity)",
      amount: utilityDetails.electricity,
      icon: Zap,
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
    {
      id: "gas_water",
      label: "গ্যাস ও পানি বিল (Gas & Water)",
      amount: utilityDetails.gas + utilityDetails.water,
      icon: Flame,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    },
    {
      id: "internet_waste",
      label: "ইন্টারনেট ও ময়লা বিল (Wifi & Waste)",
      amount: utilityDetails.internet + utilityDetails.waste,
      icon: Wifi,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: "rent",
      label: `${T.common.seatRent} (${member.seat?.room?.name ?? "Room"} - ${member.seat?.label ?? "Seat"})`,
      amount: seatRent,
      icon: Home,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    {
      id: "other",
      label: "মেসের অন্যান্য শেয়ার্ড খরচ (Flat Expenses)",
      amount: otherExpenseShare,
      icon: Layers,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Member Profile & Live Balance Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-xs">
              <AvatarImage src={member.user.image ?? member.avatar ?? undefined} />
              <AvatarFallback className="text-lg font-black bg-gradient-to-tr from-primary to-indigo-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-slate-100 leading-tight">
                {member.user.name ?? "Member"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{member.user.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] font-bold bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 rounded-md">
                  {member.seat ? `${member.seat.room?.name ?? "Room"} (${member.seat.label})` : "সিট বরাদ্দ নেই"}
                </span>
                {member.phone && (
                  <span className="text-[11px] text-gray-400 font-medium">📞 {member.phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* Running Balance Badge */}
          <div
            className={cn(
              "rounded-2xl p-4 sm:min-w-[220px] border flex flex-col justify-between",
              isCredit
                ? "bg-emerald-50/80 border-emerald-200/80 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300"
                : "bg-rose-50/80 border-rose-200/80 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                {T.common.currentBalance}
              </span>
              {isCredit ? (
                <span className="text-[10px] font-black bg-emerald-200 dark:bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-100">
                  জমা (Credit)
                </span>
              ) : (
                <span className="text-[10px] font-black bg-rose-200 dark:bg-rose-800 px-1.5 py-0.5 rounded text-rose-800 dark:text-rose-100">
                  বকেয়া (Due)
                </span>
              )}
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black tracking-tight">
                {isCredit ? "+" : ""}{formatCurrency(balance)}
              </p>
              <p className="text-[11px] opacity-75 mt-0.5">
                {isCredit ? T.common.youHaveCredit : T.common.youOwe}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three Quick Stat Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Payments */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">সর্বমোট জমা (Total Paid)</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-slate-100 mt-0.5 truncate">
              {formatCurrency(totalPaid)}
            </p>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">চলতি মাসের খরচ (Total Cost)</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-slate-100 mt-0.5 truncate">
              {formatCurrency(totalCost)}
            </p>
          </div>
        </div>

        {/* Meal Rate & Count */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">মোট মিল ও রেট</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-slate-100 mt-0.5 truncate">
              {totalMeals} টি <span className="text-xs font-normal text-gray-400">(রেট ৳{mealRate})</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800/60 p-1 rounded-xl border border-gray-200/80 dark:border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center select-none cursor-pointer",
            activeTab === "summary"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900"
          )}
        >
          হিসাব খাতা (Statement)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center select-none cursor-pointer",
            activeTab === "expenses"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900"
          )}
        >
          খরচের তালিকা ({expenseItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={cn(
            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center select-none cursor-pointer",
            activeTab === "payments"
              ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900"
          )}
        >
          জমার ইতিহাস ({paymentHistory.length})
        </button>
      </div>

      {/* 4. Tab 1: Comprehensive Itemized Expense Breakdown */}
      {(activeTab === "summary" || activeTab === "expenses") && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100">
                ব্যক্তিগত খরচের বিস্তারিত খতিয়ান (Cost Breakdown)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                চলতি মাসে আপনার জন্য ধার্যকৃত সব খাতের হিসাব
              </p>
            </div>
            <span className="text-xs font-extrabold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-lg">
              সর্বমোট ৳{formatCurrency(totalCost)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expenseItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center shrink-0", item.color)}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-black text-gray-900 dark:text-slate-100 shrink-0 ml-2">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Payment Deposit Transactions History */}
      {(activeTab === "summary" || activeTab === "payments") && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100">
                টাকা জমার লেনদেন হিস্ট্রি (Payment History)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                মেস ফান্ডে আপনার দেওয়া জমা ভাউচারসমূহ
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              জমা ৳{formatCurrency(totalPaid)}
            </span>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              চলতি মাসে এখনো কোনো টাকা জমা রেকর্ড নেই।
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {paymentHistory.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                        {p.method} পেমেন্ট জমা
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatDate(p.date)} {p.note ? `• ${p.note}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
