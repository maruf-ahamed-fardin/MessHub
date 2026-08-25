"use client";

import { useState } from "react";
import { UtensilsCrossed, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MealTrendChartProps {
  data: { day: string; date: string; meals: number; isToday?: boolean }[];
  todayTotal: number;
  averageMeals: number;
}

export function MealTrendChart({ data, todayTotal, averageMeals }: MealTrendChartProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const maxMeals = Math.max(...data.map((d) => d.meals), 25);

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <UtensilsCrossed size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">সাপ্তাহিক মিলের ট্রেন্ড (Meal Trend)</h4>
            <p className="text-[11px] text-gray-400">গত ৭ দিনের মেসের মোট মিলের পরিসংখ্যান</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-lg text-xs font-bold">
          <TrendingUp size={13} />
          <span>গড় {averageMeals} মিল/দিন</span>
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
                  <div className="absolute -top-9 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-20 animate-in fade-in zoom-in-95 duration-100">
                    {item.date}: {item.meals} টি মিল
                  </div>
                )}

                {/* Bar Column */}
                <div className="w-full h-28 bg-gray-50 rounded-xl relative flex items-end justify-center p-1 overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "w-full rounded-lg transition-all duration-300 relative group-hover:opacity-90",
                      item.isToday
                        ? "bg-indigo-600 shadow-sm"
                        : "bg-indigo-200/80 group-hover:bg-indigo-400"
                    )}
                  >
                    {item.isToday && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-indigo-600" />
                    )}
                  </div>
                </div>

                {/* Day Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-[10px] font-bold transition-colors",
                      item.isToday ? "text-indigo-600 font-extrabold" : "text-gray-500"
                    )}
                  >
                    {item.day}
                  </p>
                  <p className="text-[9px] text-gray-400 font-semibold">{item.meals}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
