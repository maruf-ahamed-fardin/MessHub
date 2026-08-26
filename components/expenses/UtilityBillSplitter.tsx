"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Home, Zap, Flame, Droplets, Wifi, ChefHat,
  Trash2, Edit3, Loader2, ChevronDown, ChevronUp,
  Users, Scale, CheckCircle2,
} from "lucide-react";
import { upsertUtilityAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { cn } from "@/lib/utils/cn";

interface UtilityBillSplitterProps {
  utilities: any[];
  members: any[];
  month: number;
  year: number;
  isAdmin: boolean;
}

export function UtilityBillSplitter({
  utilities: initialUtilities,
  members,
  month,
  year,
  isAdmin,
}: UtilityBillSplitterProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const [utilities, setUtilities] = useState(initialUtilities);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const memberCount = members.length > 0 ? members.length : 7;

  const BILL_CONFIG: Record<string, { label: string; icon: any; color: string; defaultAmt: number }> = {
    RENT: { label: t("বাসা ভাড়া", "House Rent"), icon: Home, color: "bg-purple-500", defaultAmt: 24500 },
    COOK: { label: t("বুয়া / বাবুর্চি বিল", "Cook / Maid"), icon: ChefHat, color: "bg-emerald-500", defaultAmt: 2100 },
    ELECTRICITY: { label: t("বিদ্যুৎ বিল", "Electricity"), icon: Zap, color: "bg-amber-500", defaultAmt: 2100 },
    GAS: { label: t("গ্যাস সিলিন্ডার / বিল", "Gas Bill"), icon: Flame, color: "bg-orange-500", defaultAmt: 1050 },
    WATER: { label: t("পানি বিল", "Water Bill"), icon: Droplets, color: "bg-blue-500", defaultAmt: 700 },
    INTERNET: { label: t("ইন্টারনেট ও ওয়াইফাই", "Internet & Wifi"), icon: Wifi, color: "bg-cyan-500", defaultAmt: 1050 },
    WASTE: { label: t("ময়লা বিল", "Waste Service"), icon: Trash2, color: "bg-slate-500", defaultAmt: 350 },
  };

  // Map of bills by type
  const billMap: Record<string, number> = {};
  for (const key of Object.keys(BILL_CONFIG)) {
    const found = utilities.find((u) => u.type === key);
    billMap[key] = found ? Number(found.amount) : BILL_CONFIG[key].defaultAmt;
  }

  const totalBillsAmount = Object.values(billMap).reduce((sum, amt) => sum + amt, 0);
  const houseRentAmount = billMap["RENT"] || 0;
  const sharedUtilitiesAmount = totalBillsAmount - houseRentAmount;
  const perMemberTotal = totalBillsAmount > 0 ? Math.round(totalBillsAmount / memberCount) : 0;
  const perMemberUtilities = sharedUtilitiesAmount > 0 ? Math.round(sharedUtilitiesAmount / memberCount) : 0;

  const handleSaveBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin || !editingType) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const newAmount = Number(fd.get("amount")) || 0;
    const note = (fd.get("note") as string) || undefined;

    setUtilities((prev) => {
      const idx = prev.findIndex((u) => u.type === editingType);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], amount: newAmount, note };
        return next;
      }
      return [...prev, { id: `u-${Date.now()}`, type: editingType, amount: newAmount, month, year, note }];
    });
    setEditDialogOpen(false);

    try {
      await upsertUtilityAction({
        type: editingType,
        amount: newAmount,
        month,
        year,
        date: new Date(),
        note,
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update bill:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Hero KPI Cards (3 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: Total Bills */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {t("মোট ইউটিলিটি ও বাসা বিল", "Total Rent & Bills")}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
              <Home size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-slate-100 leading-tight">
              {formatCurrency(totalBillsAmount)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium">
              {t("৭টি বিলের সমষ্টি", "Sum of all 7 bills")}
            </p>
          </div>
        </div>

        {/* Card 2: Shared Utilities Per-Head (ভাড়া ব্যতীত ইউটিলিটি সমবণ্টন) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {t("মাথাপিছু ইউটিলিটি বিল", "Per-Member Utilities")}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-tight">
              {formatCurrency(perMemberUtilities)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 sm:mt-1 font-medium">
              {t("ভাড়া ব্যতীত ৬টি বিলের সমবণ্টন", "Excl. rent, 6 shared bills")}
            </p>
          </div>
        </div>

        {/* Card 3: Rent vs Shared Utilities Ratio (Spans 2 cols on mobile) */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {t("ভাড়া বনাম ইউটিলিটি", "Rent vs Utilities")}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
              <Scale size={15} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-slate-100">
              <span>{t("বাসা ভাড়া:", "Rent:")} {formatCurrency(houseRentAmount)}</span>
              <span className="text-gray-400">|</span>
              <span>{t("ইউটিলিটি:", "Utility:")} {formatCurrency(sharedUtilitiesAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
              <span>{t("সিটভেদে ভিন্ন", "Custom per seat")}</span>
              <span>{t("জনপ্রতি ৳", "৳/person ")}{perMemberUtilities}</span>
            </div>
            {/* Slim Ratio Bar */}
            <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden flex mt-1.5">
              <div
                className="bg-purple-500 h-full transition-all"
                style={{ width: `${totalBillsAmount > 0 ? (houseRentAmount / totalBillsAmount) * 100 : 77}%` }}
              />
              <div
                className="bg-indigo-500 h-full transition-all"
                style={{ width: `${totalBillsAmount > 0 ? (sharedUtilitiesAmount / totalBillsAmount) * 100 : 23}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Expense Distribution Proportional Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">
            {t("বিলের খাতের আনুপাতিক বিস্তার", "Bill Distribution Breakdown")}
          </h4>
          <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">
            {t("মোট ৭টি খাত", "7 Total Categories")}
          </span>
        </div>

        {/* Multi-segmented Colored Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-slate-800 gap-0.5">
          {Object.entries(BILL_CONFIG).map(([type, config]) => {
            const amt = billMap[type] || 0;
            const pct = totalBillsAmount > 0 ? (amt / totalBillsAmount) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={type}
                className={cn("h-full transition-all rounded-xs", config.color)}
                style={{ width: `${pct}%` }}
                title={`${config.label}: ${formatCurrency(amt)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(BILL_CONFIG).map(([type, config]) => {
            const amt = billMap[type] || 0;
            const pct = totalBillsAmount > 0 ? Math.round((amt / totalBillsAmount) * 100) : 0;
            return (
              <div
                key={type}
                className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-slate-400 bg-gray-50/70 dark:bg-slate-800/40 px-2.5 py-1 rounded-xl border border-gray-100 dark:border-slate-800"
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", config.color)} />
                <span>{config.label}</span>
                <span className="font-extrabold text-gray-900 dark:text-slate-100">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 7-Bill Interactive Grid */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-slate-100">
              {t("ইউটিলিটি ও বাসা বিলের তালিকাসমূহ", "Utility Bills & Rent Breakdown")}
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t("প্রতিটি খাতের মোট টাকা ও মাথাপিছু ভাগ", "Total amount and per-member share for each bill")}
            </p>
          </div>
          <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">
            {t(`${memberCount} জন মেম্বার`, `${memberCount} Members`)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(BILL_CONFIG).map(([type, config]) => {
            const amount = billMap[type] || 0;
            const perHead = Math.round(amount / memberCount);
            const Icon = config.icon;

            return (
              <div
                key={type}
                className="p-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-all flex flex-col justify-between gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-600 dark:text-slate-400 truncate">{config.label}</span>
                  <div className="flex items-center gap-1">
                    <Icon size={13} className="text-gray-400 shrink-0" />
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingType(type);
                          setEditDialogOpen(true);
                        }}
                        className="h-5 w-5 rounded-md flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title={t("বিল এডিট করুন", "Edit bill")}
                      >
                        <Edit3 size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-slate-100">
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                    {type === "RENT" ? (
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{t("সিটভেদে ভিন্ন", "By seat")}</span>
                    ) : (
                      <>
                        {t("মাথাপিছু:", "Per:")} <strong className="text-gray-700 dark:text-slate-300">{formatCurrency(perHead)}</strong>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Member-wise Itemized Distribution (Per-Member Accordion) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
              <Users size={14} className="text-primary" />
              <span>{t("মেম্বারদের জনপ্রতি সমবণ্টনের হিসাব", "Per-Member Bill Distribution")}</span>
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t("ক্লিক করে মেম্বারভিত্তিক বিস্তারিত বিলের হিসাব দেখুন", "Click to expand individual itemized breakdown")}
            </p>
          </div>
          <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {t("ইউটিলিটি:", "Utilities:")} {formatCurrency(perMemberUtilities)} / {t("জন", "person")} + {t("সিট ভাড়া", "Rent")}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50/40 dark:bg-slate-800/20">
          {members.map((m, idx) => {
            const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const memberRent = Number(m.seatRent) || Math.round((billMap["RENT"] || 24500) / memberCount);
            const totalRequired = memberRent + perMemberUtilities;
            const isExpanded = expandedMember === m.id;

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
                  onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-gray-100/60 dark:hover:bg-slate-800/60 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 ring-1 ring-gray-200 dark:ring-slate-700">
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{seatText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400">
                        {formatCurrency(totalRequired)}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500">
                        {t("মোট প্রদেয়", "Total Due")}
                      </p>
                    </div>
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Itemized Breakdown */}
                {isExpanded && (
                  <div className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("🏠 বাসা ভাড়া", "🏠 House Rent")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(memberRent)}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("🔥 গ্যাস", "🔥 Gas")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(Math.round((billMap["GAS"] || 0) / memberCount))}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("⚡ বিদ্যুৎ", "⚡ Electricity")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(Math.round((billMap["ELECTRICITY"] || 0) / memberCount))}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("💧 পানি", "💧 Water")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(Math.round((billMap["WATER"] || 0) / memberCount))}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("📶 ওয়াইফাই", "📶 Wifi")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(Math.round((billMap["INTERNET"] || 0) / memberCount))}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("🧹 বুয়া", "🧹 Maid")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(Math.round((billMap["COOK"] || 0) / memberCount))}</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800">
                        <span className="text-gray-400 block">{t("🗑️ ময়লা", "🗑️ Waste")}</span>
                        <strong className="text-gray-900 dark:text-slate-100 font-bold">{formatCurrency(Math.round((billMap["WASTE"] || 0) / memberCount))}</strong>
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

      {/* Admin Bill Edit Dialog */}
      {isAdmin && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-sm font-black">
                {editingType ? BILL_CONFIG[editingType]?.label : t("বিল আপডেট", "Update Bill")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveBill} className="space-y-3 mt-1">
              <div className="space-y-1">
                <Label htmlFor="bill-amt" className="text-xs font-bold">{t("মোট বিলের পরিমাণ (৳) *", "Total Bill Amount (৳) *")}</Label>
                <Input
                  id="bill-amt"
                  name="amount"
                  type="number"
                  min="0"
                  defaultValue={editingType ? billMap[editingType] : "0"}
                  className="h-9 text-xs"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bill-note" className="text-xs">{t("মন্তব্য (ঐচ্ছিক)", "Note (optional)")}</Label>
                <Input id="bill-note" name="note" placeholder={t("যেমন: চলতি মাসের বিল...", "e.g. Current month bill...")} className="h-9 text-xs" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditDialogOpen(false)} className="flex-1 text-xs">
                  {t("বাতিল", "Cancel")}
                </Button>
                <Button type="submit" size="sm" className="flex-1 bg-primary text-white text-xs" disabled={loading}>
                  {loading ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                  {t("সেভ করুন", "Save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
