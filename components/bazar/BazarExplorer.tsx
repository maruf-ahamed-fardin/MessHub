"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import {
  ShoppingBasket, Calendar as CalendarIcon, ChevronDown,
  ChevronLeft, ChevronRight, Trash2, Receipt, Plus,
} from "lucide-react";
import { deleteBazarAction } from "@/app/actions/finance.actions";
import { useRouter } from "next/navigation";
import { EditBazarDialog } from "@/components/bazar/EditBazarDialog";
import { AddBazarDialog } from "@/components/bazar/AddBazarDialog";
import { usePreferences } from "@/lib/context/PreferencesContext";

function isBazarEditable(
  bazar: any,
  currentMemberId: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (bazar.buyerId !== currentMemberId) return false;

  const now = new Date();
  const bazarDate = new Date(bazar.date);

  // 1. 3-day (72h) window
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const isWithin3Days = now.getTime() - bazarDate.getTime() <= threeDaysMs;

  // 2. Month-end boundary: cannot edit if month has passed
  const bazarMonth = bazarDate.getMonth() + 1;
  const bazarYear = bazarDate.getFullYear();
  const currMonth = now.getMonth() + 1;
  const currYear = now.getFullYear();
  const isSameMonth = bazarMonth === currMonth && bazarYear === currYear;

  return isWithin3Days && isSameMonth;
}

interface BazarExplorerProps {
  items: any[];
  products: any[];
  members: any[];
  month: number;
  year: number;
  isAdmin: boolean;
  currentMemberId: string;
}

export function BazarExplorer({
  items,
  products,
  members,
  month,
  year,
  isAdmin,
  currentMemberId,
}: BazarExplorerProps) {
  const router = useRouter();
  const { t, language } = usePreferences();
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
  const initialDay = isCurrentMonth ? today.getDate() : 1;
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isCurrent = today.getMonth() + 1 === month && today.getFullYear() === year;
    setSelectedDay(isCurrent ? today.getDate() : 1);
  }, [month, year]);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  // Group bazars by day of the month
  const bazarsByDay: Record<number, any[]> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    bazarsByDay[d] = [];
  }

  for (const item of items) {
    const itemDate = new Date(item.date);
    const day = itemDate.getDate();
    if (bazarsByDay[day]) {
      bazarsByDay[day].push(item);
    }
  }

  const dateLocale = language === "bn" ? "bn-BD" : "en-US";
  const selectedDateObj = new Date(year, month - 1, selectedDay);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString(dateLocale, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const dailyItems = bazarsByDay[selectedDay] ?? [];
  const displayItems = viewAll ? items : dailyItems;

  const handleDelete = async (id: string) => {
    if (!confirm(t("আপনি কি নিশ্চিত এই বাজার এন্ট্রিটি মুছতে চান?", "Are you sure you want to delete this bazar entry?"))) return;
    try {
      await deleteBazarAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrevDay = () => {
    setViewAll(false);
    setSelectedDay((prev) => (prev > 1 ? prev - 1 : daysInMonth));
  };

  const handleNextDay = () => {
    setViewAll(false);
    setSelectedDay((prev) => (prev < daysInMonth ? prev + 1 : 1));
  };

  const handleSelectDate = (day: number) => {
    setSelectedDay(day);
    setViewAll(false);
    setCalendarOpen(false);
  };

  const dayHeaders = language === "bn"
    ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"]
    : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-4">
      {/* 1. Date Selector Bar with Popover Calendar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center justify-between flex-wrap gap-3">
        {/* Date Button (Click to open Mini Calendar) */}
        <div className="relative" ref={popoverRef}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={cn(
                "h-9 px-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer",
                calendarOpen
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-300/40"
                  : "bg-gray-50/80 dark:bg-slate-800/80 hover:bg-gray-100 dark:hover:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100"
              )}
            >
              <CalendarIcon size={15} className="text-amber-600" />
              <span>{viewAll ? t("পুরো মাসের হিসাব", "All Month Records") : formattedSelectedDate}</span>
              <ChevronDown size={14} className={cn("text-gray-400 transition-transform", calendarOpen && "rotate-180")} />
            </button>

            {/* Quick Prev / Next / Today arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevDay}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
                title={t("আগের দিন", "Previous Day")}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(today.getDate());
                  setViewAll(false);
                }}
                className={cn(
                  "h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                  !viewAll && selectedDay === today.getDate()
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                )}
              >
                {t("আজ", "Today")}
              </button>
              <button
                type="button"
                onClick={handleNextDay}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-gray-200 dark:border-slate-700"
                title={t("পরের দিন", "Next Day")}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* FLOATING MINI CALENDAR POPUP */}
          {calendarOpen && (
            <div className="absolute top-11 left-0 z-50 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                  {new Date(year, month - 1).toLocaleString(dateLocale, { month: "long", year: "numeric" })}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                  {t("তারিখ বেছে নিন", "Select Date")}
                </span>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 dark:text-slate-500">
                {dayHeaders.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`b-${i}`} className="h-7 w-7" />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dayBazars = bazarsByDay[day] ?? [];
                  const hasBazar = dayBazars.length > 0;
                  const isSelected = selectedDay === day && !viewAll;
                  const isToday =
                    today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDate(day)}
                      className={cn(
                        "h-7 w-7 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer text-xs font-medium",
                        isSelected
                          ? "bg-amber-500 text-white font-bold shadow-xs"
                          : hasBazar
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700 hover:bg-amber-200"
                          : isToday
                          ? "bg-gray-100 dark:bg-slate-800 text-primary font-bold hover:bg-gray-200 dark:hover:bg-slate-700"
                          : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <span className="leading-none text-[11px]">{day}</span>
                      {hasBazar && (
                        <span
                          className={cn(
                            "w-1 h-1 rounded-full mt-0.5",
                            isSelected ? "bg-white" : "bg-amber-600"
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> {t("বাজার হয়েছে", "Bazar done")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setViewAll(true);
                    setCalendarOpen(false);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  {t("সব দেখুন", "View All")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View All / By Date Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewAll(false)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer",
              !viewAll ? "bg-amber-500 text-white shadow-xs" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
            )}
          >
            {t(`তারিখের বাজার (${dailyItems.length})`, `Daily Bazar (${dailyItems.length})`)}
          </button>
          <button
            type="button"
            onClick={() => setViewAll(true)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer",
              viewAll ? "bg-amber-500 text-white shadow-xs" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
            )}
          >
            {t(`পুরো মাস (${items.length})`, `Full Month (${items.length})`)}
          </button>
        </div>
      </div>

      {/* 2. Daily Bazar Receipts & Item Breakdown */}
      <div className="space-y-3">
        {displayItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
              <ShoppingBasket size={22} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-slate-100">
                {t(`${formattedSelectedDate} তারিখে কোনো বাজার করা হয়নি`, `No bazar record found for ${formattedSelectedDate}`)}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {t("উপরে তারিখের উপর ক্লিক করে অন্য কোনো দিন বেছে নিন অথবা নতুন বাজার যোগ করুন।", "Click date above to select another day or add a new bazar entry.")}
              </p>
            </div>
            <div className="pt-1">
              <AddBazarDialog
                products={products}
                members={members}
                currentMemberId={currentMemberId}
                defaultMonth={month}
                defaultYear={year}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        ) : (
          displayItems.map((bazar) => {
            const buyerName = bazar.buyerMember?.user?.name ?? "Unknown";
            const total = Number(bazar.totalAmount) || 0;

            return (
              <div
                key={bazar.id}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-gray-300 dark:hover:border-slate-700 transition-all space-y-0"
              >
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      <Receipt size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                        {t(`বাজার করেছে: ${buyerName}`, `Buyer: ${buyerName}`)}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">
                        {formatShortDate(bazar.date)} {bazar.note ? `• ${bazar.note}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                      {formatCurrency(total)}
                    </span>
                    {isBazarEditable(bazar, currentMemberId, isAdmin) && (
                      <div className="flex items-center gap-0.5">
                        <EditBazarDialog
                          bazar={bazar}
                          products={products}
                          members={members}
                          isAdmin={isAdmin}
                        />
                        <button
                          type="button"
                          onClick={() => handleDelete(bazar.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={t("বাজার মুছুন", "Delete bazar")}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="px-4 py-2.5 divide-y divide-gray-100 dark:divide-slate-800">
                  {bazar.items && bazar.items.length > 0 ? (
                    bazar.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="py-1.5 flex items-center justify-between text-xs first:pt-0 last:pb-0"
                      >
                        <span className="font-semibold text-gray-800 dark:text-slate-200">{item.productName}</span>
                        <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400 font-medium">
                          <span className="text-[11px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {Number(item.quantity)} {item.unit}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">
                            @ {formatCurrency(Number(item.unitPrice))}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-slate-100 w-16 text-right">
                            {formatCurrency(Number(item.totalPrice))}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500 py-1">
                      {t("আইটেম বিবরণ পাওয়া যায়নি।", "No item breakdown found.")}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Add Bazar Action Directly Below the List */}
        {displayItems.length > 0 && (
          <div className="pt-1">
            <AddBazarDialog
              products={products}
              members={members}
              currentMemberId={currentMemberId}
              defaultMonth={month}
              defaultYear={year}
              isAdmin={isAdmin}
              trigger={
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 bg-gray-50/40 dark:bg-slate-900/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 text-gray-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={14} />
                  </div>
                  <span>{t("আরও বাজার যোগ করুন", "Add Another Bazar")}</span>
                </button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
