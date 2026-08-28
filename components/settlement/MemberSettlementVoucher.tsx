"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Printer, Download, QrCode, CheckCircle2, AlertCircle, Building2, User, Calendar, Receipt } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { MONTH_NAMES_BN, MONTH_NAMES_EN } from "@/lib/constants/categories";

interface MemberSettlementVoucherProps {
  member: any;
  messSettings: any;
  month: number;
  year: number;
  trigger?: React.ReactNode;
}

export function MemberSettlementVoucher({
  member,
  messSettings,
  month,
  year,
  trigger,
}: MemberSettlementVoucherProps) {
  const [open, setOpen] = useState(false);
  const { t, language } = usePreferences();

  const monthName = language === "bn" ? MONTH_NAMES_BN[month] : MONTH_NAMES_EN[month];
  const currency = messSettings?.currency ?? "৳";

  // Calculations
  const memberName = member?.user?.name ?? member?.name ?? "Member";
  const seatName = member?.seat?.label ?? "Seat N/A";
  const roomName = member?.room?.name ?? "Room N/A";

  const totalMeals = Number(member?.totalMeals) || 0;
  const mealCost = Number(member?.mealCost) || 0;
  const guestMealCost = Number(member?.guestMealCost) || 0;
  const sharedExpense = Number(member?.sharedExpense) || 0;
  const seatRent = Number(member?.seatRent) || 0;
  const totalCost = Number(member?.totalCost) || (mealCost + guestMealCost + sharedExpense + seatRent);
  const totalDeposited = Number(member?.totalDeposited) || Number(member?.totalPaid) || 0;
  const netBalance = Number(member?.netBalance) || (totalDeposited - totalCost);

  const isDue = netBalance < 0;
  const isRefund = netBalance > 0;
  const dueAmount = Math.abs(netBalance);

  const adminBkash = messSettings?.adminBkashNumber || "01700000000";
  const qrData = `bKash:${adminBkash}?amount=${dueAmount}&ref=${memberName.replace(/\s+/g, "_")}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}&margin=4`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-primary/10 hover:border-primary/40 cursor-pointer"
          >
            <Receipt size={13} className="text-primary" />
            <span>{t("স্লিপ / ভাউচার", "Voucher Slip")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg p-4 sm:p-6 rounded-3xl print:p-0 print:border-none print:shadow-none">
        <div className="flex items-center justify-between pb-3 border-b border-border print:hidden">
          <DialogTitle className="text-sm font-black flex items-center gap-1.5">
            <Receipt size={16} className="text-primary" />
            <span>{t("মেম্বার সেটেলমেন্ট ভাউচার", "Member Settlement Slip")}</span>
          </DialogTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-bold gap-1.5 bg-primary text-primary-foreground rounded-xl shadow-xs cursor-pointer"
            >
              <Printer size={13} />
              <span>{t("প্রিন্ট / PDF", "Print / PDF")}</span>
            </Button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div id="printable-voucher" className="p-5 bg-card text-card-foreground border border-border/90 rounded-2xl shadow-xs space-y-4 print:border print:m-0 print:p-6 print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-border/80">
            <div>
              <div className="flex items-center gap-1.5">
                <Building2 size={16} className="text-primary" />
                <h3 className="font-black text-base text-foreground tracking-tight">{messSettings?.messName || "MessHub"}</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{messSettings?.address || "Mess Address"}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 block w-fit ml-auto">
                {monthName} {year}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">Voucher #{month}{year}-{member?.id?.slice(-4) ?? "01"}</span>
            </div>
          </div>

          {/* Member Info */}
          <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">{t("মেম্বারের নাম:", "Member Name:")}</span>
              <strong className="text-foreground text-sm">{memberName}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">{t("রুম ও সিট:", "Room & Seat:")}</span>
              <strong className="text-foreground">{roomName} ({seatName})</strong>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("মিল খরচ", "Meal Cost")} ({totalMeals} {t("মিল", "meals")}):</span>
              <span className="font-bold">{currency}{Math.round(mealCost)}</span>
            </div>
            {guestMealCost > 0 && (
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("গেস্ট মিল খরচ", "Guest Meals")}:</span>
                <span className="font-bold">{currency}{Math.round(guestMealCost)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("রুম / সিট ভাড়া", "Room Rent")}:</span>
              <span className="font-bold">{currency}{Math.round(seatRent)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">{t("ইউটিলিটি ও শেয়ার্ড খরচ", "Utilities & Shared")}:</span>
              <span className="font-bold">{currency}{Math.round(sharedExpense)}</span>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-border font-black text-sm bg-muted/20 px-2 rounded-lg">
              <span>{t("সর্বমোট খরচ (Total Cost)", "Total Cost")}:</span>
              <span>{currency}{Math.round(totalCost)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/50 px-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <span>{t("মেম্বার জমা দিয়েছেন (Total Paid)", "Total Deposited")}:</span>
              <span>{currency}{Math.round(totalDeposited)}</span>
            </div>
          </div>

          {/* Final Status Card */}
          <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
            isDue
              ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
              : isRefund
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
          }`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block">
                {isDue ? t("বকেয়া দিতে হবে (Net Due)", "Net Due Amount") : isRefund ? t("মেস থেকে ফেরত পাবেন (Refund)", "Net Refund Amount") : t("হিসাব পরিশোধ (Settled)", "Fully Settled")}
              </span>
              <h4 className="text-lg font-black mt-0.5">
                {currency}{Math.round(dueAmount)}
              </h4>
            </div>

            {isDue && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
                <img src={qrUrl} alt="bKash QR" className="w-12 h-12 object-contain rounded-lg" />
                <div className="text-[9px] leading-tight text-muted-foreground font-medium">
                  <span className="font-bold text-foreground block">Scan to Pay</span>
                  bKash: {adminBkash}
                </div>
              </div>
            )}
          </div>

          {/* Footer Signature & Seal */}
          <div className="pt-6 flex items-end justify-between text-[11px] text-muted-foreground">
            <div>
              <p className="text-[9px]">Generated by MessHub Smart System</p>
              <p className="text-[9px]">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center border-t border-border/80 pt-1 px-4">
              <span className="font-bold text-foreground block">ম্যানেজার স্বাক্ষর</span>
              <span className="text-[9px]">Manager Sign & Seal</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
