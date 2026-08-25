"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, UtensilsCrossed, ShoppingBasket,
  Brush, Users, CreditCard, ArrowRight, BedDouble, Receipt,
  Plus, Check, Sparkles, AlertCircle, Clock, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MealTrendChart } from "./MealTrendChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { toggleMealAction } from "@/app/actions/meal.actions";
import { useRouter } from "next/navigation";

interface ModernDashboardProps {
  userName: string;
  userRole: string;
  memberProfile: any;
  balance: number;
  foodCost: number;
  totalMeals: number;
  mealRate: number;
  utilityShare: number;
  todayMeal: any;
  totalMembers: number;
  totalRooms: number;
  totalSeats: number;
  todayTotalMeals: { breakfast: number; lunch: number; dinner: number; total: number };
  monthBazarExpense: number;
  monthUtilityBills: number;
  totalFundInHand: number;
  todayBazarBuyer: string;
  todayCleaningTask: string;
  cleaningAssignee: string;
  memberStatusList: any[];
  recentActivities: any[];
  upcomingTasks: any[];
  weeklyMealTrend: any[];
  urgentNotice?: any;
}

export function ModernDashboard({
  userName,
  userRole,
  memberProfile,
  balance,
  foodCost,
  totalMeals,
  mealRate,
  utilityShare,
  todayMeal: initialTodayMeal,
  totalMembers,
  totalRooms,
  totalSeats,
  todayTotalMeals,
  monthBazarExpense,
  monthUtilityBills,
  totalFundInHand,
  todayBazarBuyer,
  todayCleaningTask,
  cleaningAssignee,
  memberStatusList,
  recentActivities,
  upcomingTasks,
  weeklyMealTrend,
  urgentNotice,
}: ModernDashboardProps) {
  const router = useRouter();
  const [todayMeal, setTodayMeal] = useState(initialTodayMeal);
  const [updatingMeal, setUpdatingMeal] = useState<string | null>(null);

  const isCredit = balance >= 0;
  const firstName = userName.split(" ")[0];

  const handleToggleMeal = async (type: "breakfast" | "lunch" | "dinner") => {
    if (!memberProfile?.id) return;
    const currentVal = todayMeal?.[type] ?? true;
    const nextVal = !currentVal;

    setUpdatingMeal(type);
    setTodayMeal((prev: any) => ({ ...prev, [type]: nextVal }));

    try {
      await toggleMealAction(memberProfile.id, new Date(), type, nextVal);
      router.refresh();
    } catch (err) {
      console.error(err);
      setTodayMeal((prev: any) => ({ ...prev, [type]: currentVal }));
    } finally {
      setUpdatingMeal(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 rounded-2xl border-2 border-primary/20 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-sm">
              {firstName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                স্বাগতম, {firstName}!
              </h1>
              <Badge variant="outline" className="text-[10px] font-bold py-0 px-2 rounded-md bg-indigo-50 text-indigo-700 border-indigo-200">
                {memberProfile?.seat ? `${memberProfile.seat.room?.name ?? "Room"} (${memberProfile.seat.label})` : "Room 101 (A)"}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {new Date().toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/meals"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer select-none"
          >
            <UtensilsCrossed size={13} className="text-primary" />
            <span>মিল বুকিং</span>
          </Link>
          <Link
            href="/bazar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50/70 border border-amber-200/80 text-amber-900 hover:bg-amber-100 transition-all cursor-pointer select-none"
          >
            <ShoppingBasket size={13} className="text-amber-600" />
            <span>+ বাজার এন্ট্রি</span>
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-2xs transition-all cursor-pointer select-none"
          >
            <CreditCard size={13} />
            <span>টাকা লেনদেন</span>
          </Link>
        </div>
      </div>

      {/* 2. Notice Announcement Banner (Orange in Light Mode, Red Alert in Night Mode) */}
      {urgentNotice && (
        <div className="bg-amber-50/95 dark:bg-rose-950/40 border border-amber-300/90 dark:border-rose-800/80 rounded-2xl p-4 shadow-xs flex items-start justify-between gap-3 relative overflow-hidden animate-in fade-in-0 duration-200">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 dark:bg-rose-600" />
          <div className="flex items-start gap-3 min-w-0 pl-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 dark:bg-gradient-to-tr dark:from-rose-600 dark:to-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs mt-0.5">
              <Megaphone size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 dark:bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                  📢 মেস নোটিশ
                </span>
                <h4 className="font-black text-xs sm:text-sm text-amber-950 dark:text-rose-100 truncate">{urgentNotice.title}</h4>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-rose-200/90 mt-1 leading-relaxed">{urgentNotice.content}</p>
            </div>
          </div>

          <Link
            href="/notices"
            className="shrink-0 text-xs font-black text-amber-800 hover:text-amber-950 dark:text-white bg-white dark:bg-rose-900/80 border border-amber-200 dark:border-rose-700 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-amber-100 dark:hover:bg-rose-800 transition-all flex items-center gap-1"
          >
            <span>বিস্তারিত</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* 3. Top 3 Primary Cards (Clean, Focused, Minimal) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: My Financial Balance & Fund */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">আমার বর্তমান ব্যালেন্স</span>
            <span
              className={cn(
                "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1",
                isCredit ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80" : "bg-rose-50 text-rose-700 border border-rose-200/80"
              )}
            >
              {isCredit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isCredit ? "জমা আছে ✓" : "বকেয়া আছে"}
            </span>
          </div>

          <div>
            <p className={cn("text-2xl sm:text-3xl font-black tracking-tight", isCredit ? "text-emerald-700" : "text-rose-700")}>
              {isCredit ? "+" : "-"}{formatCurrency(Math.abs(balance))}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              মোট জমা: <strong>{formatCurrency(10000)}</strong> • মিল ও বিল খরচ: {formatCurrency(foodCost + utilityShare)}
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>মেস ফান্ড ব্যালেন্স:</span>
            <strong className="text-gray-900 font-extrabold">{formatCurrency(totalFundInHand)}</strong>
          </div>
        </div>

        {/* Card 2: Live Meal Rate & Today's Meals Toggle */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">লাইভ মিল রেট ও মিলস</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
              {totalMeals} টি মিল সম্পন্ন
            </span>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(mealRate)} <span className="text-xs font-bold text-gray-400">/মিল</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              খাবার খরচ: <strong>{formatCurrency(foodCost)}</strong>
            </p>
          </div>

          {/* Interactive Today's Meal Quick Switches */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            {[
              { key: "breakfast" as const, label: "সকাল", emoji: "☀️" },
              { key: "lunch" as const, label: "দুপুর", emoji: "🍽️" },
              { key: "dinner" as const, label: "রাত", emoji: "🌙" },
            ].map(({ key, label, emoji }) => {
              const isOn = todayMeal?.[key] ?? true;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleToggleMeal(key)}
                  disabled={updatingMeal === key}
                  className={cn(
                    "flex-1 py-1 px-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer select-none",
                    isOn
                      ? "bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-2xs hover:bg-emerald-100"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
                  )}
                  title={`Click to switch ${label} meal`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                  <span className="text-[10px]">{isOn ? "✓" : "✕"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 3: Today's Key Schedule & Duties */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">আজকের শিডিউল ও দায়িত্ব</span>
            <Clock size={13} className="text-gray-400" />
          </div>

          <div className="space-y-2.5">
            {/* Bazar Duty */}
            <Link
              href="/bazar"
              className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                  <ShoppingBasket size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase leading-none">বাজার দায়িত্ব</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate mt-0.5">{todayBazarBuyer || "Admin (You)"}</p>
                </div>
              </div>
              <ArrowRight size={12} className="text-amber-700 dark:text-amber-400 shrink-0" />
            </Link>

            {/* Cleaning Duty */}
            <Link
              href="/house"
              className="flex items-center justify-between p-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 hover:bg-teal-100/70 dark:hover:bg-teal-950/60 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                  <Brush size={12} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-teal-800 dark:text-teal-300 uppercase leading-none">ক্লিনিং ডিউটি</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate mt-0.5">{todayCleaningTask} ({cleaningAssignee})</p>
                </div>
              </div>
              <ArrowRight size={12} className="text-teal-700 dark:text-teal-400 shrink-0" />
            </Link>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>আজকের মোট রান্না:</span>
            <strong className="text-gray-900 font-extrabold">{todayTotalMeals.total} টি মিল</strong>
          </div>
        </div>
      </div>

      {/* 4. Visual Analytics Section (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Meal Trend Bar Chart */}
        <MealTrendChart
          data={weeklyMealTrend}
          todayTotal={todayTotalMeals.total}
          averageMeals={Math.round(weeklyMealTrend.reduce((s, d) => s + d.meals, 0) / (weeklyMealTrend.length || 1))}
        />

        {/* Monthly Expense Share Breakdown */}
        <ExpenseBreakdownChart
          rent={24500}
          utilities={7350}
          bazar={monthBazarExpense}
          household={0}
          totalMembers={totalMembers}
        />
      </div>

      {/* 5. 7-Member Live Roster & Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: 7-Member Directory (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-primary" />
              <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                ৭ জন মেম্বারের লাইভ ব্যালেন্স ও স্থিতি
              </h4>
            </div>
            <Link href="/rooms" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
              <span>রুম বিবরণ (৩ রুম)</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {memberStatusList.map((m, idx) => {
              const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
              const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              const roomInfo = m.seat ? `${m.seat.room?.name ?? "Room"} • সিট ${m.seat.label}` : `Room 10${Math.floor(idx / 2) + 1}`;
              const totalPaid = m.totalPaid || 0;
              const memBal = m.balance !== undefined ? m.balance : 0;
              const isMemCredit = memBal >= 0;

              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate leading-tight">{name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{roomInfo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400">জমা</p>
                      <p className="text-xs font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className="w-20 text-right">
                      <p className="text-[10px] text-gray-400">ব্যালেন্স</p>
                      <span className={cn("text-xs font-extrabold", isMemCredit ? "text-emerald-700" : "text-rose-600")}>
                        {isMemCredit ? "+" : ""}{formatCurrency(memBal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Feed & Quick Links */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
              সাম্প্রতিক লেনদেন
            </h4>
            <Link href="/payments" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
              <span>সব</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentActivities.slice(0, 4).map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate leading-tight">{act.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{formatShortDate(act.time)}</p>
                </div>
                {act.amount !== null && (
                  <span className="text-xs font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                    {formatCurrency(act.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Link
              href="/calendar"
              className="w-full py-2 px-3 rounded-xl border border-gray-200/80 bg-gray-50/80 hover:bg-gray-100 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>📅 মেস ক্যালেন্ডার ও ইভেন্ট শিডিউল দেখুন</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
