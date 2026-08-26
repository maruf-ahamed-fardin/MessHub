"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";

interface MealCalendarProps {
  calendarData: Record<string, any[]>;
  month: number;
  year: number;
  selectedDate?: Date;
}

export function MealCalendar({ calendarData, month: initialMonth, year: initialYear, selectedDate }: MealCalendarProps) {
  const router = useRouter();
  const { t, language } = usePreferences();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [viewYear, setViewYear] = useState(initialYear);

  const today = new Date();
  const activeDate = selectedDate || today;

  // Sync view month/year when props change
  useEffect(() => {
    setViewMonth(initialMonth);
    setViewYear(initialYear);
  }, [initialMonth, initialYear]);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const dateLocale = language === "bn" ? "bn-BD" : "en-US";
  
  // Format for the trigger button: e.g. "26 Aug, 2026"
  const formattedTriggerDate = activeDate.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const monthName = new Date(viewYear, viewMonth - 1).toLocaleString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  const dayHeaders = language === "bn"
    ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleSelectDate = (day: number) => {
    const targetKey = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    router.push(`/meals?date=${targetKey}`);
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const isTodaySelected =
    activeDate.getDate() === today.getDate() &&
    activeDate.getMonth() === today.getMonth() &&
    activeDate.getFullYear() === today.getFullYear();

  return (
    <div className="relative inline-block w-full sm:w-auto" ref={popoverRef}>
      {/* 1. Sleek Single Trigger Button: e.g. [ 📅 26 Aug, 2026 ▾ ] */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "h-9 px-3.5 rounded-xl border flex items-center justify-between sm:justify-center gap-2.5 text-xs font-bold transition-all cursor-pointer shadow-2xs w-full sm:w-auto",
          open
            ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20 shadow-xs"
            : !isTodaySelected
            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 hover:border-gray-300 dark:hover:border-slate-700"
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={15} className={cn(isTodaySelected ? "text-primary" : "text-amber-600", "shrink-0")} />
          <span className="font-extrabold">{formattedTriggerDate}</span>
        </div>
        <ChevronDown size={14} className={cn("text-gray-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {/* 2. Floating Popover Monthly Calendar on Click */}
      {open && (
        <div className="absolute top-11 right-0 sm:right-0 z-50 w-full sm:w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Month Header with < > Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
              title={t("আগের মাস", "Previous Month")}
            >
              <ChevronLeft size={14} />
            </button>

            <span className="text-xs font-black text-gray-900 dark:text-slate-100">
              {monthName}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
              title={t("পরের মাস", "Next Month")}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day Headers (Su, Mo, Tu...) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 dark:text-slate-500">
            {dayHeaders.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map((i) => (
              <div key={`b-${i}`} className="h-7 w-7" />
            ))}
            {days.map((day) => {
              const key = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const meals = calendarData[key] ?? [];
              const totalMeals = meals.reduce(
                (sum: number, m: any) => sum + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0),
                0
              );
              const isSelected =
                activeDate.getDate() === day &&
                activeDate.getMonth() + 1 === viewMonth &&
                activeDate.getFullYear() === viewYear;
              const isToday =
                today.getDate() === day && today.getMonth() + 1 === viewMonth && today.getFullYear() === viewYear;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    "h-7 w-7 flex flex-col items-center justify-center rounded-lg text-[11px] font-medium transition-all select-none mx-auto cursor-pointer",
                    isSelected
                      ? "bg-primary text-white font-bold shadow-xs ring-2 ring-primary/40"
                      : isToday
                      ? "bg-primary/20 text-primary font-bold border border-primary/40 hover:bg-primary/30"
                      : totalMeals > 0
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900"
                      : "text-gray-400 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
                  )}
                  title={`${monthName} ${day}: ${totalMeals} ${t("মিল", "meals")}`}
                >
                  <span className="leading-none">{day}</span>
                  {totalMeals > 0 && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-indigo-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with Today Jump Button */}
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" /> {t("নির্বাচিত দিন", "Selected")}
            </span>
            <button
              type="button"
              onClick={() => {
                router.push("/meals");
                setOpen(false);
              }}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              {t("আজকের দিনে যান ➔", "Go to Today ➔")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
