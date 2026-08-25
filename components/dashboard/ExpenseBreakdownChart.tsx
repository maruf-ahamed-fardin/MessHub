"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { PieChart, Home, Zap, ShoppingBasket, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ExpenseBreakdownChartProps {
  rent: number;
  utilities: number;
  bazar: number;
  household?: number;
  totalMembers?: number;
}

// Convert polar to cartesian coordinates
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Describe a precise SVG Donut Arc Path
function describeDonutArc(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  // Avoid full 360 overlap edge case
  const sweep = Math.min(359.99, endAngle - startAngle);
  const adjustedEnd = startAngle + sweep;

  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, adjustedEnd);
  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, adjustedEnd);

  const largeArcFlag = sweep <= 180 ? "0" : "1";

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export function ExpenseBreakdownChart({
  rent = 24500,
  utilities = 7350,
  bazar = 2450,
  household = 0,
  totalMembers = 7,
}: ExpenseBreakdownChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = rent + utilities + bazar + household;
  const perHead = Math.round(total / (totalMembers || 1));

  const rawCategories = [
    {
      id: "rent",
      label: "বাসা ভাড়া (Rent)",
      shortLabel: "বাসা ভাড়া",
      amount: rent,
      color: "#4F46E5", // Indigo
      gradientId: "grad-rent",
      gradStart: "#6366F1",
      gradEnd: "#4338CA",
      tailwindDot: "bg-indigo-600",
      accentBg: "bg-indigo-50/80 text-indigo-700 border-indigo-200",
      icon: Home,
    },
    {
      id: "utilities",
      label: "ইউটিলিটি ও বিল (Bills)",
      shortLabel: "ইউটিলিটি ও বিল",
      amount: utilities,
      color: "#9333EA", // Purple
      gradientId: "grad-util",
      gradStart: "#A855F7",
      gradEnd: "#7E22CE",
      tailwindDot: "bg-purple-600",
      accentBg: "bg-purple-50/80 text-purple-700 border-purple-200",
      icon: Zap,
    },
    {
      id: "bazar",
      label: "খাবার বাজার (Bazar)",
      shortLabel: "খাবার বাজার",
      amount: bazar,
      color: "#F59E0B", // Amber
      gradientId: "grad-bazar",
      gradStart: "#FBBF24",
      gradEnd: "#D97706",
      tailwindDot: "bg-amber-500",
      accentBg: "bg-amber-50/80 text-amber-700 border-amber-200",
      icon: ShoppingBasket,
    },
  ];

  // Calculate arc slices with elegant 3.5-degree gaps
  const gapAngle = 3.5;
  let currentAngle = 0;

  const slices = rawCategories.map((cat, idx) => {
    const fraction = total > 0 ? cat.amount / total : 0;
    const sweepAngle = Math.max(0, fraction * 360 - gapAngle);
    const startAngle = currentAngle + gapAngle / 2;
    const endAngle = startAngle + sweepAngle;
    currentAngle += fraction * 360;

    const percent = Math.round(fraction * 100);
    const pathData = describeDonutArc(100, 100, 80, 56, startAngle, endAngle);

    return {
      ...cat,
      percent,
      pathData,
      idx,
    };
  });

  const activeCategory = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <PieChart size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">মাসিক ব্যয়ের বণ্টন (Expense Share)</h4>
            <p className="text-[11px] text-gray-400">সর্বমোট মেস ব্যয়: {formatCurrency(total)}</p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-indigo-950 bg-gray-100 border border-gray-200/60 px-3 py-1 rounded-lg">
          জনপ্রতি {formatCurrency(perHead)}
        </span>
      </div>

      {/* Main Visual Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
        {/* 1. Left: Mathematically Perfect Non-Overlapping Donut Dial with Ambient Center */}
        <div className="md:col-span-5 flex items-center justify-center">
          <div className="relative w-48 h-48 flex items-center justify-center group">
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-2 rounded-full bg-indigo-100/40 blur-2xl pointer-events-none" />

            {/* SVG Canvas */}
            <svg
              className="w-full h-full transform filter drop-shadow-sm transition-transform duration-300"
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
                r="68"
                stroke="#f3f4f6"
                strokeWidth="24"
                fill="transparent"
              />

              {/* Precise Donut Arcs */}
              {slices.map((slice) => {
                const isHovered = hoveredIdx === slice.idx;
                return (
                  <path
                    key={slice.id}
                    d={slice.pathData}
                    fill={`url(#${slice.gradientId})`}
                    className={cn(
                      "transition-all duration-200 cursor-pointer origin-center",
                      isHovered ? "opacity-100 filter drop-shadow-md scale-[1.03]" : "opacity-95 hover:opacity-100"
                    )}
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Center Core HUD */}
            <div className="absolute inset-9 rounded-full bg-white/95 backdrop-blur-sm border border-gray-100 shadow-inner flex flex-col items-center justify-center text-center pointer-events-none px-2 transition-all duration-200">
              {activeCategory ? (
                <div className="space-y-0.5 animate-in fade-in zoom-in-90 duration-150">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">
                    {activeCategory.shortLabel}
                  </span>
                  <span className="text-base font-black text-gray-900 tracking-tight block">
                    {formatCurrency(activeCategory.amount)}
                  </span>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                    {activeCategory.percent}%
                  </span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    মোট খরচ
                  </span>
                  <span className="text-base font-black text-gray-900 tracking-tight block">
                    {formatCurrency(total)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full inline-block">
                    {totalMembers} জনের ভাগ
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Right: High-End Category Breakdown Cards */}
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
                    ? "bg-gray-50/90 border-gray-300 shadow-xs scale-[1.01]"
                    : "bg-gray-50/40 border-gray-100 hover:bg-gray-50/80"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs", cat.accentBg)}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{cat.label}</p>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      {formatCurrency(cat.amount)}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({formatCurrency(perMemberAmount)}/জন)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-gray-900 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
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
