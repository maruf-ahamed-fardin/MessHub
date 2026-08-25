"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { TrendingDown, TrendingUp, UtensilsCrossed, BedDouble, Receipt, Sparkles } from "lucide-react";
import { Meal } from "@prisma/client";

interface PersonalSummaryProps {
  balance: number;
  foodCost: number;
  totalMeals: number;
  utilityShare?: number;
  todayMeal: Meal | null;
  room: string | null;
  seat: string | null;
  mealRate: number;
}

export function PersonalSummary({
  balance,
  foodCost,
  totalMeals,
  utilityShare = 4550,
  todayMeal,
  room,
  seat,
  mealRate,
}: PersonalSummaryProps) {
  const isCredit = balance >= 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" />
          <span>আমার ব্যক্তিগত আর্থিক স্থিতি</span>
        </h3>
        <span className="text-[10px] text-gray-400 font-medium">চলতি মাস</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Live Running Balance */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">আমার ব্যালেন্স</span>
            <span
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs",
                isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}
            >
              {isCredit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            </span>
          </div>
          <div>
            <p className={cn("text-xl font-extrabold tracking-tight", isCredit ? "text-emerald-700" : "text-rose-700")}>
              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(balance))}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isCredit ? "মেসে জমা উদ্বৃত্ত আছে ✓" : "টাকা বকেয়া আছে"}
            </p>
          </div>
        </div>

        {/* 2. Food Cost */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">মিল খরচ (Food)</span>
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <UtensilsCrossed size={13} />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(foodCost)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {totalMeals} টি মিল • {formatCurrency(mealRate)}/মিল
            </p>
          </div>
        </div>

        {/* 3. Rent & Utility Share */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">বাসা ও ইউটিলিটি</span>
            <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Receipt size={13} />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 tracking-tight">{formatCurrency(utilityShare)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ভাড়া, কারেন্ট, গ্যাস, নেট ও খালা</p>
          </div>
        </div>

        {/* 4. Room & Seat */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">আমার রুম ও সিট</span>
            <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <BedDouble size={13} />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 tracking-tight">{room ?? "Room 101"}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Seat {seat ?? "A"} • ভাড়া: ৳৩,৫০০</p>
          </div>
        </div>
      </div>

      {/* Today's Meal Status Strip */}
      {todayMeal !== undefined && (
        <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-900">আজকের আমার মিল:</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              ☀️ সকাল:{" "}
              <strong className={cn("text-xs font-bold", todayMeal?.breakfast ? "text-emerald-700" : "text-gray-400")}>
                {todayMeal?.breakfast ? "ON ✓" : "OFF ✕"}
              </strong>
            </span>
            <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              🍽️ দুপুর:{" "}
              <strong className={cn("text-xs font-bold", todayMeal?.lunch ? "text-emerald-700" : "text-gray-400")}>
                {todayMeal?.lunch ? "ON ✓" : "OFF ✕"}
              </strong>
            </span>
            <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              🌙 রাত:{" "}
              <strong className={cn("text-xs font-bold", todayMeal?.dinner ? "text-emerald-700" : "text-gray-400")}>
                {todayMeal?.dinner ? "ON ✓" : "OFF ✕"}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
