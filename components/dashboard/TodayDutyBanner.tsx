"use client";

import Link from "next/link";
import { ShoppingBasket, Brush, UtensilsCrossed, ArrowRight } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";

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
  const { t } = usePreferences();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Today's Bazar Buyer */}
      <Link
        href="/bazar"
        className="group bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <ShoppingBasket size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              {t("আজকের বাজার দায়িত্ব", "Today's Bazar Duty")}
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate mt-0.5">{todayBazarBuyer || "Admin"}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">{t("সাপ্তাহিক শিডিউল", "Weekly Schedule")}</p>
          </div>
        </div>
        <ArrowRight size={13} className="text-gray-300 dark:text-slate-600 group-hover:text-amber-600 transition-colors shrink-0" />
      </Link>

      {/* 2. Today's Cleaning Duty */}
      <Link
        href="/house"
        className="group bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0">
            <Brush size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
              {t("আজকের ক্লিনিং ডিউটি", "Today's Cleaning Duty")}
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate mt-0.5">{todayCleaningTask || "Cleaning Task"}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">
              {t(`দায়িত্বে: ${cleaningAssignee || "Member"}`, `Assigned: ${cleaningAssignee || "Member"}`)}
            </p>
          </div>
        </div>
        <ArrowRight size={13} className="text-gray-300 dark:text-slate-600 group-hover:text-teal-600 transition-colors shrink-0" />
      </Link>

      {/* 3. Today's Total Mess Meals */}
      <Link
        href="/meals"
        className="group bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <UtensilsCrossed size={17} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              {t("আজকের মেসের মোট মিল", "Today's Total Mess Meals")}
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate mt-0.5">
              {t(`${totalTodayMeals.total} টি মিল`, `${totalTodayMeals.total} Meals`)}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">
              ☀️ {totalTodayMeals.breakfast} • 🍽️ {totalTodayMeals.lunch} • 🌙 {totalTodayMeals.dinner}
            </p>
          </div>
        </div>
        <ArrowRight size={13} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-600 transition-colors shrink-0" />
      </Link>
    </div>
  );
}
