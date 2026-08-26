"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, ShoppingBasket, ArrowLeftRight, Loader2 } from "lucide-react";
import { updateBazarScheduleAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface BazarScheduleSectionProps {
  schedules: any[];
  members: any[];
  isAdmin: boolean;
}

export function BazarScheduleSection({ schedules: initialSchedules, members }: BazarScheduleSectionProps) {
  const router = useRouter();
  const { t, language } = usePreferences();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  const todaySchedule = schedules.find((s) => {
    const sDate = new Date(s.date).toISOString().split("T")[0];
    return sDate === todayDateStr;
  }) ?? schedules[0];

  const handleUpdateSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const newMemberId = fd.get("memberId") as string;
    const newMember = members.find((m) => m.id === newMemberId);

    // Optimistic update
    setSchedules((prev) =>
      prev.map((s) => (s.id === editingSchedule.id ? { ...s, memberId: newMemberId, member: newMember, status: "SWAPPED" } : s))
    );
    setEditingSchedule(null);

    try {
      await updateBazarScheduleAction(editingSchedule.id, newMemberId);
      router.refresh();
    } catch (err) {
      console.error("Failed to update schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const dateLocale = language === "bn" ? "bn-BD" : "en-US";

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
      {/* 1. Header with Today's Buyer Highlight */}
      <div className="border-b border-gray-100 dark:border-slate-800 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar size={15} className="text-primary" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
              {t("বাজার শিডিউল", "Bazar Schedule")}
            </h3>
          </div>
          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {t(`${members.length} জনের তালিকা`, `${members.length} Members List`)}
          </span>
        </div>

        {todaySchedule && (
          <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ShoppingBasket size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  {t("আজকের বাজার দায়িত্ব", "Today's Bazar Duty")}
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                  {todaySchedule.member?.user?.name ?? "Member"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditingSchedule(todaySchedule)}
              className="h-6 px-2 text-[11px] font-medium border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-800 hover:bg-amber-50 rounded-lg shrink-0 gap-1"
            >
              <ArrowLeftRight size={11} />
              {t("বদল", "Swap")}
            </Button>
          </div>
        )}
      </div>

      {/* 2. Compact 7-Member Rotation List */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          {t("সাপ্তাহিক রোস্টার", "Weekly Roster")}
        </p>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {schedules.map((schedule, idx) => {
            const sDate = new Date(schedule.date);
            const isToday = sDate.toISOString().split("T")[0] === todayDateStr;
            const memberName = schedule.member?.user?.name ?? "Member";
            const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const formattedDate = sDate.toLocaleDateString(dateLocale, { month: "short", day: "numeric" });

            return (
              <div
                key={schedule.id}
                className={cn(
                  "py-2 px-2 flex items-center justify-between gap-2 rounded-xl transition-colors",
                  isToday ? "bg-amber-50/60 dark:bg-amber-950/20 font-semibold" : "hover:bg-gray-50/70 dark:hover:bg-slate-800/50"
                )}
              >
                {/* Date & Member */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-11 text-center shrink-0">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-slate-100 leading-tight">{formattedDate}</p>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">
                      {t(`দিন ${idx + 1}`, `Day ${idx + 1}`)}
                    </p>
                  </div>

                  <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />

                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate leading-tight">{memberName}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{schedule.dayName ?? "Day"}</p>
                  </div>
                </div>

                {/* Right: Status / Swap Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isToday ? (
                    <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                      {t("আজ", "Today")}
                    </span>
                  ) : schedule.status === "DONE" ? (
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-full">
                      {t("হয়েছে ✓", "Done ✓")}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setEditingSchedule(schedule)}
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={t("দায়িত্ব পরিবর্তন করুন", "Change buyer")}
                  >
                    <ArrowLeftRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swap Buyer Dialog */}
      <Dialog open={Boolean(editingSchedule)} onOpenChange={(open) => !open && setEditingSchedule(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t("বাজারের দায়িত্ব পরিবর্তন করুন", "Change Bazar Responsibility")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule} className="space-y-3.5 mt-2">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("তারিখ:", "Date:")} <strong className="text-gray-900 dark:text-slate-100">{editingSchedule?.dayName}</strong> (
              {editingSchedule ? new Date(editingSchedule.date).toLocaleDateString(dateLocale, { month: "short", day: "numeric" }) : ""}
              )
            </p>

            <div className="space-y-1">
              <Label>{t("বাজার কে করবে? *", "Who will do the bazar? *")}</Label>
              <Select name="memberId" defaultValue={editingSchedule?.memberId ?? members[0]?.id ?? ""}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.user?.name ?? m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingSchedule(null)} className="flex-1">
                {t("বাতিল", "Cancel")}
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-white" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {t("সেভ করুন ✓", "Save ✓")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
