"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate, formatMonthYear, getCurrentMonthYear } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowDownLeft, ArrowUpRight, Wallet, Users, Plus,
  Trash2, ShoppingBasket, Zap, Search, CreditCard, Loader2,
  Calendar, Check, ChevronDown, ChevronUp, Tag, FileText,
  TrendingDown, TrendingUp, Home, Flame, Droplets, Wifi, ChefHat,
  Receipt, Layers, Info, Edit3
} from "lucide-react";
import { createPaymentAction, createExpenseAction, deletePaymentAction, upsertUtilityAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MoneyTransactionHubProps {
  payments: any[];
  expenses: any[];
  bazars: any[];
  members: any[];
  utilityBills?: any[];
  isAdmin: boolean;
  currentUserId: string;
  selectedMonth?: number;
  selectedYear?: number;
}

export function MoneyTransactionHub({
  payments: initialPayments,
  expenses: initialExpenses,
  bazars,
  members,
  utilityBills: initialUtilityBills = [],
  isAdmin,
  currentUserId,
  selectedMonth,
  selectedYear,
}: MoneyTransactionHubProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const { month: currMonth, year: currYear } = getCurrentMonthYear();
  const month = selectedMonth || currMonth;
  const year = selectedYear || currYear;
  const isCurrentMonth = month === currMonth && year === currYear;

  const [payments, setPayments] = useState(initialPayments);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [utilityBills, setUtilityBills] = useState(initialUtilityBills);

  const [activeTab, setActiveTab] = useState<"all" | "in" | "bazar" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMemberBreakdown, setExpandedMemberBreakdown] = useState<string | null>(null);

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [utilityDialogOpen, setUtilityDialogOpen] = useState(false);
  const [editingUtilityType, setEditingUtilityType] = useState<string>("GAS");
  const [submitting, setSubmitting] = useState(false);

  const memberCount = members.length > 0 ? members.length : 7;

  // Utility Bill Definitions & Defaults
  const BILL_CONFIG: Record<string, { label: string; icon: any; color: string; defaultAmt: number }> = {
    GAS: { label: t("গ্যাস সিলিন্ডার / বিল", "Gas Bill"), icon: Flame, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900", defaultAmt: 1400 },
    ELECTRICITY: { label: t("বিদ্যুৎ বিল", "Electricity Bill"), icon: Zap, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/60 border-yellow-200 dark:border-yellow-900", defaultAmt: 1750 },
    WATER: { label: t("পানি বিল", "Water Bill"), icon: Droplets, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900", defaultAmt: 700 },
    INTERNET: { label: t("ইন্টারনেট ও ওয়াইফাই", "Internet & Wifi"), icon: Wifi, color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-900", defaultAmt: 800 },
    COOK: { label: t("বুয়া / খালা বিল", "Cook / Maid Bill"), icon: ChefHat, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800", defaultAmt: 2100 },
    WASTE: { label: t("ময়লা বিল", "Waste Bill"), icon: Trash2, color: "text-slate-500 bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800", defaultAmt: 350 },
    RENT: { label: t("বাসা ভাড়া (মোট)", "House Rent"), icon: Home, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900", defaultAmt: 24500 },
  };

  // Resolved amounts for each utility bill
  const utilityMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const key of Object.keys(BILL_CONFIG)) {
      const found = utilityBills.find((u) => u.type === key);
      if (found) {
        map[key] = Number(found.amount) || 0;
      } else {
        // Check if any expense category matches
        const expMatch = expenses.filter((e) => e.category === key);
        const expSum = expMatch.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        map[key] = expSum > 0 ? expSum : (key === "RENT" ? members.reduce((sum, m) => sum + (Number(m.seatRent) || 3500), 0) : BILL_CONFIG[key].defaultAmt);
      }
    }
    return map;
  }, [utilityBills, expenses, members]);

  // Per-head shares for shared utilities (excluding rent which is per member seat)
  const perHeadMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const key of Object.keys(BILL_CONFIG)) {
      if (key !== "RENT") {
        map[key] = Math.round((utilityMap[key] || 0) / memberCount);
      }
    }
    return map;
  }, [utilityMap, memberCount]);

  const totalSharedUtilityPerHead = Object.values(perHeadMap).reduce((sum, amt) => sum + amt, 0);
  const totalSharedUtilityBills = Object.entries(utilityMap)
    .filter(([k]) => k !== "RENT")
    .reduce((sum, [_, amt]) => sum + amt, 0);
  const totalHouseRent = members.reduce((sum, m) => sum + (Number(m.seatRent) || 3500), 0);

  // 1. Calculations
  const totalIn = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalBazarSpent = bazars.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalExpenseSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalOut = totalBazarSpent + totalExpenseSpent;
  const netFund = totalIn - totalOut;

  const bazarPct = totalOut > 0 ? (totalBazarSpent / totalOut) * 100 : 0;
  const expPct = totalOut > 0 ? (totalExpenseSpent / totalOut) * 100 : 0;

  // 2. Member-wise deposits map
  const memberDepositMap: Record<string, { total: number; count: number }> = {};
  for (const m of members) {
    memberDepositMap[m.id] = { total: 0, count: 0 };
  }
  for (const p of payments) {
    const mId = p.memberId ?? p.member?.id;
    if (mId && memberDepositMap[mId]) {
      memberDepositMap[mId].total += Number(p.amount) || 0;
      memberDepositMap[mId].count += 1;
    }
  }

  // 3. Normalized all transactions feed
  const allTransactions = useMemo(() => {
    const list = [
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        originalId: p.id,
        type: "IN" as const,
        category: p.method,
        title: `${p.member?.user?.name ?? "Member"} ${t("জমা দিয়েছেন", "Deposited")}`,
        note: p.note || `${t("মাধ্যম", "Method")}: ${p.method}`,
        amount: Number(p.amount) || 0,
        date: new Date(p.date),
        person: p.member?.user?.name ?? "Member",
        avatar: p.member?.user?.image ?? null,
        isPayment: true,
        items: [] as any[],
        receiptUrl: null,
      })),
      ...bazars.map((b) => ({
        id: `baz-${b.id}`,
        originalId: b.id,
        type: "BAZAR" as const,
        category: "BAZAR",
        title: `${t("বাজার খরচ", "Bazar Expense")} - ${b.buyerMember?.user?.name ?? "Buyer"}`,
        note: b.note || (b.items ? b.items.map((it: any) => it.productName).join(", ") : "Items"),
        amount: Number(b.totalAmount) || 0,
        date: new Date(b.date),
        person: b.buyerMember?.user?.name ?? "Buyer",
        avatar: b.buyerMember?.user?.image ?? null,
        isPayment: false,
        items: b.items || [],
        receiptUrl: b.receiptUrl ?? null,
      })),
      ...expenses.map((e) => ({
        id: `exp-${e.id}`,
        originalId: e.id,
        type: "EXPENSE" as const,
        category: e.category || "OTHER",
        title: `${e.title}`,
        note: e.note || `${t("পরিশোধকারী", "Paid By")}: ${e.paidBy?.user?.name ?? "Member"}`,
        amount: Number(e.amount) || 0,
        date: new Date(e.date),
        person: e.paidBy?.user?.name ?? "Member",
        avatar: e.paidBy?.user?.image ?? null,
        isPayment: false,
        items: [] as any[],
        receiptUrl: null,
      })),
    ];
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [payments, bazars, expenses, t]);

  // Filter by Tab and Search Query
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (activeTab === "in" && tx.type !== "IN") return false;
      if (activeTab === "bazar" && tx.type !== "BAZAR") return false;
      if (activeTab === "expense" && tx.type !== "EXPENSE") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(q);
        const matchesPerson = tx.person.toLowerCase().includes(q);
        const matchesNote = tx.note.toLowerCase().includes(q);
        const matchesItems = tx.items.some((it: any) =>
          it.productName?.toLowerCase().includes(q)
        );
        return matchesTitle || matchesPerson || matchesNote || matchesItems;
      }
      return true;
    });
  }, [allTransactions, activeTab, searchQuery]);

  // 4. Record Deposit Action
  const handleAddDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const memberId = fd.get("memberId") as string;
    const amount = Number(fd.get("amount")) || 0;
    const method = fd.get("method") as string;
    const note = (fd.get("note") as string) || undefined;
    const dateStr = fd.get("date") as string;

    const selectedMember = members.find((m) => m.id === memberId);
    const newPayment = {
      id: `temp-${Date.now()}`,
      memberId,
      amount,
      method,
      note,
      date: new Date(dateStr),
      member: selectedMember,
    };

    setPayments((prev) => [newPayment, ...prev]);
    setDepositDialogOpen(false);

    try {
      await createPaymentAction({
        memberId,
        amount,
        method,
        date: new Date(dateStr),
        note,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Record Expense Action
  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const amount = Number(fd.get("amount")) || 0;
    const category = (fd.get("category") as string) || "OTHER";
    const paidById = fd.get("paidById") as string;
    const note = (fd.get("note") as string) || undefined;
    const dateStr = fd.get("date") as string;

    const selectedPaidBy = members.find((m) => m.id === paidById);
    const newExp = {
      id: `exp-temp-${Date.now()}`,
      title,
      amount,
      category,
      paidById,
      sharingMethod: "EQUAL",
      date: new Date(dateStr),
      note,
      paidBy: selectedPaidBy,
    };

    setExpenses((prev) => [newExp, ...prev]);
    setExpenseDialogOpen(false);

    try {
      await createExpenseAction({
        title,
        amount,
        category,
        paidById,
        sharingMethod: "EQUAL",
        date: new Date(dateStr),
        note,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Save Utility Bill Action
  const handleSaveUtilityBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount")) || 0;
    const note = (fd.get("note") as string) || undefined;

    setUtilityBills((prev) => {
      const idx = prev.findIndex((u) => u.type === editingUtilityType);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], amount, note };
        return next;
      }
      return [...prev, { id: `u-${Date.now()}`, type: editingUtilityType, amount, month, year, note }];
    });
    setUtilityDialogOpen(false);

    try {
      await upsertUtilityAction({
        type: editingUtilityType,
        amount,
        month,
        year,
        date: new Date(),
        note,
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm(t("আপনি কি এই পেমেন্ট রেকর্ডটি মুছে ফেলতে চান?", "Are you sure you want to delete this payment?"))) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePaymentAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Cashflow Summary Cards (3 KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: Money In (Total Deposits) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {t("মোট জমা (In)", "Money In")}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <ArrowDownLeft size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">
              {formatCurrency(totalIn)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium">
              {payments.length} {t("টি রেকর্ড", "records")}
            </p>
          </div>
        </div>

        {/* Card 2: Money Out (Total Expenses & Bazar) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {t("মোট খরচ (Out)", "Money Out")}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
              <ArrowUpRight size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 leading-tight">
              {formatCurrency(totalOut)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium truncate">
              {t("বাজার + ইউটিলিটি", "Bazar & Utility")}
            </p>
          </div>
        </div>

        {/* Card 3: Net Fund Balance (Centered on Mobile & Spans 2 cols) */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-1.5 w-full">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
              <Wallet size={15} />
            </div>
            <span className="text-xs font-extrabold text-gray-700 dark:text-slate-300">
              {t("হাতে থাকা মেস ফান্ড (Fund Balance)", "Remaining Fund Balance")}
            </span>
          </div>
          <div className="mt-2 sm:mt-3 text-center">
            <p className={cn("text-2xl sm:text-2xl font-black leading-tight", netFund >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400")}>
              {formatCurrency(netFund)}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium">
              {netFund >= 0
                ? t("ফান্ডে উদ্বৃত্ত রয়েছে", "Fund surplus available")
                : t("ফান্ডে ঘাটতি রয়েছে", "Fund deficit / shortage")}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Expense & Purchases Breakdown (Clean Minimal Redesign) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-slate-300 shrink-0">
              <ShoppingBasket size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100 truncate">
                {t("টাকা খরচের খাত ও মালামাল", "Where Money Was Spent")}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 truncate">
                {t("বাজার এবং অন্যান্য খরচের বিবরণ", "Breakdown of bazar purchases & bills")}
              </p>
            </div>
          </div>

          <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 shrink-0">
            {t("মোট:", "Total:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(totalOut)}</strong>
          </span>
        </div>

        {/* Minimal Progress Bar */}
        {totalOut > 0 && (
          <div className="space-y-1.5">
            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-slate-800">
              <div style={{ width: `${bazarPct}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${expPct}%` }} className="bg-indigo-500 h-full" />
            </div>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {t("বাজার:", "Bazar:")} <strong className="text-gray-800 dark:text-slate-200">{formatCurrency(totalBazarSpent)} ({bazarPct.toFixed(0)}%)</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                {t("ইউটিলিটি ও অন্যান্য:", "Utilities:")} <strong className="text-gray-800 dark:text-slate-200">{formatCurrency(totalExpenseSpent)} ({expPct.toFixed(0)}%)</strong>
              </span>
            </div>
          </div>
        )}

        {/* Minimal Clean Bazar Purchases List */}
        <div className="space-y-2 pt-1">
          {bazars.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-500 py-3 text-center bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl">
              {t("এই মাসে কোনো বাজার রেকর্ড নেই", "No bazar records for this month")}
            </p>
          ) : (
            <div className="space-y-2">
              {bazars.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                        {b.buyerMember?.user?.name ?? t("ক্রেতা", "Buyer")}
                      </p>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        • {formatShortDate(new Date(b.date))}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatCurrency(b.totalAmount)}
                    </span>
                  </div>

                  {/* Clean Minimal Item Tags */}
                  {b.items && b.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {b.items.map((it: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200/70 dark:border-slate-700/70 shadow-2xs"
                        >
                          {it.productName} ({it.quantity} {it.unit}) • {formatCurrency(it.quantity * it.unitPrice)}
                        </span>
                      ))}
                    </div>
                  ) : b.note ? (
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 italic">{b.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Clean Utility Expenses List if any */}
        {expenses.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <span className="text-[11px] font-extrabold text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
              <Zap size={13} className="text-indigo-500" />
              {t("অন্যান্য মেস খরচ", "Other Mess Expenses")} ({expenses.length})
            </span>
            <div className="space-y-1.5">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="p-2.5 px-3 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{e.title}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">
                      {e.category} • {formatShortDate(new Date(e.date))} • {e.paidBy?.user?.name ?? t("মেম্বার", "Member")}
                    </p>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. HOUSE RENT & ALL UTILITY BILLS (Minimal Clean Layout) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Home size={16} className="text-purple-500" />
              <span>{t("বাসা ভাড়া ও ইউটিলিটি বিলের বিবরণী", "House Rent & Utility Bills")}</span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t("মোট বিল এবং মেম্বারদের মাথাপিছু হিসাব", "Total bills and per-member shared charges")}
            </p>
          </div>

          {isAdmin && (
            <Dialog open={utilityDialogOpen} onOpenChange={setUtilityDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs font-bold gap-1.5 rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                  <Edit3 size={13} />
                  <span>{t("বিল আপডেট", "Update Bill")}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="text-sm font-black">{t("ইউটিলিটি বিল আপডেট করুন", "Update Utility Bill")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveUtilityBill} className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("বিলের খাত", "Bill Type")}</Label>
                    <Select value={editingUtilityType} onValueChange={(val) => { if (val) setEditingUtilityType(val); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GAS">{t("গ্যাস সিলিন্ডার / বিল", "Gas Bill")}</SelectItem>
                        <SelectItem value="ELECTRICITY">{t("বিদ্যুৎ বিল", "Electricity Bill")}</SelectItem>
                        <SelectItem value="WATER">{t("পানি বিল", "Water Bill")}</SelectItem>
                        <SelectItem value="INTERNET">{t("ইন্টারনেট ও ওয়াইফাই", "Internet & Wifi")}</SelectItem>
                        <SelectItem value="COOK">{t("বুয়া / খালা বিল", "Cook / Maid Bill")}</SelectItem>
                        <SelectItem value="WASTE">{t("ময়লা বিল", "Waste Bill")}</SelectItem>
                        <SelectItem value="RENT">{t("বাসা ভাড়া (মোট)", "House Rent")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bill-amt" className="text-xs">{t("মোট টাকার পরিমাণ", "Total Amount")} *</Label>
                    <Input id="bill-amt" name="amount" type="number" min="0" defaultValue={utilityMap[editingUtilityType] || 0} className="h-9 text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bill-note" className="text-xs">{t("নোট (ঐচ্ছিক)", "Note (Optional)")}</Label>
                    <Input id="bill-note" name="note" placeholder="e.g. 2 Cylinders, July Bill..." className="h-9 text-xs" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setUtilityDialogOpen(false)} className="flex-1 text-xs">{t("বাতিল", "Cancel")}</Button>
                    <Button type="submit" size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs" disabled={submitting}>
                      {submitting ? <Loader2 size={12} className="animate-spin mr-1" /> : null}{t("সংরক্ষণ করুন", "Save")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Clean Minimal Bill Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(BILL_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const totalAmt = utilityMap[key] || 0;
            const perHead = key === "RENT" ? Math.round(totalAmt / memberCount) : perHeadMap[key] || 0;

            return (
              <div
                key={key}
                className="p-2.5 rounded-2xl bg-gray-50/70 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800 flex flex-col justify-between gap-1.5 transition-all"
              >
                <div className="flex items-center justify-between text-gray-500 dark:text-slate-400">
                  <span className="text-[10px] font-bold truncate">{config.label}</span>
                  <Icon size={13} className="shrink-0 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-slate-100">
                    {formatCurrency(totalAmt)}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500">
                    {key === "RENT" ? (
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{t("সিটভেদে ভিন্ন", "By seat")}</span>
                    ) : (
                      <>
                        {t("মাথাপিছু:", "Per:")} <strong>{formatCurrency(perHead)}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-Member Breakdown in Clean Minimal Accordion */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users size={13} className="text-primary" />
              <span>{t("মেম্বারভিত্তিক মাথাপিছু বিলের হিসাব", "Per-Member Bill Share")}</span>
            </h4>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50/40 dark:bg-slate-800/20">
            {members.map((m, idx) => {
              const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
              const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              const memberRent = Number(m.seatRent) || 3500;
              const totalRequired = memberRent + totalSharedUtilityPerHead;
              const depositInfo = memberDepositMap[m.id] || { total: 0, count: 0 };
              const isExpanded = expandedMemberBreakdown === m.id;

              const seatText =
                typeof m.seat === "string"
                  ? m.seat
                  : m.seat?.label
                  ? (m.seat.room?.name
                      ? `${m.seat.room.name} (${m.seat.label})`
                      : m.seat.room?.roomNumber
                      ? `Room ${m.seat.room.roomNumber} (${m.seat.label})`
                      : m.seat.label)
                  : m.roomNo
                  ? `Room ${m.roomNo}`
                  : t("সদস্য", "Member");

              return (
                <div key={m.id} className="transition-all">
                  <div
                    onClick={() => setExpandedMemberBreakdown(isExpanded ? null : m.id)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-gray-100/60 dark:hover:bg-slate-800/60 cursor-pointer select-none"
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0 ring-1 ring-gray-200 dark:ring-slate-700">
                        <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                          {name}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                          {seatText}
                        </p>
                      </div>
                    </div>

                    {/* Rent + Utility Share Totals */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                          {t("ধার্যকৃত:", "Due:")} <span className="text-purple-600 dark:text-purple-400">{formatCurrency(totalRequired)}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">
                          {t("জমা:", "Paid:")} <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(depositInfo.total)}</strong>
                        </p>
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Itemized breakdown */}
                  {isExpanded && (
                    <div className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("🏠 বাসা ভাড়া", "🏠 House Rent")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(memberRent)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("🔥 গ্যাস", "🔥 Gas")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(perHeadMap.GAS || 0)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("⚡ বিদ্যুৎ", "⚡ Electricity")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(perHeadMap.ELECTRICITY || 0)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("💧 পানি", "💧 Water")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(perHeadMap.WATER || 0)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("📶 ওয়াইফাই", "📶 Wifi")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(perHeadMap.INTERNET || 0)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("🧹 বুয়া", "🧹 Maid")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(perHeadMap.COOK || 0)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                          <span className="text-gray-400 block">{t("🗑️ ময়লা", "🗑️ Waste")}</span>
                          <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(perHeadMap.WASTE || 0)}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60">
                          <span className="text-purple-600 dark:text-purple-400 font-bold block">{t("✨ মোট ধার্য", "✨ Total Due")}</span>
                          <strong className="text-purple-700 dark:text-purple-300 font-black">{formatCurrency(totalRequired)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Member-wise Deposits Grid (কে কত টাকা জমা দিয়েছে) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-slate-100">
              {t("মেম্বারদের জমা দেওয়া মোট টাকা", "Member Deposits Ledger")}
            </h4>
          </div>
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
            {t("মোট সংগৃহীত:", "Total Collected:")} {formatCurrency(totalIn)}
          </span>
        </div>

        {/* Row-wise Member Deposits List */}
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {members.map((m, idx) => {
            const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const depositInfo = memberDepositMap[m.id] || { total: 0, count: 0 };
            const hasDeposited = depositInfo.total > 0;

            const seatText =
              typeof m.seat === "string"
                ? m.seat
                : m.seat?.label
                ? (m.seat.room?.name
                    ? `${m.seat.room.name} (${m.seat.label})`
                    : m.seat.room?.roomNumber
                    ? `Room ${m.seat.room.roomNumber} (${m.seat.label})`
                    : m.seat.label)
                : m.roomNo
                ? `Room ${m.roomNo}`
                : t("সদস্য", "Member");

            return (
              <div
                key={m.id}
                className="py-2.5 px-2 sm:px-3 flex items-center justify-between gap-3 hover:bg-gray-50/60 dark:hover:bg-slate-800/40 rounded-2xl transition-all"
              >
                {/* Left: Avatar + Name + Room */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 ring-2 ring-primary/20">
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-slate-100 truncate">
                      {name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 truncate">
                      {seatText}
                    </p>
                  </div>
                </div>

                {/* Right: Deposit Amount + Count Badge */}
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-xs sm:text-sm font-black",
                    hasDeposited
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-400 dark:text-slate-500"
                  )}>
                    {formatCurrency(depositInfo.total)}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {hasDeposited
                      ? `${depositInfo.count} ${t("টি জমা", "deposit(s)")}`
                      : t("কোনো জমা নেই", "No deposit")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Transactions Statement & Ledger with Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs space-y-0">
        {/* Header & Controls */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-slate-100">
                {t("সম্পূর্ণ লেনদেন ও খরচের লেজার", "Full Transactions & Expense Statement")}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {t("সকল জমা, বাজার ও ইউটিলিটি খরচের তারিখভিত্তিক তালিকা", "Chronological list of all deposits, bazar purchases, and utility expenses")}
              </p>
            </div>

            {/* Admin Action Buttons */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Add Expense Modal */}
                <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8.5 px-3 text-xs font-bold gap-1.5 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl shadow-2xs cursor-pointer">
                      <Plus size={14} />
                      <span>{t("খরচ যোগ করুন", "Add Expense")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-black">{t("মেসের খরচ যোগ করুন", "Add Mess Expense")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddExpense} className="space-y-3 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="exp-title" className="text-xs">{t("খরচের বিবরণ (নাম)", "Expense Name")} *</Label>
                        <Input id="exp-title" name="title" placeholder="Gas cylinder, Filter, Wifi..." className="h-9 text-xs" required />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="exp-amt" className="text-xs">{t("টাকার পরিমাণ", "Amount")} *</Label>
                          <Input id="exp-amt" name="amount" type="number" min="1" placeholder="0" className="h-9 text-xs" required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("ক্যাটাগরি", "Category")}</Label>
                          <Select name="category" defaultValue="HOUSEHOLD">
                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HOUSEHOLD">{t("হাউসহোল্ড", "Household")}</SelectItem>
                              <SelectItem value="CLEANING">{t("ক্লিনিং", "Cleaning")}</SelectItem>
                              <SelectItem value="REPAIR">{t("মেরামত", "Repair")}</SelectItem>
                              <SelectItem value="OTHER">{t("অন্যান্য", "Other")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t("পরিশোধকারী", "Paid By")} *</Label>
                          <Select name="paidById" defaultValue={members[0]?.id ?? ""}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.user?.name ?? m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="exp-date" className="text-xs">{t("তারিখ", "Date")} *</Label>
                          <Input id="exp-date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-9 text-xs" required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="exp-note" className="text-xs">{t("নোট / বিবরণ", "Note")}</Label>
                        <Input id="exp-note" name="note" placeholder="Details..." className="h-9 text-xs" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setExpenseDialogOpen(false)} className="flex-1 text-xs">{t("বাতিল", "Cancel")}</Button>
                        <Button type="submit" size="sm" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs" disabled={submitting}>
                          {submitting ? <Loader2 size={12} className="animate-spin mr-1" /> : null}{t("সংরক্ষণ করুন", "Save")}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Add Deposit Modal */}
                <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8.5 px-3 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer">
                      <Plus size={14} />
                      <span>{t("টাকা জমা দিন", "Add Deposit")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-black">{t("টাকা জমা রেকর্ড করুন", "Record Deposit")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddDeposit} className="space-y-3 mt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("মেম্বার", "Member")} *</Label>
                        <Select name="memberId" defaultValue={members[0]?.id ?? ""}>
                          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.user?.name ?? m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="dep-amt" className="text-xs">{t("টাকার পরিমাণ", "Amount")} *</Label>
                          <Input id="dep-amt" name="amount" type="number" min="1" placeholder="8000" className="h-9 text-xs" required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t("মাধ্যম", "Method")}</Label>
                          <Select name="method" defaultValue="BKASH">
                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BKASH">bKash</SelectItem>
                              <SelectItem value="NAGAD">Nagad</SelectItem>
                              <SelectItem value="ROCKET">Rocket</SelectItem>
                              <SelectItem value="CASH">{t("ক্যাশ / নগদ", "Cash")}</SelectItem>
                              <SelectItem value="BANK_TRANSFER">{t("ব্যাংক ট্রান্সফার", "Bank Transfer")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dep-date" className="text-xs">{t("তারিখ", "Date")} *</Label>
                        <Input id="dep-date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-9 text-xs" required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dep-note" className="text-xs">{t("নোট / TrxID", "Note / TrxID")}</Label>
                        <Input id="dep-note" name="note" placeholder="TrxID..." className="h-9 text-xs" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setDepositDialogOpen(false)} className="flex-1 text-xs">{t("বাতিল", "Cancel")}</Button>
                        <Button type="submit" size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" disabled={submitting}>
                          {submitting ? <Loader2 size={12} className="animate-spin mr-1" /> : null}{t("সংরক্ষণ করুন", "Save")}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Search Bar & Category Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="inline-flex p-1 bg-gray-100 dark:bg-slate-800/80 rounded-2xl gap-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  activeTab === "all"
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs font-extrabold"
                    : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <span>{t("সব লেনদেন", "All")}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeTab === "all" ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100" : "bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                )}>
                  {allTransactions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("in")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  activeTab === "in"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold"
                    : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <ArrowDownLeft size={13} className="text-emerald-500 shrink-0" />
                <span>{t("জমা", "Deposits")}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeTab === "in" ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" : "bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                )}>
                  {payments.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bazar")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  activeTab === "bazar"
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-extrabold"
                    : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <ShoppingBasket size={13} className="text-amber-500 shrink-0" />
                <span>{t("বাজার", "Bazar")}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeTab === "bazar" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300" : "bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                )}>
                  {bazars.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("expense")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  activeTab === "expense"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold"
                    : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <Zap size={13} className="text-indigo-500 shrink-0" />
                <span>{t("খরচ", "Expenses")}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeTab === "expense" ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300" : "bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                )}>
                  {expenses.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("লেনদেন খুঁজুন...", "Search...")}
                className="h-8.5 pl-8 text-xs rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Transactions Feed List */}
        {filteredTransactions.length === 0 ? (
          <p className="text-center py-10 text-xs text-gray-400 dark:text-slate-500">
            {t("কোনো লেনদেন রেকর্ড পাওয়া যায়নি", "No transactions found")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === "IN";
              const isBazar = tx.type === "BAZAR";
              const isExpense = tx.type === "EXPENSE";

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
                          isIncome
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isBazar
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        )}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={18} />
                        ) : isBazar ? (
                          <ShoppingBasket size={18} />
                        ) : (
                          <Zap size={18} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100 truncate">
                            {tx.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] py-0 px-2 rounded-full font-bold",
                              isIncome
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                : isBazar
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                            )}
                          >
                            {tx.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                          {formatShortDate(tx.date)} • {tx.note}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-black",
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isBazar
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-indigo-600 dark:text-indigo-400"
                        )}
                      >
                        {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                      </span>

                      {tx.isPayment && isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(tx.originalId)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                          title="Delete payment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items purchased chips for Bazar entries */}
                  {isBazar && tx.items && tx.items.length > 0 && (
                    <div className="pl-12 flex flex-wrap gap-1.5 pt-0.5">
                      {tx.items.map((it: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200/70 dark:border-slate-700/70"
                        >
                          {it.productName} ({it.quantity} {it.unit}) • {formatCurrency(it.quantity * it.unitPrice)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
