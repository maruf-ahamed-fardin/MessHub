"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, ShoppingBasket, ArrowLeftRight, Loader2 } from "lucide-react";
import { updateBazarScheduleAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";

interface BazarScheduleSectionProps {
  schedules: any[];
  members: any[];
  isAdmin: boolean;
}

export function BazarScheduleSection({ schedules: initialSchedules, members }: BazarScheduleSectionProps) {
  const router = useRouter();
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

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3.5">
      {/* 1. Header with Today's Buyer Highlight */}
      <div className="border-b border-gray-100 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar size={15} className="text-primary" />
            <h3 className="font-bold text-sm text-gray-900">বাজার শিডিউল (Schedule)</h3>
          </div>
          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            ৭ জনের তালিকা
          </span>
        </div>

        {todaySchedule && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ShoppingBasket size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">আজকের বাজার দায়িত্ব</p>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {todaySchedule.member?.user?.name ?? "Member"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditingSchedule(todaySchedule)}
              className="h-6 px-2 text-[11px] font-medium border-amber-300 text-amber-900 bg-white hover:bg-amber-50 rounded-lg shrink-0 gap-1"
            >
              <ArrowLeftRight size={11} />
              বদল
            </Button>
          </div>
        )}
      </div>

      {/* 2. Compact 7-Member Rotation List */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">সাপ্তাহিক রোস্টার</p>

        <div className="divide-y divide-gray-100">
          {schedules.map((schedule, idx) => {
            const sDate = new Date(schedule.date);
            const isToday = sDate.toISOString().split("T")[0] === todayDateStr;
            const memberName = schedule.member?.user?.name ?? "Member";
            const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const formattedDate = sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <div
                key={schedule.id}
                className={cn(
                  "py-2 px-2 flex items-center justify-between gap-2 rounded-xl transition-colors",
                  isToday ? "bg-amber-50/60 font-semibold" : "hover:bg-gray-50/70"
                )}
              >
                {/* Date & Member */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-11 text-center shrink-0">
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">{formattedDate}</p>
                    <p className="text-[9px] text-gray-400 font-medium">দিন {idx + 1}</p>
                  </div>

                  <div className="h-6 w-px bg-gray-200 shrink-0" />

                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate leading-tight">{memberName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{schedule.dayName ?? "Day"}</p>
                  </div>
                </div>

                {/* Right: Status / Swap Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isToday ? (
                    <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                      আজ
                    </span>
                  ) : schedule.status === "DONE" ? (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      হয়েছে ✓
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setEditingSchedule(schedule)}
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Change buyer"
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
            <DialogTitle>বাজারের দায়িত্ব পরিবর্তন করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSchedule} className="space-y-3.5 mt-2">
            <p className="text-xs text-gray-500">
              তারিখ: <strong className="text-gray-900">{editingSchedule?.dayName}</strong> (
              {editingSchedule ? new Date(editingSchedule.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
              )
            </p>

            <div className="space-y-1">
              <Label>বাজার কে করবে? *</Label>
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
                বাতিল
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-white" disabled={loading}>
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                সেভ করুন ✓
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
