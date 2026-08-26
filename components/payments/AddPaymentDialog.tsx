"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createPaymentAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_LABELS_BN } from "@/lib/constants/categories";

const PAYMENT_METHODS = ["CASH", "BKASH", "BANK", "OTHER"];

export function AddPaymentDialog({ members }: { members: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, language } = usePreferences();

  const methodLabels = language === "bn" ? PAYMENT_METHOD_LABELS_BN : PAYMENT_METHOD_LABELS;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createPaymentAction({
        memberId: fd.get("memberId"),
        amount: fd.get("amount"),
        date: fd.get("date"),
        method: fd.get("method"),
        note: fd.get("note") || undefined,
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs">
          <Plus size={14} /> {t("টাকা জমা রেকর্ড", "Record Payment")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("টাকা জমার হিসাব লিখুন", "Record Member Payment")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label>{t("মেম্বারের নাম *", "Member *")}</Label>
            <Select name="memberId">
              <SelectTrigger><SelectValue placeholder={t("মেম্বার বেছে নিন", "Select member")} /></SelectTrigger>
              <SelectContent>
                {members.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.user?.name ?? m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="amount">{t("পরিমাণ (৳) *", "Amount (৳) *")}</Label>
              <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="0" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">{t("তারিখ *", "Date *")}</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("পেমেন্ট মেথড *", "Payment Method *")}</Label>
            <Select name="method" defaultValue="CASH">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {methodLabels[m] || m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="note">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</Label>
            <Input id="note" name="note" placeholder={t("কোনো বিশেষ নোট...", "Optional note...")} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {t("পেমেন্ট সংরক্ষণ করুন", "Record Payment")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
