"use client";

import { useState, useTransition } from "react";
import {
  CalendarCheck, Sun, Moon, Utensils, ChevronLeft, ChevronRight,
  Check, X, Save, Loader2, BellOff, BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { updateMealAction } from "@/app/actions/meal.actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MealBookingSheetProps {
  currentMemberId: string | null;
  isAdmin?: boolean;
}

type MealKey = "breakfast" | "lunch" | "dinner";

const MEAL_CONFIG: { key: MealKey; label: string; labelBn: string; icon: React.ElementType; color: string }[] = [
  { key: "breakfast", label: "Breakfast", labelBn: "সকাল", icon: Sun, color: "text-amber-500" },
  { key: "lunch", label: "Lunch", labelBn: "দুপুর", icon: Utensils, color: "text-blue-500" },
  { key: "dinner", label: "Dinner", labelBn: "রাত", icon: Moon, color: "text-indigo-500" },
];

// Get array of upcoming 14 days (today + 7 days window, but show 14 for UI)
function getUpcomingDays(fromToday = true, count = 14) {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_DAY_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

export function MealBookingSheet({ currentMemberId, isAdmin }: MealBookingSheetProps) {
  const { t, language } = usePreferences();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const days = getUpcomingDays(true, 14);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);

  // Per-day meal selections: { "2026-08-26": { breakfast: true, lunch: true, dinner: false }, ... }
  const defaultSelections: Record<string, { breakfast: boolean; lunch: boolean; dinner: boolean }> = {};
  for (const d of days) {
    defaultSelections[toDateKey(d)] = { breakfast: true, lunch: true, dinner: true };
  }

  const [selections, setSelections] = useState(defaultSelections);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  const isEditable = (d: Date) => {
    const dTime = d.getTime();
    return dTime >= today.getTime() && dTime <= maxDate.getTime();
  };

  const toggleDaySelected = (key: string, d: Date) => {
    if (!isEditable(d)) return;
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleMeal = (key: string, meal: MealKey) => {
    setSelections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [meal]: !prev[key][meal],
      },
    }));
  };

  const applyToAll = (meal: MealKey, value: boolean) => {
    setSelections((prev) => {
      const next = { ...prev };
      for (const d of days) {
        if (!isEditable(d)) continue;
        const k = toDateKey(d);
        next[k] = { ...next[k], [meal]: value };
      }
      return next;
    });
  };

  const selectAllDays = () => {
    const editableDays = days.filter(isEditable).map((d) => toDateKey(d));
    setSelectedDays(new Set(editableDays));
  };

  const clearAllDays = () => setSelectedDays(new Set());

  const handleSave = () => {
    if (!currentMemberId || selectedDays.size === 0) return;

    startTransition(async () => {
      const promises = Array.from(selectedDays).map((dateKey) => {
        const sel = selections[dateKey] ?? { breakfast: true, lunch: true, dinner: true };
        return updateMealAction({
          memberId: currentMemberId,
          date: dateKey,
          breakfast: sel.breakfast,
          lunch: sel.lunch,
          dinner: sel.dinner,
        });
      });

      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
        setSelectedDays(new Set());
        router.refresh();
      }, 1500);
    });
  };

  const isBn = language === "bn";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelectedDays(new Set()); setSaved(false); } }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 h-9 text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/25 border-0"
        >
          <CalendarCheck size={15} />
          {t("মিল এন্ট্রি", "Meal Entry")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white">
                <CalendarCheck size={15} />
              </div>
              {t("আগাম মিল এন্ট্রি", "Advance Meal Entry")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
            {t(
              "আজ থেকে পরবর্তী ৭ দিনের মধ্যে আপনার মিল আগে থেকে এন্ট্রি করুন",
              "Pre-enter your meals ON/OFF for the next 7 days"
            )}
          </p>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Meal Type Toggle Header */}
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-3 space-y-2.5">
            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {t("সব দিনের জন্য দ্রুত সেটিং", "Quick set for all days")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {MEAL_CONFIG.map(({ key, label, labelBn, icon: Icon, color }) => {
                const allOn = days.filter(isEditable).every((d) => selections[toDateKey(d)]?.[key]);
                const allOff = days.filter(isEditable).every((d) => !selections[toDateKey(d)]?.[key]);
                return (
                  <div key={key} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-2.5 space-y-2">
                    <div className={cn("flex items-center gap-1.5 text-xs font-bold", color)}>
                      <Icon size={13} />
                      {isBn ? labelBn : label}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => applyToAll(key, true)}
                        className={cn(
                          "flex-1 text-[10px] font-bold py-1 rounded-lg transition-all border",
                          allOn
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-emerald-50"
                        )}
                      >
                        {t("সব চালু", "All ON")}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyToAll(key, false)}
                        className={cn(
                          "flex-1 text-[10px] font-bold py-1 rounded-lg transition-all border",
                          allOff
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-rose-50"
                        )}
                      >
                        {t("সব বন্ধ", "All OFF")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day-by-day grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-gray-800 dark:text-slate-200">
                {t("দিন ও মিল নির্বাচন করুন", "Select Days & Meals")}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  {t("সব বাছাই", "Select All")}
                </button>
                <span className="text-gray-300 dark:text-slate-600 text-xs">|</span>
                <button
                  type="button"
                  onClick={clearAllDays}
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-600 hover:underline cursor-pointer"
                >
                  {t("বাতিল", "Clear")}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {days.map((d) => {
                const key = toDateKey(d);
                const editable = isEditable(d);
                const isSelected = selectedDays.has(key);
                const isToday = d.getTime() === today.getTime();
                const sel = selections[key] ?? { breakfast: true, lunch: true, dinner: true };
                const dayOfWeek = isBn ? SHORT_DAY_BN[d.getDay()] : SHORT_DAY[d.getDay()];
                const dayNum = d.getDate();
                const monthShort = d.toLocaleString("en-US", { month: "short" });

                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-2xl border transition-all",
                      isSelected
                        ? "bg-primary/5 dark:bg-primary/10 border-primary/30"
                        : editable
                        ? "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
                        : "bg-gray-50/50 dark:bg-slate-800/20 border-gray-100 dark:border-slate-800/50 opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      {/* Checkbox-style day selector */}
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => toggleDaySelected(key, d)}
                        className={cn(
                          "w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 transition-all border",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
                            : editable
                            ? "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-primary/50 cursor-pointer"
                            : "cursor-not-allowed"
                        )}
                      >
                        <span className="text-[9px] font-bold leading-none opacity-80">{dayOfWeek}</span>
                        <span className="text-sm font-black leading-tight">{dayNum}</span>
                        <span className="text-[9px] leading-none opacity-70">{monthShort}</span>
                      </button>

                      {/* Day label */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                            {dayOfWeek}, {dayNum} {monthShort}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-black bg-primary text-white px-1.5 py-0.5 rounded-md">
                              {t("আজ", "Today")}
                            </span>
                          )}
                          {!editable && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500">
                              🔒 {t("সীমা পেরিয়েছে", "Out of range")}
                            </span>
                          )}
                        </div>

                        {/* Meal type toggles */}
                        {editable && (
                          <div className="flex gap-1.5 mt-2">
                            {MEAL_CONFIG.map(({ key: mKey, labelBn, label, icon: Icon, color }) => {
                              const on = sel[mKey];
                              return (
                                <button
                                  key={mKey}
                                  type="button"
                                  onClick={() => {
                                    toggleMeal(key, mKey);
                                    // auto-select day when toggling a meal
                                    if (!selectedDays.has(key)) {
                                      setSelectedDays((prev) => new Set([...prev, key]));
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all",
                                    on
                                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                      : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                  )}
                                >
                                  <Icon size={10} />
                                  {isBn ? labelBn : label}
                                  {on ? <Check size={9} /> : <X size={9} />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-5 py-4 space-y-2">
          {selectedDays.size > 0 && (
            <p className="text-xs text-center text-gray-500 dark:text-slate-400">
              {t(
                `${selectedDays.size}টি দিনের মিল সেভ হবে`,
                `${selectedDays.size} day(s) will be updated`
              )}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              {t("বাতিল", "Cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || selectedDays.size === 0 || saved}
              className={cn(
                "flex-1 font-bold text-white transition-all",
                saved
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  {t("সেভ হচ্ছে…", "Saving…")}
                </>
              ) : saved ? (
                <>
                  <Check size={14} className="mr-1.5" />
                  {t("সেভ হয়েছে ✓", "Saved ✓")}
                </>
              ) : (
                <>
                  <Save size={14} className="mr-1.5" />
                  {t(`${selectedDays.size > 0 ? selectedDays.size + " দিন" : ""} সেভ করুন`, `Save ${selectedDays.size > 0 ? selectedDays.size + " day(s)" : ""}`)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
