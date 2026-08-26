"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Calendar as CalendarIcon, ShoppingBasket, UtensilsCrossed, Brush,
  CreditCard, Bell, Plus, Lock, Trash2, Clock, CheckCircle2,
  Bookmark, Briefcase, GraduationCap, Sparkles, Loader2,
} from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createCalendarEventAction, deleteCalendarEventAction } from "@/app/actions/app.actions";

interface CalendarViewProps {
  month: number;
  year: number;
  isAdmin: boolean;
  currentUserId?: string;
  bazars: any[];
  meals: any[];
  cleanings: any[];
  payments: any[];
  notices: any[];
  events: any[];
}

export function CalendarView({
  month,
  year,
  currentUserId,
  bazars,
  meals,
  cleanings,
  payments,
  notices,
  events: initialEvents,
}: CalendarViewProps) {
  const today = new Date();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [events, setEvents] = useState<any[]>(initialEvents || []);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for new personal schedule
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("PERSONAL");
  const [newTime, setNewTime] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState(
    `${year}-${String(month).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  const { t, language } = usePreferences();

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const dateLocale = language === "bn" ? "bn-BD" : "en-US";
  const monthName = new Date(year, month - 1).toLocaleString(dateLocale, { month: "long", year: "numeric" });

  const selectedDateObj = new Date(year, month - 1, selectedDay);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString(dateLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const dayHeaders = language === "bn"
    ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Group everything by day (1..31)
  const dayData: Record<number, {
    bazars: any[];
    mealsCount: { breakfast: number; lunch: number; dinner: number; total: number };
    cleanings: any[];
    payments: any[];
    notices: any[];
    events: any[];
  }> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    dayData[d] = {
      bazars: [],
      mealsCount: { breakfast: 0, lunch: 0, dinner: 0, total: 0 },
      cleanings: [],
      payments: [],
      notices: [],
      events: [],
    };
  }

  // 1. Bazars
  for (const b of bazars) {
    const d = new Date(b.date).getDate();
    if (dayData[d]) dayData[d].bazars.push(b);
  }

  // 2. Meals
  for (const m of meals) {
    const d = new Date(m.date).getDate();
    if (dayData[d]) {
      if (m.breakfast) dayData[d].mealsCount.breakfast += 1;
      if (m.lunch) dayData[d].mealsCount.lunch += 1;
      if (m.dinner) dayData[d].mealsCount.dinner += 1;
      dayData[d].mealsCount.total =
        dayData[d].mealsCount.breakfast + dayData[d].mealsCount.lunch + dayData[d].mealsCount.dinner;
    }
  }

  // 3. Cleanings
  for (const c of cleanings) {
    const d = new Date(c.dueDate).getDate();
    if (dayData[d]) dayData[d].cleanings.push(c);
  }

  // 4. Payments
  for (const p of payments) {
    const d = new Date(p.date).getDate();
    if (dayData[d]) dayData[d].payments.push(p);
  }

  // 5. Notices
  for (const n of notices) {
    const d = new Date(n.createdAt).getDate();
    if (dayData[d]) dayData[d].notices.push(n);
  }

  // 6. Private Personal Events
  for (const e of events) {
    const d = new Date(e.date).getDate();
    if (dayData[d]) dayData[d].events.push(e);
  }

  const currentDayInfo = dayData[selectedDay] ?? {
    bazars: [],
    mealsCount: { breakfast: 0, lunch: 0, dinner: 0, total: 0 },
    cleanings: [],
    payments: [],
    notices: [],
    events: [],
  };

  const hasAnyActivity =
    currentDayInfo.bazars.length > 0 ||
    currentDayInfo.mealsCount.total > 0 ||
    currentDayInfo.cleanings.length > 0 ||
    currentDayInfo.payments.length > 0 ||
    currentDayInfo.notices.length > 0 ||
    currentDayInfo.events.length > 0;

  // Handle Create Private Schedule
  const handleCreatePersonalSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    const dateToUse = newDate || `${year}-${String(month).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    const [y, m, d] = dateToUse.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    const optimisticEvent = {
      id: `temp-ev-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      date: dateObj,
      description: newDescription.trim() ? (newTime ? `⏰ ${newTime} • ${newDescription.trim()}` : newDescription.trim()) : (newTime ? `⏰ ${newTime}` : null),
      createdById: currentUserId || "me",
    };

    setEvents((prev) => [...prev, optimisticEvent]);
    setNewTitle("");
    setNewDescription("");
    setNewTime("");
    setAddDialogOpen(false);

    try {
      await createCalendarEventAction({
        title: optimisticEvent.title,
        date: dateToUse,
        type: newType,
        description: optimisticEvent.description || undefined,
      });
      router.refresh();
    } catch (err) {
      console.error("Error creating personal schedule:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Private Schedule
  const handleDeletePersonalSchedule = async (eventId: string) => {
    if (!confirm(t("আপনি কি এই ব্যক্তিগত শিডিউলটি মুছে ফেলতে চান?", "Are you sure you want to delete this personal schedule?"))) return;

    setEvents((prev) => prev.filter((e) => e.id !== eventId));

    try {
      await deleteCalendarEventAction(eventId);
      router.refresh();
    } catch (err) {
      console.error("Error deleting personal schedule:", err);
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "STUDY":
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 gap-1">
            <GraduationCap size={11} /> {t("পড়াশোনা", "Study")}
          </Badge>
        );
      case "WORK":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1">
            <Briefcase size={11} /> {t("কাজ / অফিস", "Work")}
          </Badge>
        );
      case "REMINDER":
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1">
            <Bookmark size={11} /> {t("রিমাইন্ডার", "Reminder")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 gap-1">
            <Lock size={10} /> {t("ব্যক্তিগত", "Private")}
          </Badge>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: Mini Calendar Widget */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 max-w-sm">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={15} className="text-primary" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">{monthName}</h3>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {t(`${daysInMonth} দিন`, `${daysInMonth} Days`)}
          </span>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 py-1 border-b border-gray-100 dark:border-slate-800">
          {dayHeaders.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`blank-${i}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const isToday =
              today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;
            const isSelected = selectedDay === day;
            const info = dayData[day];

            const hasBazar = info?.bazars.length > 0;
            const hasCleaning = info?.cleanings.length > 0;
            const hasPayment = info?.payments.length > 0;
            const hasPrivateEvent = info?.events.length > 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  setNewDate(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
                }}
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer select-none mx-auto",
                  isSelected
                    ? "bg-primary text-white font-bold shadow-xs ring-2 ring-primary/40 scale-105"
                    : isToday
                    ? "bg-primary/10 text-primary font-bold hover:bg-primary/15"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium"
                )}
              >
                <span className="text-[11px] leading-none">{day}</span>

                {/* Activity Indicator Dots */}
                {(hasBazar || hasCleaning || hasPayment || hasPrivateEvent) && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {hasBazar && (
                      <span
                        className={cn("w-1 h-1 rounded-full", isSelected ? "bg-amber-300" : "bg-amber-500")}
                      />
                    )}
                    {hasCleaning && (
                      <span
                        className={cn("w-1 h-1 rounded-full", isSelected ? "bg-teal-300" : "bg-teal-500")}
                      />
                    )}
                    {hasPayment && (
                      <span
                        className={cn("w-1 h-1 rounded-full", isSelected ? "bg-emerald-300" : "bg-emerald-500")}
                      />
                    )}
                    {hasPrivateEvent && (
                      <span
                        className={cn("w-1 h-1 rounded-full", isSelected ? "bg-purple-300" : "bg-purple-500")}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mini Legend */}
        <div className="flex items-center justify-center gap-2.5 pt-2.5 border-t border-gray-100 dark:border-slate-800 text-[10px] text-gray-500 dark:text-slate-400 font-medium flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {t("বাজার", "Bazar")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> {t("ডিউটি", "Duty")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("পেমেন্ট", "Payment")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> {t("ব্যক্তিগত", "Private")}
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Detailed Day Timeline */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Selected Date Header + Add Personal Schedule Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                {t("তারিখের বিস্তারিত বিবরণ", "Day Schedule & Details")}
              </span>
              <span className="text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
                {t(`দিন ${selectedDay} / ${daysInMonth}`, `Day ${selectedDay} of ${daysInMonth}`)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100 mt-0.5">{formattedSelectedDate}</h2>
          </div>

          {/* Add Personal Private Schedule Dialog Button */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer select-none shrink-0"
              >
                <Plus size={14} />
                <span>{t("ব্যক্তিগত শিডিউল যোগ", "Add Personal Schedule")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 rounded-3xl p-5">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Lock size={16} />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-gray-900 dark:text-slate-100">
                      {t("ব্যক্তিগত শিডিউল তৈরি করুন", "Create Personal Schedule")}
                    </DialogTitle>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {t("🔒 এটি সম্পূর্ণ ব্যক্তিগত, শুধুমাত্র আপনিই দেখতে পাবেন।", "🔒 100% Private, only visible from your account.")}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleCreatePersonalSchedule} className="space-y-3.5 mt-3">
                <div className="space-y-1">
                  <Label htmlFor="title" className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    {t("কাজের শিরোনাম *", "Schedule Title *")}
                  </Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t("যেমন: ডাক্তারের অ্যাপয়েন্টমেন্ট, পরীক্ষার পড়া, ওষুধ কেনা...", "e.g. Doctor appointment, Exam revision, buy medicine...")}
                    required
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                      {t("ক্যাটাগরি", "Category")}
                    </Label>
                    <Select value={newType} onValueChange={(val) => { if (val) setNewType(val); }}>
                      <SelectTrigger className="h-9.5 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">🔒 {t("ব্যক্তিগত", "Private")}</SelectItem>
                        <SelectItem value="STUDY">📚 {t("পড়াশোনা", "Study")}</SelectItem>
                        <SelectItem value="WORK">💼 {t("কাজ / অফিস", "Work")}</SelectItem>
                        <SelectItem value="REMINDER">⏰ {t("রিমাইন্ডার", "Reminder")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="time" className="text-xs font-bold text-gray-700 dark:text-slate-300">
                      {t("সময় (ঐচ্ছিক)", "Time (optional)")}
                    </Label>
                    <Input
                      id="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder={t("যেমন: সকাল ১০:৩০ / 6:00 PM", "e.g. 10:30 AM / 6:00 PM")}
                      className="h-9.5 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    {t("তারিখ *", "Date *")}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="h-9.5 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc" className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    {t("বিবরণ ও নোট (ঐচ্ছিক)", "Description / Notes (optional)")}
                  </Label>
                  <Textarea
                    id="desc"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={t("প্রয়োজনীয় তথ্য বা বিস্তারিত নোট লিখুন...", "Add any specific details or notes...")}
                    rows={2}
                    className="text-xs rounded-xl resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                    className="flex-1 h-9 rounded-xl text-xs font-bold"
                    disabled={submitting}
                  >
                    {t("বাতিল", "Cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newTitle.trim() || submitting}
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    {t("শিডিউল সংরক্ষণ করুন", "Save Schedule")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!hasAnyActivity ? (
          <div className="py-12 text-center text-gray-400 dark:text-slate-500 space-y-2">
            <CalendarIcon size={28} className="mx-auto text-gray-300 dark:text-slate-600 stroke-1" />
            <p className="text-sm font-medium">{t("এই তারিখে কোনো বাজার, ডিউটি বা ব্যক্তিগত শিডিউল নেই।", "No bazar, duty, or personal schedules on this date.")}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{t("ওপরের বাটন থেকে নিজের ব্যক্তিগত শিডিউল যোগ করতে পারেন।", "Use the button above to add your private personal schedule.")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 1. Private Personal Schedule Section (Encapsulated & Private) */}
            {currentDayInfo.events.length > 0 && (
              <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/90 dark:border-purple-800/60 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-black text-xs">
                    <div className="w-5.5 h-5.5 rounded-lg bg-purple-200/80 dark:bg-purple-900/80 flex items-center justify-center text-purple-800 dark:text-purple-300">
                      <Lock size={12} />
                    </div>
                    <span>{t("আপনার ব্যক্তিগত শিডিউল (শুধুমাত্র আপনি দেখতে পাবেন)", "My Personal Schedule (Private to you)")}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                    {t(`${currentDayInfo.events.length} টি কাজ`, `${currentDayInfo.events.length} tasks`)}
                  </span>
                </div>

                <div className="space-y-2">
                  {currentDayInfo.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-purple-100 dark:border-slate-800 shadow-2xs flex items-start justify-between gap-3 group transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-gray-900 dark:text-slate-100 leading-tight">
                            {ev.title}
                          </p>
                          {getEventTypeBadge(ev.type)}
                        </div>
                        {ev.description && (
                          <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePersonalSchedule(ev.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        title={t("মুছে ফেলুন", "Delete")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Bazar Details */}
            {currentDayInfo.bazars.length > 0 && (
              <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                    <ShoppingBasket size={15} className="text-amber-600 dark:text-amber-400" />
                    <span>{t("আজকের বাজার তালিকা", "Today's Bazar Details")}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {formatCurrency(currentDayInfo.bazars.reduce((s, b) => s + Number(b.totalAmount), 0))}
                  </span>
                </div>

                {currentDayInfo.bazars.map((b) => (
                  <div key={b.id} className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-amber-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                        {t(`বাজার করেছে: ${b.buyerMember?.user?.name ?? "Member"}`, `Purchased by: ${b.buyerMember?.user?.name ?? "Member"}`)}
                      </p>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(Number(b.totalAmount))}</span>
                    </div>
                    {b.items && b.items.length > 0 && (
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        {t("আইটেম:", "Items:")} {b.items.map((it: any) => `${it.productName} (${it.quantity}${it.unit})`).join(", ")}
                      </div>
                    )}
                    {b.note && <p className="text-[11px] text-gray-400 dark:text-slate-500">{t(`নোট: ${b.note}`, `Note: ${b.note}`)}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* 3. Meals Breakdown */}
            {currentDayInfo.mealsCount.total > 0 && (
              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs">
                    <UtensilsCrossed size={15} className="text-blue-600 dark:text-blue-400" />
                    <span>{t("আজকের মোট মিল সংখ্যা", "Total Meals on this Date")}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    {t(`${currentDayInfo.mealsCount.total} টি মিল`, `${currentDayInfo.mealsCount.total} Meals`)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-0.5">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-slate-800">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{t("☀️ সকাল", "☀️ Breakfast")}</p>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{currentDayInfo.mealsCount.breakfast}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-slate-800">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{t("🍽️ দুপুর", "🍽️ Lunch")}</p>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400">{currentDayInfo.mealsCount.lunch}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-100 dark:border-slate-800">
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{t("🌙 রাত", "🌙 Dinner")}</p>
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{currentDayInfo.mealsCount.dinner}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Cleaning Duties */}
            {currentDayInfo.cleanings.length > 0 && (
              <div className="bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
                  <Brush size={15} className="text-teal-600 dark:text-teal-400" />
                  <span>{t("ক্লিনিং দায়িত্ব ও শিডিউল", "Cleaning Schedule")}</span>
                </div>

                {currentDayInfo.cleanings.map((c) => (
                  <div key={c.id} className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-teal-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100">{c.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        {t(`স্থান: ${c.location}`, `Location: ${c.location}`)} • {t(`দায়িত্বে: ${c.assignedMember?.user?.name ?? "Member"}`, `Assigned: ${c.assignedMember?.user?.name ?? "Member"}`)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        c.status === "DONE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                      )}
                    >
                      {c.status === "DONE" ? t("সম্পন্ন ✓", "Done ✓") : t("পেন্ডিং", "Pending")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Payments */}
            {currentDayInfo.payments.length > 0 && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CreditCard size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t("জমা ও পেমেন্ট রেকর্ড", "Deposits & Payments")}</span>
                </div>

                {currentDayInfo.payments.map((p) => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-emerald-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100">{p.member?.user?.name ?? "Member"}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">{t(`পেমেন্ট মেথড: ${p.method}`, `Method: ${p.method}`)} {p.note ? `• ${p.note}` : ""}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+{formatCurrency(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Notices / Meetings */}
            {currentDayInfo.notices.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-black text-xs">
                  <div className="w-6 h-6 rounded-lg bg-purple-200/80 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <Bell size={13} />
                  </div>
                  <span>{t("নোটিশ ও মিটিং", "Notices & Announcements")}</span>
                </div>

                {currentDayInfo.notices.map((n) => (
                  <div key={n.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-purple-100 dark:border-slate-800 shadow-2xs">
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100">{n.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{n.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
