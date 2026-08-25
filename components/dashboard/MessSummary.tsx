"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { Users, UtensilsCrossed, ShoppingBasket, Home, Wallet, TrendingUp, BarChart3 } from "lucide-react";

interface MessSummaryProps {
  totalMembers: number;
  totalRooms: number;
  totalSeats: number;
  todayTotalMeals: number;
  mealRate: number;
  monthBazarExpense: number;
  monthHouseExpense?: number;
  totalFundInHand?: number;
}

export function MessSummary({
  totalMembers,
  totalRooms = 3,
  totalSeats = 7,
  todayTotalMeals,
  mealRate,
  monthBazarExpense,
  monthHouseExpense = 0,
  totalFundInHand = 24050,
}: MessSummaryProps) {
  const stats = [
    { label: "মেম্বার ও সিট", value: `${totalMembers} জন (${totalRooms} রুম • ${totalSeats} সিট)`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "আজকের মোট মিল", value: `${todayTotalMeals} টি মিল`, icon: UtensilsCrossed, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "বর্তমান মিল রেট", value: `${formatCurrency(mealRate)} / মিল`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "এই মাসের বাজার", value: formatCurrency(monthBazarExpense), icon: ShoppingBasket, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "ইউটিলিটি ও বাসা বিল", value: formatCurrency(monthHouseExpense), icon: Home, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "মেস ফান্ড ব্যালেন্স", value: formatCurrency(totalFundInHand), icon: Wallet, color: "text-emerald-700", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 size={13} className="text-primary" />
          <span>পুরো মেসের সার্বিক আর্থিক ও অপারেশনাল স্থিতি</span>
        </h3>
        <span className="text-[10px] text-gray-400 font-medium">রিয়েল-টাইম আপডেট</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between gap-2 text-center"
          >
            <div className={`w-7 h-7 rounded-lg ${s.bg} ${s.color} mx-auto flex items-center justify-center font-bold`}>
              <s.icon size={15} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
