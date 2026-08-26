"use client";

import { cn } from "@/lib/utils/cn";
import { Calendar as CalendarIcon } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MealCalendarProps {
  calendarData: Record<string, any[]>;
  month: number;
  year: number;
}

export function MealCalendar({ calendarData, month, year }: MealCalendarProps) {
  const { t, language } = usePreferences();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = new Date();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const dateLocale = language === "bn" ? "bn-BD" : "en-US";
  const monthName = new Date(year, month - 1).toLocaleString(dateLocale, { month: "long", year: "numeric" });

  const dayHeaders = language === "bn"
    ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-primary" />
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{monthName}</p>
        </div>
        <span className="text-[11px] text-gray-400 dark:text-slate-500">{t("মাসিক মিল হিস্ট্রি", "Meal History")}</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-semibold text-gray-400 dark:text-slate-500">
        {dayHeaders.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((i) => (
          <div key={`b-${i}`} className="h-7 w-7" />
        ))}
        {days.map((day) => {
          const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const meals = calendarData[key] ?? [];
          const totalMeals = meals.reduce(
            (sum: number, m: any) => sum + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0),
            0
          );
          const isToday =
            today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;

          return (
            <div
              key={day}
              className={cn(
                "h-7 w-7 flex flex-col items-center justify-center rounded-md text-[11px] font-medium transition-all select-none mx-auto",
                isToday
                  ? "bg-primary text-white font-bold shadow-xs ring-2 ring-primary/30"
                  : totalMeals > 0
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                  : "text-gray-400 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800"
              )}
              title={`${monthName} ${day}: ${totalMeals} ${t("মিল", "meals")}`}
            >
              <span>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
