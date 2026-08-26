"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UtensilsCrossed, ChefHat, Zap, Flame, Wifi, Home, CreditCard,
  ArrowUpRight, ArrowDownLeft, UserPlus, Layers, Camera, Pencil,
  Phone, Mail, BedDouble, Calendar, CheckCircle2, XCircle, Save, X,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfileAction } from "@/app/actions/profile.actions";

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

// ─── Edit Profile Dialog ───────────────────────────────────────────────────────
function EditProfileDialog({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: { name: string; phone: string; avatar: string | null };
  onSaved: (updated: { name: string; phone: string; avatar: string | null }) => void;
}) {
  const { t } = usePreferences();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatar);
  const [avatarData, setAvatarData] = useState<string | null | undefined>(undefined); // undefined = no change
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      setAvatarData(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarData(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const payload: { name?: string; phone?: string; avatar?: string | null } = {};
      if (name.trim() !== initial.name) payload.name = name.trim();
      if (phone !== initial.phone) payload.phone = phone;
      if (avatarData !== undefined) payload.avatar = avatarData;

      await updateProfileAction(payload);
      onSaved({ name: name.trim(), phone, avatar: avatarPreview });
      onClose();
    });
  };

  const initials = name.trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil size={16} className="text-primary" />
            {t("প্রোফাইল সম্পাদনা করুন", "Edit Profile")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-primary to-violet-600 flex items-center justify-center text-white text-2xl font-black">
                    {initials}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 hover:bg-primary/90 transition-colors"
                title={t("ছবি পরিবর্তন করুন", "Change photo")}
              >
                <Camera size={14} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("ছবি আপলোড করুন", "Upload photo")}
              </button>
              {avatarPreview && (
                <>
                  <span className="text-gray-300 dark:text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs font-semibold text-rose-500 hover:underline"
                  >
                    {t("ছবি সরান", "Remove")}
                  </button>
                </>
              )}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">
              {t("সর্বোচ্চ ২ MB, JPG/PNG/WEBP", "Max 2MB, JPG/PNG/WEBP")}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="prof-name">{t("আপনার নাম", "Full Name")}</Label>
            <Input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("আপনার নাম লিখুন", "Enter your name")}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="prof-phone">{t("মোবাইল নম্বর", "Phone Number")}</Label>
            <Input
              id="prof-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              type="tel"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              <X size={14} className="mr-1.5" />
              {t("বাতিল", "Cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {isPending ? (
                <span className="mr-1.5 animate-spin">⏳</span>
              ) : (
                <Save size={14} className="mr-1.5" />
              )}
              {t("সংরক্ষণ করুন", "Save Changes")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState<"summary" | "expenses" | "payments">("summary");
  const [editOpen, setEditOpen] = useState(false);

  // Local profile state (updated optimistically after save)
  const [localName, setLocalName] = useState(member.user.name ?? "Member");
  const [localPhone, setLocalPhone] = useState(member.phone ?? "");
  const [localAvatar, setLocalAvatar] = useState<string | null>(
    member.avatar ?? member.user.image ?? null
  );

  const totalCost = foodCost + guestMealCost + utilityShare + seatRent + otherExpenseShare;
  const isCredit = balance >= 0;
  const initials = localName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const joinedDate = member.joinedAt
    ? new Date(member.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  const expenseItems = [
    {
      id: "food",
      label: t(`খাবার (${totalMeals} মিল × ${formatCurrency(mealRate)})`, `Food (${totalMeals} meals × ${formatCurrency(mealRate)})`),
      amount: foodCost,
      icon: UtensilsCrossed,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      id: "guest",
      label: t(`গেস্ট মিল (${totalGuestMeals} টি)`, `Guest Meals (${totalGuestMeals})`),
      amount: guestMealCost,
      icon: UserPlus,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    },
    {
      id: "bua",
      label: t("বুয়া / বাবুর্চি", "Cook / Maid"),
      amount: utilityDetails.buaBill,
      icon: ChefHat,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    {
      id: "electricity",
      label: t("বিদ্যুৎ বিল", "Electricity"),
      amount: utilityDetails.electricity,
      icon: Zap,
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    },
    {
      id: "gas_water",
      label: t("গ্যাস ও পানি", "Gas & Water"),
      amount: utilityDetails.gas + utilityDetails.water,
      icon: Flame,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    },
    {
      id: "internet_waste",
      label: t("ইন্টারনেট ও ময়লা", "Internet & Waste"),
      amount: utilityDetails.internet + utilityDetails.waste,
      icon: Wifi,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      id: "rent",
      label: t(
        `সিট ভাড়া (${member.seat?.room?.name ?? "Room"} - ${member.seat?.label ?? "Seat"})`,
        `Seat Rent (${member.seat?.room?.name ?? "Room"} - ${member.seat?.label ?? "Seat"})`
      ),
      amount: seatRent,
      icon: Home,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    {
      id: "other",
      label: t("অন্যান্য শেয়ার্ড খরচ", "Other Shared Expenses"),
      amount: otherExpenseShare,
      icon: Layers,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    },
  ];

  return (
    <div className="space-y-5 pb-6">

      {/* ══════════════════════════════════════════════════
          PROFILE HERO CARD
      ══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-violet-700 shadow-xl shadow-primary/20">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-14 -left-8 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full bg-white/5" />
        </div>

        <div className="relative z-10 p-5 sm:p-7">
          {/* Top row: Avatar + Edit button */}
          <div className="flex items-start justify-between gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg">
                {localAvatar ? (
                  <img
                    src={localAvatar}
                    alt={localName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-black">
                    {initials}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                title={t("ছবি পরিবর্তন করুন", "Change photo")}
              >
                <Camera size={13} />
              </button>
            </div>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl px-3 py-2 text-xs font-bold backdrop-blur-sm transition-all active:scale-95"
            >
              <Pencil size={13} />
              {t("এডিট করুন", "Edit Profile")}
            </button>
          </div>

          {/* Name & Role */}
          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {localName}
            </h1>
            <p className="text-white/70 text-xs mt-0.5">{member.user.email}</p>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mt-3.5">
            {member.seat && (
              <span className="flex items-center gap-1.5 bg-white/15 text-white border border-white/20 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
                <BedDouble size={11} />
                {member.seat.room?.name ?? "Room"} — {t("সিট", "Seat")} {member.seat.label}
              </span>
            )}
            {localPhone && (
              <a
                href={`tel:${localPhone}`}
                className="flex items-center gap-1.5 bg-white/15 text-white border border-white/20 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm hover:bg-white/25 transition-colors"
              >
                <Phone size={11} />
                {localPhone}
              </a>
            )}
            <span className="flex items-center gap-1.5 bg-white/15 text-white border border-white/20 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
              <Calendar size={11} />
              {t("যোগদান", "Joined")} {joinedDate}
            </span>
          </div>
        </div>

        {/* Balance Strip */}
        <div
          className={cn(
            "relative z-10 mx-4 mb-4 rounded-2xl p-4 flex items-center justify-between gap-3 backdrop-blur-sm border",
            isCredit
              ? "bg-emerald-500/20 border-emerald-400/30"
              : "bg-rose-500/20 border-rose-400/30"
          )}
        >
          <div>
            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider">
              {t("বর্তমান ব্যালেন্স", "Current Balance")} · {monthLabel}
            </p>
            <p className="text-2xl font-black text-white mt-0.5">
              {isCredit ? "+" : ""}{formatCurrency(balance)}
            </p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isCredit ? "bg-emerald-400/20" : "bg-rose-400/20"
          )}>
            {isCredit
              ? <TrendingUp size={22} className="text-emerald-300" />
              : <TrendingDown size={22} className="text-rose-300" />
            }
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          QUICK STAT PILLARS
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <ArrowDownLeft size={18} />
          </div>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 leading-snug">
            {t("মোট জমা", "Total Paid")}
          </p>
          <p className="text-base font-black text-gray-900 dark:text-slate-100 mt-0.5 truncate">
            {formatCurrency(totalPaid)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <ArrowUpRight size={18} />
          </div>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 leading-snug">
            {t("মোট খরচ", "Total Cost")}
          </p>
          <p className="text-base font-black text-gray-900 dark:text-slate-100 mt-0.5 truncate">
            {formatCurrency(totalCost)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <UtensilsCrossed size={18} />
          </div>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 leading-snug">
            {t("মোট মিল", "Total Meals")}
          </p>
          <p className="text-base font-black text-gray-900 dark:text-slate-100 mt-0.5">
            {totalMeals}
            <span className="text-[10px] font-normal text-gray-400 ml-1">
              @ {formatCurrency(mealRate)}
            </span>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          NAVIGATION TABS
      ══════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800/60 p-1 rounded-xl border border-gray-200/80 dark:border-slate-800">
        {(["summary", "expenses", "payments"] as const).map((tab) => {
          const labels = {
            summary: t("হিসাব খাতা", "Statement"),
            expenses: t(`খরচ (${expenseItems.length})`, `Cost (${expenseItems.length})`),
            payments: t(`জমা (${paymentHistory.length})`, `Paid (${paymentHistory.length})`),
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center select-none cursor-pointer",
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-2xs"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              )}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: SUMMARY — Expense Breakdown
      ══════════════════════════════════════════════════ */}
      {(activeTab === "summary" || activeTab === "expenses") && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                {t("ব্যক্তিগত খরচের খতিয়ান", "Personal Cost Breakdown")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {monthLabel} {t("এর সব খাতের হিসাব", "— all cost categories")}
              </p>
            </div>
            <span className="text-xs font-extrabold text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-lg">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {expenseItems.map((item) => {
              const Icon = item.icon;
              const pct = totalCost > 0 ? Math.round((item.amount / totalCost) * 100) : 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0", item.color)}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        {pct}% {t("এর", "of total")}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-900 dark:text-slate-100 shrink-0 ml-2">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Total row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800 px-1">
            <span className="text-sm font-black text-gray-700 dark:text-slate-300">
              {t("মোট দেনা", "Total Due")}
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-slate-100">
              {formatCurrency(totalCost)}
            </span>
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {t("মোট জমা", "Total Paid")}
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalPaid)}
            </span>
          </div>
          <div className={cn(
            "flex items-center justify-between px-1 py-2 rounded-xl border",
            isCredit
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50"
          )}>
            <span className={cn("text-sm font-black", isCredit ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300")}>
              {isCredit ? t("✓ আপনার পাওনা জমা", "✓ Your Credit") : t("✗ বকেয়া পরিমাণ", "✗ Outstanding Due")}
            </span>
            <span className={cn("text-lg font-black", isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
              {isCredit ? "+" : ""}{formatCurrency(balance)}
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: PAYMENTS
      ══════════════════════════════════════════════════ */}
      {(activeTab === "summary" || activeTab === "payments") && (
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                {t("টাকা জমার ইতিহাস", "Payment History")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {monthLabel} {t("এ আপনার জমাকৃত অর্থের বিবরণ", "deposits")}
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50">
              {formatCurrency(totalPaid)}
            </span>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-2xl">💳</div>
              <p className="text-sm font-bold text-gray-600 dark:text-slate-400">
                {t("এই মাসে কোনো জমা নেই", "No deposits this month")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {paymentHistory.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CreditCard size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                        {p.method} {t("পেমেন্ট", "Payment")}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">
                        {formatDate(p.date)}{p.note ? ` · ${p.note}` : ""}
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

      {/* ══════════════════════════════════════════════════
          EDIT DIALOG
      ══════════════════════════════════════════════════ */}
      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{ name: localName, phone: localPhone, avatar: localAvatar }}
        onSaved={({ name, phone, avatar }) => {
          setLocalName(name);
          setLocalPhone(phone);
          setLocalAvatar(avatar);
        }}
      />
    </div>
  );
}
