"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { PieChart, Home, Zap, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface ExpenseBreakdownChartProps {
  rent: number;
  utilities: number;
  bazar: number;
  household?: number;
  totalMembers?: number;
}

export function ExpenseBreakdownChart({
  rent = 24500,
  utilities = 7350,
  bazar = 2450,
  household = 0,
  totalMembers = 7,
}: ExpenseBreakdownChartProps) {
  const { t } = usePreferences();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = rent + utilities + bazar + household;
  const perHead = Math.round(total / (totalMembers || 1));

  const rawCategories = [
    {
      id: "rent",
      label: t("বাসা ভাড়া", "Flat Rent"),
      shortLabel: t("বাসা ভাড়া", "Rent"),
      amount: rent,
      color: "#4F46E5",
      gradientId: "grad-rent",
      gradStart: "#6366F1",
      gradEnd: "#4338CA",
      tailwindDot: "bg-indigo-600",
      accentBg: "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      icon: Home,
    },
    {
      id: "utilities",
      label: t("ইউটিলিটি ও বিল", "Utility & Bills"),
      shortLabel: t("ইউটিলিটি", "Utilities"),
      amount: utilities,
      color: "#9333EA",
      gradientId: "grad-util",
      gradStart: "#A855F7",
      gradEnd: "#7E22CE",
      tailwindDot: "bg-purple-600",
      accentBg: "bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      icon: Zap,
    },
    {
      id: "bazar",
      label: t("খাবার বাজার", "Food Bazar"),
      shortLabel: t("বাজার", "Bazar"),
      amount: bazar,
      color: "#F59E0B",
      gradientId: "grad-bazar",
      gradStart: "#FBBF24",
      gradEnd: "#D97706",
      tailwindDot: "bg-amber-500",
      accentBg: "bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      icon: ShoppingBasket,
    },
  ];

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const activeCategories = rawCategories.filter((c) => c.amount > 0);
  const gap = activeCategories.length > 1 ? 5 : 0;

  let currentOffset = 0;
  const slices = activeCategories.map((cat, idx) => {
    const fraction = total > 0 ? cat.amount / total : 0;
    const arcLength = fraction * circumference;
    const dashLength = Math.max(0, arcLength - gap);
    const strokeDasharray = `${dashLength} ${circumference}`;
    const strokeDashoffset = -currentOffset;
    currentOffset += arcLength;

    const percent = Math.round(fraction * 100);

    return {
      ...cat,
      idx,
      percent,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeCategory = hoveredIdx !== null ? slices.find((s) => s.idx === hoveredIdx) ?? null : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <PieChart size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
              {t("মাসিক ব্যয়ের বণ্টন", "Monthly Expense Share")}
            </h4>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              {t(`সর্বমোট মেস ব্যয়: ${formatCurrency(total)}`, `Total Mess Expense: ${formatCurrency(total)}`)}
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 bg-gray-100 dark:bg-slate-800 border border-gray-200/60 dark:border-slate-700 px-3 py-1 rounded-lg">
          {t(`জনপ্রতি ${formatCurrency(perHead)}`, `${formatCurrency(perHead)} / person`)}
        </span>
      </div>

      {/* Main Visual Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
        {/* 1. Left: Donut Dial */}
        <div className="md:col-span-5 flex items-center justify-center">
          <div className="relative w-48 h-48 flex items-center justify-center group">
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-2 rounded-full bg-indigo-100/40 dark:bg-indigo-950/40 blur-2xl pointer-events-none" />

            {/* SVG Canvas */}
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 200 200"
            >
              <defs>
                {slices.map((s) => (
                  <linearGradient key={s.gradientId} id={s.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={s.gradStart} />
                    <stop offset="100%" stopColor={s.gradEnd} />
                  </linearGradient>
                ))}
              </defs>

              {/* Background Track Circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="#f3f4f6"
                strokeWidth="18"
                className="dark:stroke-slate-800"
                fill="none"
              />

              {/* Precise Donut Arcs (Immune to scroll and distortion) */}
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                return (
                  <circle
                    key={slice.id}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={`url(#${slice.gradientId})`}
                    strokeWidth={isHovered ? 24 : 18}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      transformOrigin: "100px 100px",
                      transform: "rotate(-90deg)",
                      filter: isHovered ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.45))" : undefined,
                      opacity: hoveredIdx !== null && !isHovered ? 0.55 : 1,
                    }}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Center Core HUD */}
            <div className="absolute inset-9 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-100 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center text-center pointer-events-none px-2 transition-all duration-200">
              {activeCategory ? (
                <div className="space-y-0.5 animate-in fade-in zoom-in-90 duration-150">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block truncate">
                    {activeCategory.shortLabel}
                  </span>
                  <span className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight block">
                    {formatCurrency(activeCategory.amount)}
                  </span>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full inline-block">
                    {activeCategory.percent}%
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                    {t("মোট খরচ", "TOTAL")}
                  </span>
                  <span className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight block">
                    {formatCurrency(total)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.2 rounded-full inline-block">
                    {t(`${totalMembers} জনের ভাগ`, `${totalMembers} members`)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Right: Category Breakdown Cards */}
        <div className="md:col-span-7 space-y-2.5">
          {slices.map((cat) => {
            const isHovered = hoveredIdx === cat.idx;
            const Icon = cat.icon;
            const perMemberAmount = Math.round(cat.amount / (totalMembers || 1));

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredIdx(cat.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                  isHovered
                    ? "bg-gray-50/90 dark:bg-slate-800/80 border-gray-300 dark:border-slate-700 shadow-xs scale-[1.01]"
                    : "bg-gray-50/40 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 hover:bg-gray-50/80 dark:hover:bg-slate-800/70"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs", cat.accentBg)}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{cat.label}</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold mt-0.5">
                      {formatCurrency(cat.amount)}{" "}
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">
                        ({t(`${formatCurrency(perMemberAmount)}/জন`, `${formatCurrency(perMemberAmount)}/person`)})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-1 rounded-lg shadow-2xs">
                    {cat.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
