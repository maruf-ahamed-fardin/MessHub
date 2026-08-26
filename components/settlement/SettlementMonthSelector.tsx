"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePreferences } from "@/lib/context/PreferencesContext";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SettlementMonthSelectorProps {
  selectedMonth: number;
  selectedYear: number;
}

const MONTH_NAMES = [
  { bn: "জানুয়ারি", en: "January", shortBn: "জানু", shortEn: "Jan" },
  { bn: "ফেব্রুয়ারি", en: "February", shortBn: "ফেব্রু", shortEn: "Feb" },
  { bn: "মার্চ", en: "March", shortBn: "মার্চ", shortEn: "Mar" },
  { bn: "এপ্রিল", en: "April", shortBn: "এপ্রিল", shortEn: "Apr" },
  { bn: "মে", en: "May", shortBn: "মে", shortEn: "May" },
  { bn: "জুন", en: "June", shortBn: "জুন", shortEn: "Jun" },
  { bn: "জুলাই", en: "July", shortBn: "জুলাই", shortEn: "Jul" },
  { bn: "আগস্ট", en: "August", shortBn: "আগস্ট", shortEn: "Aug" },
  { bn: "সেপ্টেম্বর", en: "September", shortBn: "সেপ্টে", shortEn: "Sep" },
  { bn: "অক্টোবর", en: "October", shortBn: "অক্টো", shortEn: "Oct" },
  { bn: "নভেম্বর", en: "November", shortBn: "নভে", shortEn: "Nov" },
  { bn: "ডিসেম্বর", en: "December", shortBn: "ডিসে", shortEn: "Dec" },
];

export function SettlementMonthSelector({
  selectedMonth,
  selectedYear,
}: SettlementMonthSelectorProps) {
  const router = useRouter();
  const { t, language } = usePreferences();
  const [open, setOpen] = useState(false);
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

  // Last Month calculation
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const [pickerYear, setPickerYear] = useState<number>(selectedYear);

  const isCurrent = selectedMonth === currentMonth && selectedYear === currentYear;
  const isLastMonth = selectedMonth === lastMonth && selectedYear === lastYear;
  const isOtherMonth = !isCurrent && !isLastMonth;

  const navigateTo = (m: number, y: number) => {
    setOpen(false);
    if (m === currentMonth && y === currentYear) {
      router.push("/settlement");
    } else {
      router.push(`/settlement?month=${m}&year=${y}`);
    }
  };

  const currentMonthLabel =
    language === "bn"
      ? `${MONTH_NAMES[selectedMonth - 1].bn} ${selectedYear}`
      : `${MONTH_NAMES[selectedMonth - 1].en} ${selectedYear}`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* 1. Last Month Button */}
      <Button
        size="sm"
        variant={isLastMonth ? "default" : "outline"}
        onClick={() => navigateTo(lastMonth, lastYear)}
        className={cn(
          "h-8 px-2.5 sm:px-3 text-xs font-black gap-1.5 rounded-xl cursor-pointer transition-all shadow-2xs",
          isLastMonth
            ? "bg-primary text-white"
            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
        )}
      >
        <RotateCcw size={13} className={cn(isLastMonth ? "text-white" : "text-amber-500")} />
        <span>{t("গত মাস", "Last Month")}</span>
      </Button>

      {/* 2. Current Month Button */}
      <Button
        size="sm"
        variant={isCurrent ? "default" : "outline"}
        onClick={() => navigateTo(currentMonth, currentYear)}
        className={cn(
          "h-8 px-2.5 sm:px-3 text-xs font-black gap-1.5 rounded-xl cursor-pointer transition-all shadow-2xs",
          isCurrent
            ? "bg-primary text-white"
            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
        )}
      >
        <Clock size={13} className={cn(isCurrent ? "text-white" : "text-primary")} />
        <span>{t("চলতি মাস", "Current Month")}</span>
      </Button>

      {/* 3. Calendar Month & Year Picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "h-8 px-2.5 sm:px-3 text-xs font-black inline-flex items-center justify-center gap-1.5 rounded-xl cursor-pointer transition-all shadow-2xs border",
            isOtherMonth
              ? "bg-primary text-white border-primary"
              : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
          )}
        >
          <CalendarIcon size={13} className={cn(isOtherMonth ? "text-white" : "text-indigo-600 dark:text-indigo-400")} />
          <span>{isOtherMonth ? currentMonthLabel : t("ক্যালেন্ডার", "Calendar")}</span>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          className="w-72 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl"
        >
          {/* Popover Header: Year Selector with < and > */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-gray-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-gray-500 dark:text-slate-400">
              {t("মাস নির্বাচন করুন", "Select Month & Year")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPickerYear((y) => y - 1)}
                className="h-6 w-6 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={13} />
              </Button>
              <span className="text-xs font-black px-1.5 text-gray-900 dark:text-slate-100">
                {pickerYear}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setPickerYear((y) => y + 1)}
                className="h-6 w-6 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <ChevronRight size={13} />
              </Button>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_NAMES.map((m, idx) => {
              const monthNum = idx + 1;
              const isSelected = selectedMonth === monthNum && selectedYear === pickerYear;
              const isThisCurrent = currentMonth === monthNum && currentYear === pickerYear;
              const isThisLast = lastMonth === monthNum && lastYear === pickerYear;

              return (
                <button
                  key={m.en}
                  type="button"
                  onClick={() => navigateTo(monthNum, pickerYear)}
                  className={cn(
                    "py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none text-center relative",
                    isSelected
                      ? "bg-primary text-white shadow-xs font-black"
                      : isThisCurrent
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : isThisLast
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                      : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span>{language === "bn" ? m.shortBn : m.shortEn}</span>
                  {isSelected && (
                    <Check size={11} className="absolute right-1.5 top-1 text-white" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

