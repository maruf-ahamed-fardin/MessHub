"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowDownLeft, ArrowUpRight, Wallet, Users, Plus,
  Trash2, ShoppingBasket, Receipt, CreditCard, Loader2,
  Calendar, Check,
} from "lucide-react";
import { createPaymentAction, createExpenseAction, deletePaymentAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/useT";

interface MoneyTransactionHubProps {
  payments: any[];
  expenses: any[];
  bazars: any[];
  members: any[];
  isAdmin: boolean;
  currentUserId: string;
}

export function MoneyTransactionHub({
  payments: initialPayments,
  expenses: initialExpenses,
  bazars,
  members,
  isAdmin,
  currentUserId,
}: MoneyTransactionHubProps) {
  const router = useRouter();
  const T = useT();
  const [payments, setPayments] = useState(initialPayments);
  const [expenses, setExpenses] = useState(initialExpenses);

  const [activeTab, setActiveTab] = useState<"all" | "in" | "out">("all");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Calculations
  const totalIn = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalBazarSpent = bazars.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalExpenseSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalOut = totalBazarSpent + totalExpenseSpent;
  const netFund = totalIn - totalOut;

  // 2. Member-wise deposits map
  const memberDepositMap: Record<string, number> = {};
  for (const m of members) {
    memberDepositMap[m.id] = 0;
  }
  for (const p of payments) {
    const mId = p.memberId ?? p.member?.id;
    if (mId) {
      memberDepositMap[mId] = (memberDepositMap[mId] || 0) + (Number(p.amount) || 0);
    }
  }

  // 3. Combine all transactions in chronological order
  const allTransactions = [
    ...payments.map((p) => ({
      id: `pay-${p.id}`,
      originalId: p.id,
      type: "IN" as const,
      category: p.method,
      title: `${p.member?.user?.name ?? "Member"} ${T.payments.deposited}`,
      note: p.note || `${T.payments.method}: ${p.method}`,
      amount: Number(p.amount) || 0,
      date: new Date(p.date),
      person: p.member?.user?.name ?? "Member",
      isPayment: true,
    })),
    ...bazars.map((b) => ({
      id: `baz-${b.id}`,
      originalId: b.id,
      type: "OUT" as const,
      category: "BAZAR",
      title: `${T.sidebar.bazar} (${b.buyerMember?.user?.name ?? "Buyer"})`,
      note: b.note || (b.items ? b.items.map((it: any) => it.productName).join(", ") : "Items"),
      amount: Number(b.totalAmount) || 0,
      date: new Date(b.date),
      person: b.buyerMember?.user?.name ?? "Buyer",
      isPayment: false,
    })),
    ...expenses.map((e) => ({
      id: `exp-${e.id}`,
      originalId: e.id,
      type: "OUT" as const,
      category: e.category || "EXPENSE",
      title: `${e.title}`,
      note: e.note || `${T.payments.paidBy}: ${e.paidBy?.user?.name ?? "Member"}`,
      amount: Number(e.amount) || 0,
      date: new Date(e.date),
      person: e.paidBy?.user?.name ?? "Member",
      isPayment: false,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredTransactions =
    activeTab === "in"
      ? allTransactions.filter((t) => t.type === "IN")
      : activeTab === "out"
      ? allTransactions.filter((t) => t.type === "OUT")
      : allTransactions;

  // 4. Record Payment / Deposit
  const handleAddDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

  // 5. Record Expense
  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

  const handleDeletePayment = async (id: string) => {
    if (!confirm(T.payments.deleteConfirm)) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePaymentAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. 2-Column Responsive Stat Cashflow Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: Money In */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 truncate">{T.payments.moneyIn}</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <ArrowDownLeft size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-black text-emerald-700 leading-tight">{formatCurrency(totalIn)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{payments.length} {T.payments.paymentRecords}</p>
          </div>
        </div>

        {/* Card 2: Money Out */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 truncate">{T.payments.moneyOut}</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg sm:text-xl font-black text-rose-700 leading-tight">{formatCurrency(totalOut)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{T.payments.bazarAndOthers}</p>
          </div>
        </div>

        {/* Card 3: Fund Balance */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-gray-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 truncate">{T.payments.fundBalance}</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Wallet size={14} />
            </div>
          </div>
          <div className="mt-2">
            <p className={cn("text-lg sm:text-xl font-black leading-tight", netFund >= 0 ? "text-indigo-900" : "text-rose-600")}>
              {formatCurrency(netFund)}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{netFund >= 0 ? T.payments.fundRemains : T.payments.fundShortage}</p>
          </div>
        </div>
      </div>

      {/* 2. Action Buttons & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-center">
        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-1 p-1 bg-gray-100/90 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
              activeTab === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            {T.payments.allTab} ({allTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("in")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-emerald-700 select-none",
              activeTab === "in" ? "bg-white text-gray-900 shadow-xs font-black" : "hover:text-emerald-800 opacity-80"
            )}
          >
            {T.payments.inTab} ({payments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("out")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-rose-700 select-none",
              activeTab === "out" ? "bg-white text-gray-900 shadow-xs font-black" : "hover:text-rose-800 opacity-80"
            )}
          >
            {T.payments.outTab} ({bazars.length + expenses.length})
          </button>
        </div>

        {/* Action Dialogs */}
        <div className="flex items-center justify-center gap-2 flex-wrap w-full sm:w-auto">
          {isAdmin && (
            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8.5 px-3.5 text-xs font-bold gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl shadow-2xs cursor-pointer">
                  <Plus size={14} />
                  <span>{T.payments.addExpense}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="text-sm">{T.payments.addExpense}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="exp-title" className="text-xs">{T.common.name} *</Label>
                    <Input id="exp-title" name="title" placeholder="Gas cylinder, Filter..." className="h-9 text-xs" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="exp-amt" className="text-xs">{T.payments.amount} *</Label>
                      <Input id="exp-amt" name="amount" type="number" min="1" placeholder="0" className="h-9 text-xs" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{T.payments.category}</Label>
                      <Select name="category" defaultValue="HOUSEHOLD">
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOUSEHOLD">Household</SelectItem>
                          <SelectItem value="CLEANING">Cleaning</SelectItem>
                          <SelectItem value="REPAIR">Repair</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{T.payments.paidBy} *</Label>
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
                      <Label htmlFor="exp-date" className="text-xs">{T.payments.date} *</Label>
                      <Input id="exp-date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-9 text-xs" required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exp-note" className="text-xs">{T.payments.note}</Label>
                    <Input id="exp-note" name="note" placeholder="Details..." className="h-9 text-xs" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setExpenseDialogOpen(false)} className="flex-1 text-xs">{T.common.cancel}</Button>
                    <Button type="submit" size="sm" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs" disabled={submitting}>
                      {submitting ? <Loader2 size={12} className="animate-spin mr-1" /> : null}{T.common.save}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8.5 px-3.5 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer">
                  <Plus size={14} />
                  <span>{T.payments.addDeposit}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="text-sm">{T.payments.addDeposit}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddDeposit} className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{T.payments.member} *</Label>
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
                      <Label htmlFor="dep-amt" className="text-xs">{T.payments.amount} *</Label>
                      <Input id="dep-amt" name="amount" type="number" min="1" placeholder="8000" className="h-9 text-xs" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{T.payments.method}</Label>
                      <Select name="method" defaultValue="BKASH">
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BKASH">bKash</SelectItem>
                          <SelectItem value="NAGAD">Nagad</SelectItem>
                          <SelectItem value="ROCKET">Rocket</SelectItem>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dep-date" className="text-xs">{T.payments.date} *</Label>
                    <Input id="dep-date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="h-9 text-xs" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dep-note" className="text-xs">{T.payments.note}</Label>
                    <Input id="dep-note" name="note" placeholder="TrxID..." className="h-9 text-xs" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDepositDialogOpen(false)} className="flex-1 text-xs">{T.common.cancel}</Button>
                    <Button type="submit" size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs" disabled={submitting}>
                      {submitting ? <Loader2 size={12} className="animate-spin mr-1" /> : null}{T.common.save}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 3. 7-Member Deposit Summary Cards */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-primary" />
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
              {T.payments.memberDeposit}
            </h4>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {T.dashboard.totalDeposit}: {formatCurrency(totalIn)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {members.map((m, idx) => {
            const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const totalGiven = memberDepositMap[m.id] || 0;

            return (
              <div
                key={m.id}
                className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between gap-2 text-center"
              >
                <Avatar className="h-7 w-7 mx-auto shrink-0">
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{name}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">
                    {formatCurrency(totalGiven)}
                  </p>
                  <p className="text-[9px] text-gray-400">{T.payments.deposited}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Full Statement / Transactions List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
          <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
            {T.payments.title}
          </h4>
          <span className="text-[11px] font-semibold text-gray-500">
            {filteredTransactions.length} {T.payments.records}
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-center py-8 text-xs text-gray-400">{T.payments.noTransactions}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === "IN";

              return (
                <div
                  key={tx.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0",
                        isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-900 truncate">{tx.title}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] py-0 px-1.5 rounded-full font-bold",
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          )}
                        >
                          {tx.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {formatShortDate(tx.date)} • {tx.note}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold",
                        isIncome ? "text-emerald-700" : "text-rose-700"
                      )}
                    >
                      {isIncome ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                    </span>

                    {tx.isPayment && isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(tx.originalId)}
                        className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete payment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
