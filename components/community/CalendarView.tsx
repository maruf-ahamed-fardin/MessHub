"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Calendar as CalendarIcon, ShoppingBasket, UtensilsCrossed, Brush,
  CreditCard, Bell, Sparkles, CheckCircle2,
} from "lucide-react";

interface CalendarViewProps {
  month: number;
  year: number;
  isAdmin: boolean;
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
  isAdmin,
  bazars,
  meals,
  cleanings,
  payments,
  notices,
  events,
}: CalendarViewProps) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const monthName = new Date(year, month - 1).toLocaleString("en", { month: "long", year: "numeric" });

  const selectedDateObj = new Date(year, month - 1, selectedDay);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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

  // 6. Events
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: Ultra Compact Mini Calendar Widget */}
      <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3 max-w-sm">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarIcon size={15} className="text-primary" />
            <h3 className="font-bold text-sm text-gray-900">{monthName}</h3>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {daysInMonth} দিন
          </span>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 py-1 border-b border-gray-100">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid (Mini Cells) */}
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

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex flex-col items-center justify-center relative transition-all cursor-pointer select-none mx-auto",
                  isSelected
                    ? "bg-primary text-white font-bold shadow-xs ring-2 ring-primary/40 scale-105"
                    : isToday
                    ? "bg-primary/10 text-primary font-bold hover:bg-primary/15"
                    : "text-gray-700 hover:bg-gray-100 font-medium"
                )}
              >
                <span className="text-[11px] leading-none">{day}</span>

                {/* Activity Indicator Dots */}
                {(hasBazar || hasCleaning || hasPayment) && (
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
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Mini Legend */}
        <div className="flex items-center justify-center gap-3 pt-2.5 border-t border-gray-100 text-[10px] text-gray-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> বাজার
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> ডিউটি
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> পেমেন্ট
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Detailed Day Timeline & Schedule */}
      <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Selected Date Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              তারিখের বিস্তারিত বিবরণ
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">{formattedSelectedDate}</h2>
          </div>
          <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            দিন {selectedDay} / {daysInMonth}
          </span>
        </div>

        {!hasAnyActivity ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <CalendarIcon size={28} className="mx-auto text-gray-300 stroke-1" />
            <p className="text-sm font-medium">এই তারিখে কোনো বাজার, ডিউটি বা পেমেন্ট রেকর্ড নেই।</p>
            <p className="text-xs text-gray-400">ক্যালেন্ডারের অন্য কোনো তারিখে ক্লিক করে দেখুন।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 1. Bazar Details */}
            {currentDayInfo.bazars.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <ShoppingBasket size={15} className="text-amber-600" />
                    <span>আজকের বাজার তালিকা (Bazar)</span>
                  </div>
                  <span className="text-xs font-bold text-amber-900">
                    {formatCurrency(currentDayInfo.bazars.reduce((s, b) => s + Number(b.totalAmount), 0))}
                  </span>
                </div>

                {currentDayInfo.bazars.map((b) => (
                  <div key={b.id} className="bg-white rounded-lg p-2.5 border border-amber-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900">
                        বাজার করেছে: {b.buyerMember?.user?.name ?? "Member"}
                      </p>
                      <span className="text-xs font-bold text-emerald-700">{formatCurrency(Number(b.totalAmount))}</span>
                    </div>
                    {b.items && b.items.length > 0 && (
                      <div className="text-[11px] text-gray-500">
                        আইটেম: {b.items.map((it: any) => `${it.productName} (${it.quantity}${it.unit})`).join(", ")}
                      </div>
                    )}
                    {b.note && <p className="text-[11px] text-gray-400">নোট: {b.note}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* 2. Meals Breakdown */}
            {currentDayInfo.mealsCount.total > 0 && (
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <UtensilsCrossed size={15} className="text-blue-600" />
                    <span>আজকের মোট মিল সংখ্যা (Meals)</span>
                  </div>
                  <span className="text-xs font-bold text-blue-900">{currentDayInfo.mealsCount.total} টি মিল</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-0.5">
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-gray-500 font-medium">☀️ সকাল</p>
                    <p className="text-xs font-bold text-amber-700">{currentDayInfo.mealsCount.breakfast} জন</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-gray-500 font-medium">🍽️ দুপুর</p>
                    <p className="text-xs font-bold text-blue-700">{currentDayInfo.mealsCount.lunch} জন</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <p className="text-[10px] text-gray-500 font-medium">🌙 রাত</p>
                    <p className="text-xs font-bold text-indigo-700">{currentDayInfo.mealsCount.dinner} জন</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Cleaning Duties */}
            {currentDayInfo.cleanings.length > 0 && (
              <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                  <Brush size={15} className="text-teal-600" />
                  <span>ক্লিনিং দায়িত্ব ও শিডিউল (Cleaning)</span>
                </div>

                {currentDayInfo.cleanings.map((c) => (
                  <div key={c.id} className="bg-white rounded-lg p-2.5 border border-teal-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.title}</p>
                      <p className="text-[11px] text-gray-500">
                        স্থান: {c.location} • দায়িত্বে: {c.assignedMember?.user?.name ?? "Member"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        c.status === "DONE" ? "bg-emerald-100 text-emerald-800" : "bg-teal-100 text-teal-800"
                      )}
                    >
                      {c.status === "DONE" ? "সম্পন্ন ✓" : "পেন্ডিং"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Payments */}
            {currentDayInfo.payments.length > 0 && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CreditCard size={15} className="text-emerald-600" />
                  <span>জমা / পেমেন্ট রেকর্ড (Payments)</span>
                </div>

                {currentDayInfo.payments.map((p) => (
                  <div key={p.id} className="bg-white rounded-lg p-2.5 border border-emerald-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{p.member?.user?.name ?? "Member"}</p>
                      <p className="text-[11px] text-gray-500">পেমেন্ট মেথড: {p.method} {p.note ? `• ${p.note}` : ""}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">+{formatCurrency(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 5. Notices / Meetings */}
            {currentDayInfo.notices.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-black text-xs">
                  <div className="w-6 h-6 rounded-lg bg-purple-200/80 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <Bell size={13} />
                  </div>
                  <span>নোটিশ ও মিটিং (Announcements)</span>
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
