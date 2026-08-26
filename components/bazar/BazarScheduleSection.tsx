"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar, ShoppingBasket, ArrowLeftRight, Loader2,
  ShieldCheck, MessageSquare, Check, X, PlusCircle, Bell
} from "lucide-react";
import {
  updateBazarScheduleAction,
  assignBazarScheduleAction,
  createBazarSwapRequestAction,
  acceptBazarSwapRequestAction,
  cancelBazarSwapRequestAction,
} from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface BazarScheduleSectionProps {
  schedules: any[];
  members: any[];
  isAdmin: boolean;
  currentMemberId?: string;
  pendingSwaps?: any[];
}

export function BazarScheduleSection({
  schedules: initialSchedules,
  members,
  isAdmin,
  currentMemberId,
  pendingSwaps: initialPendingSwaps = [],
}: BazarScheduleSectionProps) {
  const router = useRouter();
  const { t, language } = usePreferences();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [pendingSwaps, setPendingSwaps] = useState(initialPendingSwaps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPendingSwaps(initialPendingSwaps);
  }, [initialPendingSwaps]);

  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  // Dialog States
  const [adminAssignDialogOpen, setAdminAssignDialogOpen] = useState(false);
  const [adminTargetSchedule, setAdminTargetSchedule] = useState<any>(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapTargetSchedule, setSwapTargetSchedule] = useState<any>(null);
  const [selectedTargetMemberId, setSelectedTargetMemberId] = useState<string>("ALL");

  const openSwapDialog = (schedule: any) => {
    setSwapTargetSchedule(schedule);
    setSelectedTargetMemberId(schedule?.memberId ?? "ALL");
    setError(null);
    setSwapDialogOpen(true);
  };

  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  const todaySchedule = schedules.find((s) => {
    const sDate = new Date(s.date).toISOString().split("T")[0];
    return sDate === todayDateStr;
  }) ?? schedules[0];

  // 1. Admin Direct Schedule Assignment / Update
  const handleAdminAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const dateStr = fd.get("date") as string;
    const memberId = fd.get("memberId") as string;
    const note = (fd.get("note") as string) || undefined;

    try {
      if (adminTargetSchedule?.id) {
        const res = await updateBazarScheduleAction(adminTargetSchedule.id, memberId, note);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await assignBazarScheduleAction(dateStr, memberId, undefined, note);
        if (!res.success) throw new Error(res.error);
      }
      setAdminAssignDialogOpen(false);
      setAdminTargetSchedule(null);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? t("শিডিউল সংরক্ষণ করতে ব্যর্থ হয়েছে", "Failed to save schedule"));
    } finally {
      setLoading(false);
    }
  };

  // 2. Member Create Swap Request
  const handleCreateSwapRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!swapTargetSchedule) return;
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const targetDate = (fd.get("targetDate") as string) || undefined;
    const reason = (fd.get("reason") as string) || undefined;

    try {
      const res = await createBazarSwapRequestAction({
        scheduleId: swapTargetSchedule.id,
        targetDate,
        targetMemberId: selectedTargetMemberId === "ALL" ? undefined : selectedTargetMemberId,
        reason,
      });

      if (res && res.success) {
        const requester = members.find((m) => m.id === currentMemberId);
        const targetMember = selectedTargetMemberId !== "ALL" ? members.find((m) => m.id === selectedTargetMemberId) : null;
        const newReq = {
          id: (res as any).id ?? "swap-" + Date.now(),
          scheduleId: swapTargetSchedule.id,
          requesterId: currentMemberId ?? "me",
          targetDate: targetDate ? new Date(targetDate) : null,
          targetMemberId: selectedTargetMemberId === "ALL" ? null : selectedTargetMemberId,
          reason: reason ?? "",
          status: "PENDING",
          schedule: swapTargetSchedule,
          requester: { user: { name: requester?.user?.name ?? t("আপনি (You)", "You") } },
          targetMember: targetMember ? { user: { name: targetMember.user?.name } } : null,
        };
        setPendingSwaps((prev) => [newReq, ...prev.filter((p) => p.id !== newReq.id)]);
        setSwapDialogOpen(false);
        setSwapTargetSchedule(null);
        router.refresh();
      } else {
        setError(res?.error ?? t("সোয়াপ রিকোয়েস্ট তৈরি করা সম্ভব হয়নি", "Failed to create swap request"));
      }
    } catch (err: any) {
      setError(err?.message ?? t("সোয়াপ রিকোয়েস্ট তৈরি করতে ব্যর্থ হয়েছে", "Failed to request swap"));
    } finally {
      setLoading(false);
    }
  };

  // 3. Accept Swap Request
  const handleAcceptSwap = async (requestId: string) => {
    if (!confirm(t("আপনি কি নিশ্চিত এই বাজার দায়িত্বটি গ্রহণ করতে চান?", "Are you sure you want to accept this bazar duty?"))) return;
    setLoading(true);
    try {
      const res = await acceptBazarSwapRequestAction(requestId);
      if (res && res.success) {
        setPendingSwaps((prev) => prev.filter((p) => p.id !== requestId));
        router.refresh();
      } else {
        alert(res?.error || "Failed to accept swap");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to accept swap");
    } finally {
      setLoading(false);
    }
  };

  // 4. Cancel Swap Request
  const handleCancelSwap = async (requestId: string) => {
    if (!confirm(t("আপনি কি নিশ্চিত এই সোয়াপ রিকোয়েস্টটি বাতিল করতে চান?", "Cancel this swap request?"))) return;
    setLoading(true);
    try {
      const res = await cancelBazarSwapRequestAction(requestId);
      if (res && res.success) {
        setPendingSwaps((prev) => prev.filter((p) => p.id !== requestId));
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const dateLocale = language === "bn" ? "bn-BD" : "en-US";

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-4">
      {/* 1. Header with Admin Schedule Control & Quick Swap Action */}
      <div className="border-b border-gray-100 dark:border-slate-800 pb-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-slate-100 leading-tight">
                {t("বাজার শিডিউল ও সোয়াপ", "Bazar Schedule & Swap")}
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                {t("রোস্টার তালিকা ও সোয়াপ রিকোয়েস্ট", "Duty Roster & Swap Requests")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setAdminTargetSchedule(null);
                  setAdminAssignDialogOpen(true);
                }}
                className="h-7 px-2.5 text-[11px] font-bold border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 rounded-xl gap-1 cursor-pointer"
              >
                <PlusCircle size={12} />
                {t("তারিখ নির্ধারণ", "Set Date")}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openSwapDialog(todaySchedule)}
              className="h-7 px-2.5 text-[11px] font-bold border-amber-300 dark:border-amber-700/80 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/40 hover:bg-amber-100/70 rounded-xl gap-1 cursor-pointer"
            >
              <ArrowLeftRight size={12} />
              {t("সোয়াপ অনুরোধ", "Request Swap")}
            </Button>
          </div>
        </div>

        {/* Today's Duty Hero Card */}
        {todaySchedule && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ShoppingBasket size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    {t("আজকের বাজার দায়িত্ব", "Today's Bazar Duty")}
                  </p>
                </div>
                <p className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">
                  {todaySchedule.member?.user?.name ?? "Member"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => openSwapDialog(todaySchedule)}
                className="h-7 px-2.5 text-[11px] font-bold border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl gap-1 cursor-pointer"
              >
                <ArrowLeftRight size={11} />
                {t("সোয়াপ", "Swap")}
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAdminTargetSchedule(todaySchedule);
                    setAdminAssignDialogOpen(true);
                  }}
                  className="h-7 px-2 text-[11px] font-bold border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-primary rounded-xl gap-1 cursor-pointer"
                  title={t("এডমিন রিবন্টন", "Admin Reassign")}
                >
                  <ShieldCheck size={12} className="text-primary" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Active Swap Requests Banner / Feed */}
      {pendingSwaps && pendingSwaps.length > 0 && (
        <div className="space-y-2.5 bg-gradient-to-br from-indigo-50/80 to-blue-50/60 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-900/70 rounded-3xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <ArrowLeftRight size={13} />
              </div>
              <p className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                {t("বদলানোর সক্রিয় অনুরোধ (Pending Swaps)", "Active Swap Requests")}
              </p>
            </div>
            <span className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
              {pendingSwaps.length}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {pendingSwaps.map((req: any) => {
              const reqDate = req.schedule?.date ? new Date(req.schedule.date) : null;
              const formattedReqDate = reqDate ? reqDate.toLocaleDateString(dateLocale, { month: "short", day: "numeric" }) : "";
              const isRequester = currentMemberId === req.requesterId;
              const targetName = req.targetMember?.user?.name ?? t("সকল সদস্য (উন্মুক্ত)", "All Members (Open)");
              const targetExchangeDate = req.targetDate ? new Date(req.targetDate).toLocaleDateString(dateLocale, { month: "short", day: "numeric" }) : null;

              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-3 rounded-2xl space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-black text-gray-900 dark:text-slate-100 leading-tight">
                        <strong>{req.requester?.user?.name ?? "Member"}</strong>
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-slate-300">
                        📅 <strong>{formattedReqDate}</strong> {t("তারিখের বাজার বদল করতে চান", "wants to swap duty")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold pt-0.5">
                        <span className="bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800">
                          🎯 {t(`প্রাপক: ${targetName}`, `Target: ${targetName}`)}
                        </span>
                        {targetExchangeDate && (
                          <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800">
                            🔄 {t(`বিনিময়: ${targetExchangeDate}`, `Exchange: ${targetExchangeDate}`)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(!isRequester || isAdmin) && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSwap(req.id)}
                          disabled={loading}
                          className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1 cursor-pointer shadow-2xs"
                        >
                          <Check size={12} />
                          {isAdmin && isRequester ? t("অনুমোদন", "Approve") : t("গ্রহণ করুন", "Accept")}
                        </Button>
                      )}
                      {isRequester && !isAdmin && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-200/60 dark:border-amber-800">
                          {t("অপেক্ষমান...", "Pending...")}
                        </span>
                      )}
                      {(isRequester || isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleCancelSwap(req.id)}
                          disabled={loading}
                          className="h-7 w-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={t("বাতিল করুন", "Cancel request")}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {req.reason && (
                    <div className="flex items-start gap-1.5 text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 px-2.5 py-1.5 rounded-xl">
                      <MessageSquare size={12} className="shrink-0 mt-0.5 text-amber-600" />
                      <span className="font-medium italic">"{req.reason}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 7-Day Weekly Roster List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            {t("সাপ্তাহিক রোস্টার", "Weekly Roster")}
          </p>
          <span className="text-[10px] text-gray-400">
            {t("সোয়াপের জন্য বাটনে চাপুন", "Click Swap to request")}
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {schedules.map((schedule, idx) => {
            const sDate = new Date(schedule.date);
            const isToday = sDate.toISOString().split("T")[0] === todayDateStr;
            const memberName = schedule.member?.user?.name ?? "Member";
            const initials = memberName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const formattedDate = sDate.toLocaleDateString(dateLocale, { month: "short", day: "numeric" });
            const hasPendingSwap = pendingSwaps.some((p: any) => p.scheduleId === schedule.id);

            return (
              <div
                key={schedule.id}
                className={cn(
                  "py-2.5 px-2.5 flex items-center justify-between gap-2 rounded-2xl transition-colors",
                  isToday ? "bg-amber-50/70 dark:bg-amber-950/20 font-semibold" : "hover:bg-gray-50/80 dark:hover:bg-slate-800/50"
                )}
              >
                {/* Date & Member */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 text-center shrink-0">
                    <p className="text-[11px] font-black text-gray-900 dark:text-slate-100 leading-tight">{formattedDate}</p>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">
                      {t(`দিন ${idx + 1}`, `Day ${idx + 1}`)}
                    </p>
                  </div>

                  <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />

                  <Avatar className="h-7 w-7 shrink-0 border border-gray-100 dark:border-slate-700">
                    {schedule.member?.user?.image && <AvatarImage src={schedule.member.user.image} />}
                    <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{memberName}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                      {schedule.dayName ?? sDate.toLocaleDateString(dateLocale, { weekday: "long" })}
                      {schedule.note ? ` • ${schedule.note}` : ""}
                    </p>
                  </div>
                </div>

                {/* Right: Status & Action Trigger */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasPendingSwap ? (
                    <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {t("অনুরোধ পেন্ডিং", "Swap Pending")}
                    </span>
                  ) : isToday ? (
                    <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                      {t("আজ", "Today")}
                    </span>
                  ) : schedule.status === "DONE" ? (
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                      {t("হয়েছে ✓", "Done ✓")}
                    </span>
                  ) : null}

                  {/* Swap Button for everyone */}
                  <button
                    type="button"
                    onClick={() => openSwapDialog(schedule)}
                    className="h-7 px-2 rounded-xl flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/80 border border-amber-200 dark:border-amber-900/60 transition-colors cursor-pointer"
                    title={t("বাজার সোয়াপের অনুরোধ পাঠান", "Request Swap")}
                  >
                    <ArrowLeftRight size={11} />
                    <span className="text-[10px]">{t("সোয়াপ", "Swap")}</span>
                  </button>

                  {/* Admin Reassign Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminTargetSchedule(schedule);
                        setAdminAssignDialogOpen(true);
                      }}
                      className="h-7 w-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title={t("এডমিন রিবন্টন করুন", "Admin Reassign")}
                    >
                      <ShieldCheck size={14} className="text-primary" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. ADMIN DIALOG: Direct Date & Member Assignment */}
      {isAdmin && (
        <Dialog open={adminAssignDialogOpen} onOpenChange={setAdminAssignDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm font-black flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <span>{t("বাজারের দায়িত্ব ও তারিখ নির্ধারণ (Admin)", "Set Bazar Duty Schedule")}</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdminAssign} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs font-bold">{t("তারিখ *", "Date *")}</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  defaultValue={
                    adminTargetSchedule?.date
                      ? new Date(adminTargetSchedule.date).toISOString().split("T")[0]
                      : todayDateStr
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">{t("মেম্বার বেছে নিন *", "Select Member *")}</Label>
                <Select name="memberId" defaultValue={adminTargetSchedule?.memberId ?? members[0]?.id ?? ""}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.user?.name ?? m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="note" className="text-xs font-bold">{t("নোট / বিবরণ (ঐচ্ছিক)", "Note (Optional)")}</Label>
                <Input
                  id="note"
                  name="note"
                  defaultValue={adminTargetSchedule?.note ?? ""}
                  placeholder={t("যেমন: বিশেষ বাজার...", "e.g. Special bazar...")}
                  className="h-9 text-xs"
                />
              </div>

              {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</p>}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAdminAssignDialogOpen(false)} className="flex-1 text-xs" disabled={loading}>
                  {t("বাতিল", "Cancel")}
                </Button>
                <Button type="submit" className="flex-1 bg-primary text-white text-xs font-bold" disabled={loading}>
                  {loading ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                  {t("সংরক্ষণ করুন ✓", "Save Schedule ✓")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. MEMBER & ADMIN DIALOG: Request Bazar Swap with Target Person */}
      <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-amber-600" />
              <span>{t("বাজার সোয়াপের অনুরোধ (Swap Request)", "Request Bazar Duty Swap")}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSwapRequest} className="space-y-3.5 mt-2">
            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1">
              <p className="text-xs font-black text-amber-950 dark:text-amber-200">
                {t("বর্তমান দায়িত্বপ্রাপ্ত সদস্য:", "Selected Duty Person:")}{" "}
                <strong className="underline decoration-amber-400">
                  {swapTargetSchedule?.member?.user?.name ?? "Member"}
                </strong>
              </p>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300 font-medium">
                {t("বাজারের তারিখ:", "Bazar Date:")}{" "}
                {swapTargetSchedule?.date
                  ? new Date(swapTargetSchedule.date).toLocaleDateString(dateLocale, { weekday: "long", month: "short", day: "numeric" })
                  : ""}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{t("কার কাছে সোয়াপ অনুরোধ পাঠাবেন? *", "Send Swap Request To *")}</Label>
              <Select
                value={selectedTargetMemberId}
                onValueChange={(val) => {
                  if (val) setSelectedTargetMemberId(val);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={t("মেম্বার বেছে নিন", "Select member")}>
                    {selectedTargetMemberId === "ALL"
                      ? `🌟 ${t("সকল মেম্বার (উন্মুক্ত রিকোয়েস্ট)", "All Members (Open Request)")}`
                      : (() => {
                          const target = members.find((m) => m.id === selectedTargetMemberId);
                          const name = target?.user?.name ?? target?.name ?? selectedTargetMemberId;
                          const isAssigned = selectedTargetMemberId === swapTargetSchedule?.memberId;
                          return isAssigned ? `🎯 ${name} (${t("নির্ধারিত ব্যক্তি", "Assigned Person")})` : name;
                        })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {swapTargetSchedule?.memberId && (
                    <SelectItem value={swapTargetSchedule.memberId}>
                      🎯 {swapTargetSchedule.member?.user?.name ?? "Target Person"} ({t("নির্ধারিত ব্যক্তি", "Assigned Person")})
                    </SelectItem>
                  )}
                  <SelectItem value="ALL">
                    🌟 {t("সকল মেম্বার (উন্মুক্ত রিকোয়েস্ট)", "All Members (Open Request)")}
                  </SelectItem>
                  {members
                    .filter((m) => m.id !== swapTargetSchedule?.memberId)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.user?.name ?? m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="targetDate" className="text-xs font-bold">
                {t("আপনার প্রস্তাবিত বদলের তারিখ (ঐচ্ছিক)", "Your Proposed Exchange Date (Optional)")}
              </Label>
              <Input
                id="targetDate"
                name="targetDate"
                type="date"
                className="h-9 text-xs"
                placeholder={t("তারিখ বেছে নিন...", "Select date...")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="reason" className="text-xs font-bold">
                {t("সোয়াপ করার কারণ / নোট (ঐচ্ছিক)", "Reason / Message for Swap (Optional)")}
              </Label>
              <Input
                id="reason"
                name="reason"
                placeholder={t("যেমন: আমার ওই দিন পরীক্ষা আছে / জরুরি কাজে বাইরে যাচ্ছি...", "e.g. Exam on that day / urgent travel...")}
                className="h-9 text-xs"
              />
            </div>

            {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSwapDialogOpen(false)} className="flex-1 text-xs" disabled={loading}>
                {t("বাতিল", "Cancel")}
              </Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold" disabled={loading}>
                {loading ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                {t("অনুরোধ পাঠান ✈️", "Send Request ✈️")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
