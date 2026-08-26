"use client";

import { useState } from "react";
import { UtensilsCrossed, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface MealTrendChartProps {
  data: { day: string; date: string; meals: number; isToday?: boolean }[];
  todayTotal: number;
  averageMeals: number;
}

export function MealTrendChart({ data, todayTotal, averageMeals }: MealTrendChartProps) {
  const { t } = usePreferences();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const maxMeals = Math.max(...data.map((d) => d.meals), 25);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
              {t("সাপ্তাহিক মিলের ট্রেন্ড", "Weekly Meal Trend")}
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              {t("গত ৭ দিনের মেসের মোট মিলের পরিসংখ্যান", "Total meal stats of past 7 days")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 px-2.5 py-1 rounded-lg text-xs font-bold">
          <TrendingUp size={13} />
          <span>{t(`গড় ${averageMeals} মিল/দিন`, `Avg ${averageMeals} meals/day`)}</span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-3">
        <div className="h-36 flex items-end justify-between gap-2 sm:gap-3 px-1">
          {data.map((item, index) => {
            const heightPercent = Math.min(100, Math.max(15, (item.meals / maxMeals) * 100));
            const isHovered = hoveredDay === index;

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-9 bg-gray-900 dark:bg-slate-100 text-white dark:text-gray-900 text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-20 animate-in fade-in zoom-in-95 duration-100">
                    {item.date}: {t(`${item.meals} টি মিল`, `${item.meals} meals`)}
                  </div>
                )}

                {/* Bar Column */}
                <div className="w-full h-28 bg-slate-100/90 dark:bg-slate-800/60 rounded-xl relative flex items-end justify-center p-1 overflow-hidden border border-slate-200/50 dark:border-slate-800/60">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-lg transition-all duration-300 relative group-hover:opacity-95",
                      item.isToday
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-500 dark:from-indigo-500 dark:to-indigo-400 shadow-xs"
                        : "bg-indigo-200/90 hover:bg-indigo-300/90 dark:bg-indigo-900/60 dark:hover:bg-indigo-800/80"
                    )}
                  >
                    {item.isToday && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-indigo-600 dark:ring-indigo-400 shadow-2xs" />
                    )}
                  </div>
                </div>

                {/* Day Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-[10px] font-bold transition-colors",
                      item.isToday ? "text-indigo-600 dark:text-indigo-400 font-black" : "text-gray-600 dark:text-slate-400"
                    )}
                  >
                    {item.day}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">{item.meals}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
