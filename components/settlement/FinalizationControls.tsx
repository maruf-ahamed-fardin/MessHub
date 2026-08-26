"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { finalizeSettlementAction, reopenSettlementAction } from "@/app/actions/app.actions";
import { formatMonthYear } from "@/lib/utils/date";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Loader2 } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface FinalizationControlsProps { month: number; year: number; isFinalized: boolean; }

export function FinalizationControls({ month, year, isFinalized }: FinalizationControlsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const monthLabel = formatMonthYear(month, year);
  const { t } = usePreferences();

  const handleFinalize = async () => {
    setLoading(true);
    try { await finalizeSettlementAction(month, year); router.refresh(); }
    finally { setLoading(false); }
  };

  const handleReopen = async () => {
    setLoading(true);
    try { await reopenSettlementAction(month, year); router.refresh(); }
    finally { setLoading(false); }
  };

  if (isFinalized) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" disabled={loading}>
            <LockOpen size={13} /> {t("মাস পুনরায় আনলক করুন", "Reopen Month")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${monthLabel} পুনরায় আনলক করবেন?`, `Reopen ${monthLabel}?`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "পুনরায় আনলক করলে মেম্বাররা এই মাসের মিল, বাজার এবং পেমেন্ট এন্ট্রি পরিবর্তন করতে পারবেন। শুধুমাত্র ভুল সংশোধনের জন্য এটি করা উচিত।",
                "Members will be able to edit meals, bazar entries, expenses, and payments for this month again. This should only be done to fix errors."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("বাতিল", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopen}>{t("আনলক করুন", "Reopen")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={loading}>
          <Lock size={13} /> {t("মাস ফাইনাল ও লক করুন", "Finalize Month")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`${monthLabel} ফাইনাল ও লক করবেন?`, `Finalize ${monthLabel}?`)}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              "ফাইনাল করার পর এই মাসের মিল, বাজার ও খরচের হিসাব লক হয়ে যাবে এবং কোনো সাধারণ পরিবর্তন করা যাবে না। প্রয়োজনে পরে আবার আনলক করা যাবে।",
              "After finalizing, members will not be able to edit meals, bazar entries, expenses, or payments for this month. The settlement will be locked. You can reopen it if needed."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("বাতিল", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleFinalize} className="bg-primary">
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {t("ফাইনাল করুন", "Finalize")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
