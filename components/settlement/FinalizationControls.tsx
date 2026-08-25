"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { finalizeSettlementAction, reopenSettlementAction } from "@/app/actions/app.actions";
import { formatMonthYear } from "@/lib/utils/date";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Loader2 } from "lucide-react";

interface FinalizationControlsProps { month: number; year: number; isFinalized: boolean; }

export function FinalizationControls({ month, year, isFinalized }: FinalizationControlsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const monthLabel = formatMonthYear(month, year);

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
            <LockOpen size={13} /> Reopen Month
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reopen {monthLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Members will be able to edit meals, bazar entries, expenses, and payments for this month again. This should only be done to fix errors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReopen}>Reopen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={loading}>
          <Lock size={13} /> Finalize Month
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalize {monthLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            After finalizing, members will not be able to edit meals, bazar entries, expenses, or payments for this month. The settlement will be locked. You can reopen it if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleFinalize} className="bg-[hsl(var(--primary))]">
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Finalize"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
