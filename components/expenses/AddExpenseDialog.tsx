"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createExpenseAction } from "@/app/actions/finance.actions";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS_BN,
  SHARING_METHOD_LABELS,
  SHARING_METHOD_LABELS_BN,
} from "@/lib/constants/categories";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function AddExpenseDialog({ members }: { members: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, language } = usePreferences();

  const categoryLabels = language === "bn" ? EXPENSE_CATEGORY_LABELS_BN : EXPENSE_CATEGORY_LABELS;
  const sharingLabels = language === "bn" ? SHARING_METHOD_LABELS_BN : SHARING_METHOD_LABELS;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createExpenseAction({
        title: fd.get("title"),
        category: fd.get("category"),
        amount: fd.get("amount"),
        date: fd.get("date"),
        paidById: fd.get("paidById"),
        sharingMethod: fd.get("sharingMethod"),
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
        <Button size="sm" className="gap-1.5 h-8.5 px-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer">
          <Plus size={14} /> {t("খরচ যোগ করুন", "Add Expense")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("নতুন খরচ যোগ করুন", "Add New Expense")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="title">{t("খরচের বিবরণ *", "Title *")}</Label>
            <Input id="title" name="title" placeholder={t("যেমন: পানির ফিল্টার, লাইট মেরামত...", "e.g. Filter service, Light repair...")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("ক্যাটাগরি *", "Category *")}</Label>
              <Select name="category" defaultValue="OTHER">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">{t("পরিমাণ (৳) *", "Amount (৳) *")}</Label>
              <Input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="date">{t("তারিখ *", "Date *")}</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
            <div className="space-y-1">
              <Label>{t("পরিশোধকারী *", "Paid By *")}</Label>
              <Select name="paidById">
                <SelectTrigger><SelectValue placeholder={t("মেম্বার বেছে নিন", "Select member")} /></SelectTrigger>
                <SelectContent>
                  {members.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.user?.name ?? m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("বণ্টন পদ্ধতি", "Sharing Method")}</Label>
            <Select name="sharingMethod" defaultValue="EQUAL">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(sharingLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
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
              {t("খরচ সংরক্ষণ করুন", "Add Expense")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
