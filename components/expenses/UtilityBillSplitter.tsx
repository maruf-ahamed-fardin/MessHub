"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
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

interface UtilityBillSplitterProps {
  utilities: any[];
  members: any[];
  month: number;
  year: number;
  isAdmin: boolean;
}

const BILL_CONFIG: Record<string, { label: string; icon: any; defaultAmt: number }> = {
  RENT: { label: "বাসা ভাড়া (House Rent)", icon: Home, defaultAmt: 24500 },
  COOK: { label: "বুয়া / কুক বিল (Bua / Cook Bill)", icon: ChefHat, defaultAmt: 2100 },
  ELECTRICITY: { label: "কারেন্ট বিল (Electricity)", icon: Zap, defaultAmt: 2100 },
  GAS: { label: "গ্যাস বিল (Gas)", icon: Flame, defaultAmt: 1050 },
  WATER: { label: "পানি বিল (Water)", icon: Droplets, defaultAmt: 700 },
  INTERNET: { label: "ইন্টারনেট / ওয়াইফাই", icon: Wifi, defaultAmt: 1050 },
  WASTE: { label: "ময়লা ও অন্যান্য ইউটিলিটি", icon: Trash2, defaultAmt: 350 },
};

export function UtilityBillSplitter({
  utilities: initialUtilities,
  members,
  month,
  year,
  isAdmin,
}: UtilityBillSplitterProps) {
  const router = useRouter();
  const [utilities, setUtilities] = useState(initialUtilities);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const memberCount = members.length > 0 ? members.length : 7;

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
      {/* 1. Minimal Clean Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] font-medium text-gray-500">মোট ইউটিলিটি ও বাসা বিল</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalBillsAmount)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">৭ টি বিলের সর্বমোট</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-[11px] font-medium text-gray-500">জনপ্রতি বিল ({memberCount} জনে ভাগ)</p>
          <p className="text-xl font-bold text-primary mt-0.5">{formatCurrency(perMemberTotal)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">সমান ভাগে বিভক্ত</p>
        </div>
      </div>

      {/* 2. Minimal Bills Grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">বিলসমূহ</h4>
          <span className="text-[11px] text-gray-400">{memberCount} জন মেম্বার</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(BILL_CONFIG).map(([type, config]) => {
            const amount = billMap[type] || 0;
            const perHead = Math.round(amount / memberCount);
            const Icon = config.icon;

            return (
              <div
                key={type}
                className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{config.label}</p>
                    <p className="text-[10px] text-gray-500">{formatCurrency(amount)} <span className="text-gray-400">({formatCurrency(perHead)}/জন)</span></p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingType(type);
                      setEditDialogOpen(true);
                    }}
                    className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
                    title="Edit bill"
                  >
                    <Edit2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Minimal 7-Member Breakdown List (Mobile & Desktop friendly) */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            ৭ জন মেম্বারের জনপ্রতি বিল বণ্টন
          </h4>
          <span className="text-xs font-bold text-gray-900">{formatCurrency(perMemberTotal)} / জন</span>
        </div>

        <div className="divide-y divide-gray-100">
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
              <div key={m.id} className="transition-colors hover:bg-gray-50/40">
                <div
                  onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  className="px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{roomInfo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-gray-900">{formatCurrency(perMemberTotal)}</span>
                    <button type="button" className="text-gray-400">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Itemized Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 bg-gray-50/60 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-600 border-t border-gray-100">
                    <div>বাসা ভাড়া: <strong className="text-gray-900">{formatCurrency(rentShare)}</strong></div>
                    <div>কারেন্ট: <strong className="text-gray-900">{formatCurrency(elecShare)}</strong></div>
                    <div>গ্যাস: <strong className="text-gray-900">{formatCurrency(gasShare)}</strong></div>
                    <div>পানি: <strong className="text-gray-900">{formatCurrency(waterShare)}</strong></div>
                    <div>ইন্টারনেট: <strong className="text-gray-900">{formatCurrency(netShare)}</strong></div>
                    <div>খালা: <strong className="text-gray-900">{formatCurrency(cookShare)}</strong></div>
                    <div>ময়লা: <strong className="text-gray-900">{formatCurrency(wasteShare)}</strong></div>
                    <div>মোট: <strong className="text-primary">{formatCurrency(perMemberTotal)}</strong></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimal Bill Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingType ? BILL_CONFIG[editingType]?.label : "বিল আপডেট"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBill} className="space-y-3 mt-1">
            <div className="space-y-1">
              <Label htmlFor="bill-amt" className="text-xs">মোট বিলের পরিমাণ (৳) *</Label>
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
              <Label htmlFor="bill-note" className="text-xs">মন্তব্য (ঐচ্ছিক)</Label>
              <Input id="bill-note" name="note" placeholder="যেমন: চলতি মাসের বিল..." className="h-9 text-xs" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditDialogOpen(false)} className="flex-1 text-xs">
                বাতিল
              </Button>
              <Button type="submit" size="sm" className="flex-1 bg-primary text-white text-xs" disabled={loading}>
                {loading ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                সেভ করুন
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
