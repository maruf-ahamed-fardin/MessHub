"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Copy, Check, Loader2, ArrowUpRight, PhoneCall, Hash } from "lucide-react";
import { submitPaymentRequestAction } from "@/app/actions/finance.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";

interface SubmitDepositDialogProps {
  memberId?: string;
  adminBkashNumber?: string | null;
  adminNagadNumber?: string | null;
  adminRocketNumber?: string | null;
  trigger?: React.ReactNode;
}

export function SubmitDepositDialog({
  memberId,
  adminBkashNumber = "01700000000",
  adminNagadNumber = "01800000000",
  adminRocketNumber,
  trigger,
}: SubmitDepositDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { t } = usePreferences();
  const router = useRouter();

  // Form State
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER" | "CASH">("BKASH");
  const [senderPhone, setSenderPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t("সঠিক টাকার পরিমাণ দিন", "Please enter a valid amount"));
      return;
    }

    setLoading(true);
    try {
      const res = await submitPaymentRequestAction({
        amount: numAmount,
        method,
        senderPhone: senderPhone.trim() || undefined,
        trxId: trxId.trim() || undefined,
        note: note.trim() || undefined,
        memberId,
      });

      if (res.success) {
        setOpen(false);
        setAmount("");
        setSenderPhone("");
        setTrxId("");
        setNote("");
        router.refresh();
        alert(t("আপনার জমা দেওয়ার অনুরোধ পাঠানো হয়েছে! এডমিন ভেরিফাই করে অ্যাপ্রুভ করবেন।", "Deposit request submitted! Admin will verify and approve."));
      } else {
        alert(res.error || "Failed to submit payment request");
      }
    } catch (err: any) {
      alert(err?.message || "Error submitting payment request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            className="h-9 px-3 gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs cursor-pointer"
          >
            <Wallet size={15} />
            <span>{t("টাকা জমা দিন", "Deposit Money")}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md p-5 rounded-3xl">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Wallet size={18} className="text-emerald-600" />
            <span>{t("মেস ফান্ডে টাকা জমা দিন", "Submit Deposit Request")}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("নিচের নম্বরে টাকা পাঠিয়ে TrxID দিয়ে সাবমিট করুন", "Send money to the admin number and submit with TrxID")}
          </p>
        </DialogHeader>

        {/* Admin Accounts Info Card */}
        <div className="bg-muted/50 border border-border/80 rounded-2xl p-3 space-y-2 text-xs">
          <p className="font-bold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("এডমিনের পেমেন্ট নম্বরসমূহ (Personal)", "Admin Payment Numbers")}
          </p>
          <div className="space-y-1.5">
            {adminBkashNumber && (
              <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/60">
                <span className="font-bold text-pink-600">bKash (বিকাশ):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{adminBkashNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(adminBkashNumber, "bkash")}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy"
                  >
                    {copiedKey === "bkash" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
            {adminNagadNumber && (
              <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/60">
                <span className="font-bold text-orange-600">Nagad (নগদ):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{adminNagadNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(adminNagadNumber, "nagad")}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy"
                  >
                    {copiedKey === "nagad" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
            {adminRocketNumber && (
              <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border/60">
                <span className="font-bold text-purple-600">Rocket (রকেট):</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{adminRocketNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(adminRocketNumber, "rocket")}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Copy"
                  >
                    {copiedKey === "rocket" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deposit Request Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">{t("টাকার পরিমাণ (৳)*", "Amount (৳)*")}</Label>
              <Input
                type="number"
                placeholder="2000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                className="h-9 text-sm font-bold rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{t("পেমেন্ট মেথড*", "Payment Method*")}</Label>
              <Select value={method} onValueChange={(val: any) => setMethod(val)}>
                <SelectTrigger className="h-9 text-xs rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="BKASH">bKash (বিকাশ)</SelectItem>
                  <SelectItem value="NAGAD">Nagad (নগদ)</SelectItem>
                  <SelectItem value="ROCKET">Rocket (রকেট)</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash (ক্যাশ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <PhoneCall size={12} className="text-muted-foreground" />
              <span>{t("প্রেরকের নম্বর (যে নম্বর থেকে পাঠিয়েছেন)", "Sender Phone Number")}</span>
            </Label>
            <Input
              type="text"
              placeholder="017XXXXXXXX"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="h-9 text-xs rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Hash size={12} className="text-muted-foreground" />
              <span>{t("ট্রানজেকশন আইডি (TrxID)", "Transaction ID (TrxID)")}</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. BL9X392K1"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="h-9 text-xs rounded-xl font-mono uppercase"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">{t("নোট (ঐচ্ছিক)", "Note (Optional)")}</Label>
            <Input
              type="text"
              placeholder={t("যেমন: আগস্ট মাসের সিট ভাড়া ও মিল জমা", "e.g. August meal fund")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 font-bold text-xs bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs cursor-pointer gap-1.5"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpRight size={15} />}
            <span>{t("জমার অনুরোধ নিশ্চিত করুন", "Submit Deposit Request")}</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
