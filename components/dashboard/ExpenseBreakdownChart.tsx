"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { PieChart, Home, Zap, ShoppingBasket, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ExpenseBreakdownChartProps {
  rent: number;
  utilities: number;
  bazar: number;
  household: number;
  totalMembers: number;
}

export function ExpenseBreakdownChart({
  rent = 24500,
  utilities = 7350,
  bazar = 2450,
  household = 0,
  totalMembers = 7,
}: ExpenseBreakdownChartProps) {
  const total = rent + utilities + bazar + household;
  const perHead = Math.round(total / (totalMembers || 1));

  const categories = [
    {
      label: "বাসা ভাড়া (Flat Rent)",
      amount: rent,
      color: "bg-indigo-600",
      textColor: "text-indigo-700",
      bgLight: "bg-indigo-50",
      icon: Home,
    },
    {
      label: "ইউটিলিটি ও অন্যান্য বিল",
      amount: utilities,
      color: "bg-purple-600",
      textColor: "text-purple-700",
      bgLight: "bg-purple-50",
      icon: Zap,
    },
    {
      label: "খাবার বাজার (Monthly Bazar)",
      amount: bazar,
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgLight: "bg-amber-50",
      icon: ShoppingBasket,
    },
  ];

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <PieChart size={16} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">মাসিক ব্যয়ের বণ্টন (Expense Share)</h4>
            <p className="text-[11px] text-gray-400">সর্বমোট ব্যয়: {formatCurrency(total)}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-indigo-950 bg-gray-100 px-2.5 py-1 rounded-lg">
            জনপ্রতি {formatCurrency(perHead)}
          </span>
        </div>
      </div>

      {/* Multi-segmented Visual Progress Bar */}
      <div className="space-y-2 pt-1">
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex p-0.5 gap-0.5">
          {categories.map((c) => {
            const pct = total > 0 ? (c.amount / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={c.label}
                style={{ width: `${pct}%` }}
                className={cn("h-full rounded-sm transition-all duration-500", c.color)}
                title={`${c.label}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Category Breakdown Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {categories.map((c) => {
          const pct = total > 0 ? ((c.amount / total) * 100).toFixed(0) : "0";
          const Icon = c.icon;

          return (
            <div
              key={c.label}
              className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", c.bgLight, c.textColor)}>
                  <Icon size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{c.label.split(" (")[0]}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{formatCurrency(c.amount)}</p>
                </div>
              </div>
              <span className={cn("text-xs font-extrabold shrink-0", c.textColor)}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
