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
  Trash2, Edit2, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { upsertUtilityAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

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

  const BILL_CONFIG: Record<string, { label: string; icon: any; defaultAmt: number }> = {
    RENT: { label: t("বাসা ভাড়া", "Flat Rent"), icon: Home, defaultAmt: 24500 },
    COOK: { label: t("বুয়া ও বাবুর্চি বিল", "Cook / Bua Bill"), icon: ChefHat, defaultAmt: 2100 },
    ELECTRICITY: { label: t("বিদ্যুৎ বিল", "Electricity"), icon: Zap, defaultAmt: 2100 },
    GAS: { label: t("গ্যাস বিল", "Gas"), icon: Flame, defaultAmt: 1050 },
    WATER: { label: t("পানি বিল", "Water"), icon: Droplets, defaultAmt: 700 },
    INTERNET: { label: t("ইন্টারনেট ও ওয়াইফাই", "Internet & Wifi"), icon: Wifi, defaultAmt: 1050 },
    WASTE: { label: t("ময়লা ও অন্যান্য বিল", "Waste & Service"), icon: Trash2, defaultAmt: 350 },
  };

  // Map of bills by type
  const billMap: Record<string, number> = {};
  for (const key of Object.keys(BILL_CONFIG)) {
    const found = utilities.find((u) => u.type === key);
    billMap[key] = found ? Number(found.amount) : BILL_CONFIG[key].defaultAmt;
  }

  const totalBillsAmount = Object.values(billMap).reduce((sum, amt) => sum + amt, 0);
  const perMemberTotal = totalBillsAmount > 0 ? Math.round(totalBillsAmount / memberCount) : 0;

  const handleSaveBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingType) return;
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
    <div className="space-y-4">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
            {t("মোট ইউটিলিটি ও বাসা বিল", "Total Rent & Utility Bills")}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{formatCurrency(totalBillsAmount)}</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
            {t("সকল বিলের সর্বমোট", "Total of all bills")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
            {t(`জনপ্রতি বিল (${memberCount} জনে ভাগ)`, `Per Member Bill (${memberCount} members)`)}
          </p>
          <p className="text-xl font-bold text-primary mt-0.5">{formatCurrency(perMemberTotal)}</p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
            {t("সমান ভাগে বিভক্ত", "Equally distributed")}
          </p>
        </div>
      </div>

      {/* 2. Bills Grid */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
            {t("বিলসমূহ", "Utility Bills")}
          </h4>
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            {t(`${memberCount} জন মেম্বার`, `${memberCount} Members`)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(BILL_CONFIG).map(([type, config]) => {
            const amount = billMap[type] || 0;
            const perHead = Math.round(amount / memberCount);
            const Icon = config.icon;

            return (
              <div
                key={type}
                className="p-2.5 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">{config.label}</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                      {formatCurrency(amount)} <span className="text-gray-400 dark:text-slate-500">({t(`${formatCurrency(perHead)}/জন`, `${formatCurrency(perHead)}/person`)})</span>
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingType(type);
                      setEditDialogOpen(true);
                    }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                    title={t("বিল এডিট করুন", "Edit bill")}
                  >
                    <Edit2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Member Breakdown List */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
            {t("মেম্বারদের জনপ্রতি বিল বণ্টন", "Per Member Bill Breakdown")}
          </h4>
          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
            {t(`${formatCurrency(perMemberTotal)} / জন`, `${formatCurrency(perMemberTotal)} / person`)}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {members.map((m, idx) => {
            const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
            const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const roomInfo = m.seat ? `${m.seat.room?.name ?? "Room"} (${m.seat.label})` : `Room 10${Math.floor(idx / 2) + 1}`;
            const isExpanded = expandedMember === m.id;

            const rentShare = Math.round((billMap["RENT"] || 0) / memberCount);
            const elecShare = Math.round((billMap["ELECTRICITY"] || 0) / memberCount);
            const gasShare = Math.round((billMap["GAS"] || 0) / memberCount);
            const waterShare = Math.round((billMap["WATER"] || 0) / memberCount);
            const netShare = Math.round((billMap["INTERNET"] || 0) / memberCount);
            const cookShare = Math.round((billMap["COOK"] || 0) / memberCount);
            const wasteShare = Math.round((billMap["WASTE"] || 0) / memberCount);

            return (
              <div key={m.id} className="transition-colors hover:bg-gray-50/40 dark:hover:bg-slate-800/40">
                <div
                  onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{roomInfo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-gray-900 dark:text-slate-100">{formatCurrency(perMemberTotal)}</span>
                    <button type="button" className="text-gray-400">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Itemized Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 bg-gray-50/60 dark:bg-slate-800/60 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-600 dark:text-slate-300 border-t border-gray-100 dark:border-slate-800">
                    <div>{t("বাসা ভাড়া:", "Rent:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(rentShare)}</strong></div>
                    <div>{t("বিদ্যুৎ:", "Electricity:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(elecShare)}</strong></div>
                    <div>{t("গ্যাস:", "Gas:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(gasShare)}</strong></div>
                    <div>{t("পানি:", "Water:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(waterShare)}</strong></div>
                    <div>{t("ইন্টারনেট:", "Internet:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(netShare)}</strong></div>
                    <div>{t("বুয়া:", "Cook:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(cookShare)}</strong></div>
                    <div>{t("ময়লা:", "Waste:")} <strong className="text-gray-900 dark:text-slate-100">{formatCurrency(wasteShare)}</strong></div>
                    <div>{t("মোট:", "Total:")} <strong className="text-primary">{formatCurrency(perMemberTotal)}</strong></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bill Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingType ? BILL_CONFIG[editingType]?.label : t("বিল আপডেট", "Update Bill")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBill} className="space-y-3 mt-1">
            <div className="space-y-1">
              <Label htmlFor="bill-amt" className="text-xs">{t("মোট বিলের পরিমাণ (৳) *", "Total Bill Amount (৳) *")}</Label>
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
    </div>
  );
}
