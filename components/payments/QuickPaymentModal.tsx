"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Copy, Check, ExternalLink, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { createPaymentAction } from "@/app/actions/finance.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";

interface QuickPaymentModalProps {
  memberId: string;
  memberName: string;
  dueAmount: number;
  currency?: string;
  adminBkashNumber?: string | null;
  adminNagadNumber?: string | null;
  adminRocketNumber?: string | null;
  trigger?: React.ReactNode;
}

export function QuickPaymentModal({
  memberId,
  memberName,
  dueAmount,
  currency = "৳",
  adminBkashNumber = "01700000000",
  adminNagadNumber = "01800000000",
  adminRocketNumber = "01900000000",
  trigger,
}: QuickPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"BKASH" | "NAGAD" | "ROCKET" | "CASH">("BKASH");
  const [amount, setAmount] = useState<number>(Math.max(0, Math.round(dueAmount)));
  const [trxId, setTrxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = usePreferences();
  const router = useRouter();

  const activeNumber =
    method === "BKASH"
      ? adminBkashNumber || "01700000000"
      : method === "NAGAD"
      ? adminNagadNumber || "01800000000"
      : adminRocketNumber || "01900000000";

  const qrData = `${method === "BKASH" ? "bKash" : method === "NAGAD" ? "Nagad" : "Rocket"}:${activeNumber}?amount=${amount}&ref=${memberName.replace(/\s+/g, "_")}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}&margin=10`;

  const copyNumber = () => {
    navigator.clipboard.writeText(activeNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await createPaymentAction({
        memberId,
        amount,
        method,
        date: new Date(),
        note: trxId ? `TrxID: ${trxId}` : `${method} Payment`,
      });

      if (res && !res.success) {
        setError(res.error || t("পেমেন্ট রেকর্ড করা যায়নি", "Failed to record payment"));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setTrxId("");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || t("পেমেন্ট সাবমিট করতে সমস্যা হয়েছে", "Failed to submit payment"));
    } finally {
      setSubmitting(false);
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
            className="h-8 px-3 text-xs font-bold gap-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
          >
            <QrCode size={14} />
            <span>{t("bKash / Nagad পে করুন", "Pay with bKash / Nagad")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm p-5 sm:p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-black flex items-center justify-between">
            <span>{t("বকেয়া পরিশোধ ও পেমেন্ট হাব", "Quick Payment & QR Hub")}</span>
            <span className="text-xs font-bold text-muted-foreground">{memberName}</span>
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <h4 className="font-black text-sm text-foreground">{t("পেমেন্ট সফলভাবে সাবমিট হয়েছে!", "Payment Recorded Successfully!")}</h4>
            <p className="text-xs text-muted-foreground">{currency}{amount} {t("ম্যানেজারের কাছে পাঠানো হয়েছে", "submitted to manager")}</p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Method Select Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl">
              <button
                type="button"
                onClick={() => setMethod("BKASH")}
                className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                  method === "BKASH" ? "bg-pink-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                bKash
              </button>
              <button
                type="button"
                onClick={() => setMethod("NAGAD")}
                className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                  method === "NAGAD" ? "bg-amber-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Nagad
              </button>
              <button
                type="button"
                onClick={() => setMethod("ROCKET")}
                className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                  method === "ROCKET" ? "bg-purple-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rocket
              </button>
            </div>

            {/* QR Card */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-background border border-border/80 rounded-2xl shadow-inner space-y-2.5">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200">
                <img src={qrUrl} alt="Payment QR Code" className="w-36 h-36 object-contain" />
              </div>
              <div className="w-full flex items-center justify-between px-2 py-1.5 bg-muted/50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">{method} {t("নম্বর", "Number")}:</span>
                  <span className="font-mono font-bold text-foreground">{activeNumber}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={copyNumber}
                  className="h-7 px-2 text-[11px] font-bold gap-1 text-primary cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copied ? t("কপি হয়েছে", "Copied") : t("কপি", "Copy")}</span>
                </Button>
              </div>
            </div>

            {/* Payment Log Form */}
            <form onSubmit={handleRecordPayment} className="space-y-2.5">
              {error && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">{t("টাকার পরিমাণ", "Amount")} ({currency})</Label>
                  <Input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="h-8.5 text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">{t("TrxID (ঐচ্ছিক)", "TrxID (optional)")}</Label>
                  <Input
                    placeholder="e.g. 9J8A2BC"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-9 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
              >
                {submitting ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <ShieldCheck size={14} className="mr-1.5" />}
                <span>{t("টাকা জমা নিশ্চিত করুন", "Confirm & Record Payment")}</span>
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
