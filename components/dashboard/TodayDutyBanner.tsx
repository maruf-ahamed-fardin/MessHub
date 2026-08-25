"use client";

import Link from "next/link";
import { ShoppingBasket, Brush, UtensilsCrossed, ArrowRight } from "lucide-react";

interface TodayDutyBannerProps {
  todayBazarBuyer: string;
  todayCleaningTask: string;
  cleaningAssignee: string;
  totalTodayMeals: { breakfast: number; lunch: number; dinner: number; total: number };
}

export function TodayDutyBanner({
  todayBazarBuyer,
  todayCleaningTask,
  cleaningAssignee,
  totalTodayMeals,
}: TodayDutyBannerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Today's Bazar Buyer */}
      <Link
        href="/bazar"
        className="group bg-white border border-gray-200/90 hover:border-amber-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <ShoppingBasket size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">আজকের বাজার দায়িত্ব</p>
            <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{todayBazarBuyer || "Admin (You)"}</p>
            <p className="text-[10px] text-gray-400">সাপ্তাহিক শিডিউল</p>
          </div>
        </div>
        <ArrowRight size={13} className="text-gray-300 group-hover:text-amber-600 transition-colors shrink-0" />
      </Link>

      {/* 2. Today's Cleaning Duty */}
      <Link
        href="/house"
        className="group bg-white border border-gray-200/90 hover:border-teal-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <Brush size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">আজকের ক্লিনিং ডিউটি</p>
            <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{todayCleaningTask || "Bathroom Deep Clean"}</p>
            <p className="text-[10px] text-gray-400">দায়িত্বে: {cleaningAssignee || "Tanvir Ahmed"}</p>
          </div>
        </div>
        <ArrowRight size={13} className="text-gray-300 group-hover:text-teal-600 transition-colors shrink-0" />
      </Link>

      {/* 3. Today's Total Mess Meals */}
      <Link
        href="/meals"
        className="group bg-white border border-gray-200/90 hover:border-blue-300 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <UtensilsCrossed size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">আজকের মেসের মোট মিল</p>
            <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
              {totalTodayMeals.total} টি মিল
            </p>
            <p className="text-[10px] text-gray-400">
              ☀️ {totalTodayMeals.breakfast} • 🍽️ {totalTodayMeals.lunch} • 🌙 {totalTodayMeals.dinner}
            </p>
          </div>
        </div>
        <ArrowRight size={13} className="text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
      </Link>
    </div>
  );
}
