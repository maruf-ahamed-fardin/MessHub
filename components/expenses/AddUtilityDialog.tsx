"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { upsertUtilityAction } from "@/app/actions/finance.actions";
import { UTILITY_LABELS_BN, UTILITY_LABELS_EN } from "@/lib/constants/categories";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function AddUtilityDialog({ month, year }: { month: number; year: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("ELECTRICITY");
  const router = useRouter();
  const { t, language } = usePreferences();
  const utilityLabels: Record<string, string> = language === "bn" ? UTILITY_LABELS_BN : UTILITY_LABELS_EN;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await upsertUtilityAction({
        type: type || "ELECTRICITY",
        amount: Number(fd.get("amount")),
        month,
        year,
        date: new Date(fd.get("date") as string),
        note: (fd.get("note") as string) || undefined,
      });

      if (res && !res.success) {
        setError(res.error || t("ইউটিলিটি বিল সংরক্ষণ করা যায়নি", "Failed to save utility bill"));
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t("ইউটিলিটি বিল সংরক্ষণ করতে সমস্যা হয়েছে", "Failed to save utility bill"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (val) setError(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs font-bold rounded-xl"><Plus size={14} /> {t("বিল যুক্ত করুন", "Add Utility Bill")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("ইউটিলিটি বিল যুক্ত করুন", "Add Utility Bill")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {error && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </p>
          )}
          <div className="space-y-1">
            <Label>{t("বিলের ধরন *", "Utility Type *")}</Label>
            <Select value={type} onValueChange={(val) => { if (val) setType(val); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(utilityLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{String(v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="amount">{t("টাকার পরিমাণ (৳) *", "Amount (৳) *")}</Label>
              <Input id="amount" name="amount" type="number" min="0" step="0.01" placeholder="0" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">{t("বিলের তারিখ *", "Bill Date *")}</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="note">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</Label>
            <Input id="note" name="note" placeholder={t("যেমন: মিটার ইউনিট বা স্লিপ নম্বর...", "e.g. Meter unit count, slip number...")} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {t("বিল সংরক্ষণ করুন", "Save Bill")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
