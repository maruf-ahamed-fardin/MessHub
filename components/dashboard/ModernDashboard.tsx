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
import dynamic from "next/dynamic";
import { toggleMealAction } from "@/app/actions/meal.actions";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/useT";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { WhatsAppShareButton } from "./WhatsAppShareButton";
import { SubmitDepositDialog } from "@/components/payments/SubmitDepositDialog";
import { SpotlightCard } from "@/components/ui/ReactBitsSpotlightCard";
import { CountUpNumber } from "@/components/ui/ReactBitsCountUp";
import { ShinyBadge } from "@/components/ui/ReactBitsShinyBadge";

const MealTrendChart = dynamic(
  () => import("./MealTrendChart").then((mod) => mod.MealTrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 h-72 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading chart...
      </div>
    ),
  }
);

const ExpenseBreakdownChart = dynamic(
  () => import("./ExpenseBreakdownChart").then((mod) => mod.ExpenseBreakdownChart),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 h-72 animate-pulse flex items-center justify-center text-xs text-slate-400">
        Loading chart...
      </div>
    ),
  }
);

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
  const T = useT();
  const { language } = usePreferences();
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

  const formattedTodayDate = new Date().toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* ============================================================
          1. Header with Quick Actions & ReactBits Ambient Glass
         ============================================================ */}
      <SpotlightCard
        spotlightColor="rgba(99, 102, 241, 0.12)"
        className="p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border-2 border-indigo-500/30 shrink-0 shadow-md shadow-indigo-500/15">
              <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm sm:text-base">
                {firstName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  {T.dashboard.welcome}, {firstName}!
                </h1>
                <ShinyBadge variant="indigo">
                  {memberProfile?.seat ? `${memberProfile.seat.room?.name ?? "Room"} (${memberProfile.seat.label})` : "Room 101 (A)"}
                </ShinyBadge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {formattedTodayDate}
              </p>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <WhatsAppShareButton
              breakfastCount={todayTotalMeals?.breakfast || 0}
              lunchCount={todayTotalMeals?.lunch || 0}
              dinnerCount={todayTotalMeals?.dinner || 0}
              bazarMemberName={todayBazarBuyer !== "আজকে বাজার শিডিউল নেই" && todayBazarBuyer !== "No bazar scheduled today" ? todayBazarBuyer : null}
              cleaningMemberName={cleaningAssignee !== "আজকে কোনো টাস্ক নেই" && cleaningAssignee !== "No task assigned" ? cleaningAssignee : null}
              mealRate={mealRate}
            />
            <SubmitDepositDialog memberId={memberProfile?.id} />
            <Link
              href="/meals"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500/40 shadow-2xs active:scale-95 transition-all"
            >
              <UtensilsCrossed size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{T.dashboard.mealBooking}</span>
            </Link>
            <Link
              href="/bazar"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100/90 shadow-2xs active:scale-95 transition-all"
            >
              <ShoppingBasket size={14} className="text-amber-600 dark:text-amber-400" />
              <span>{T.dashboard.bazarEntry}</span>
            </Link>
            <Link
              href="/payments"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-slate-900 to-indigo-950 text-white dark:from-slate-100 dark:to-indigo-100 dark:text-slate-900 shadow-sm active:scale-95 transition-all"
            >
              <CreditCard size={14} />
              <span>{T.dashboard.moneyTransaction}</span>
            </Link>
          </div>
        </div>
      </SpotlightCard>

      {/* ============================================================
          2. Notice Announcement Banner
         ============================================================ */}
      {urgentNotice && (
        <div className="bg-amber-50/95 dark:bg-rose-950/40 border border-amber-300/90 dark:border-rose-800/80 rounded-2xl p-4 shadow-xs flex items-start justify-between gap-3 relative overflow-hidden animate-in fade-in-0 duration-200">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 dark:bg-rose-600" />
          <div className="flex items-start gap-3 min-w-0 pl-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 dark:bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs mt-0.5">
              <Megaphone size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 dark:bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-2xs">
                  {T.dashboard.messNotice}
                </span>
                <h4 className="font-black text-xs sm:text-sm text-amber-950 dark:text-rose-100 truncate">{urgentNotice.title}</h4>
              </div>
              <p className="text-xs text-amber-900/90 dark:text-rose-200/90 mt-1 leading-relaxed">{urgentNotice.description || urgentNotice.content}</p>
            </div>
          </div>

          <Link
            href="/notices"
            className="shrink-0 text-xs font-black text-amber-800 hover:text-amber-950 dark:text-white bg-white dark:bg-rose-900/80 border border-amber-200 dark:border-rose-700 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-amber-100 dark:hover:bg-rose-800 transition-all flex items-center gap-1"
          >
            <span>{T.dashboard.details}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ============================================================
          3. Top 3 Primary Cards with ReactBits Spotlight & CountUp
         ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: My Financial Balance & Fund */}
        <SpotlightCard
          spotlightColor={isCredit ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)"}
          className="p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {T.dashboard.myBalance}
            </span>
            <span
              className={cn(
                "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border",
                isCredit
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              )}
            >
              {isCredit ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isCredit ? T.dashboard.credit : T.dashboard.due}
            </span>
          </div>

          <div>
            <p className={cn("text-3xl sm:text-4xl font-black tracking-tight", isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {isCredit ? "+" : "-"}৳<CountUpNumber value={Math.abs(balance)} decimals={0} />
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {T.dashboard.totalDeposit}: <strong className="text-slate-700 dark:text-slate-200">৳10,000</strong> • {T.dashboard.mealBillCost}: ৳<CountUpNumber value={foodCost + utilityShare} />
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{T.dashboard.fundBalance}:</span>
            <strong className="text-slate-900 dark:text-slate-100 font-extrabold">
              ৳<CountUpNumber value={totalFundInHand} />
            </strong>
          </div>
        </SpotlightCard>

        {/* Card 2: Live Meal Rate & Today's Meals Toggle */}
        <SpotlightCard
          spotlightColor="rgba(99, 102, 241, 0.16)"
          className="p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {T.dashboard.liveMealRate}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {totalMeals} {T.dashboard.mealsCompleted}
            </span>
          </div>

          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              ৳<CountUpNumber value={mealRate} decimals={2} /> <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{T.dashboard.perMeal}</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {T.dashboard.foodCost}: <strong className="text-slate-700 dark:text-slate-200">৳<CountUpNumber value={foodCost} /></strong>
            </p>
          </div>

          {/* Interactive Today's Meal Quick Switches */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            {[
              { key: "breakfast" as const, label: T.dashboard.breakfast, emoji: "☀️" },
              { key: "lunch" as const, label: T.dashboard.lunch, emoji: "🍽️" },
              { key: "dinner" as const, label: T.dashboard.dinner, emoji: "🌙" },
            ].map(({ key, label, emoji }) => {
              const isOn = todayMeal?.[key] ?? true;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleToggleMeal(key)}
                  disabled={updatingMeal === key}
                  className={cn(
                    "flex-1 py-1.5 px-1 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all select-none active:scale-95",
                    isOn
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-2xs hover:bg-emerald-500/20"
                      : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                  )}
                  title={`Click to switch ${label} meal`}
                >
                  <span>{emoji}</span>
                  <span className="truncate">{label}</span>
                  <span className="text-[10px]">{isOn ? "✓" : "✕"}</span>
                </button>
              );
            })}
          </div>
        </SpotlightCard>

        {/* Card 3: Today's Key Schedule & Duties */}
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.15)"
          className="p-5 flex flex-col justify-between gap-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {T.dashboard.todaySchedule}
            </span>
            <Clock size={14} className="text-slate-400 dark:text-slate-500" />
          </div>

          <div className="space-y-2">
            {/* Bazar Duty */}
            <Link
              href="/bazar"
              className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                  <ShoppingBasket size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase leading-none">
                    {T.dashboard.bazarDuty}
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {todayBazarBuyer || "Admin (You)"}
                  </p>
                </div>
              </div>
              <ArrowRight size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
            </Link>

            {/* Cleaning Duty */}
            <Link
              href="/house"
              className="flex items-center justify-between p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/15 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs">
                  <Brush size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase leading-none">
                    {T.dashboard.cleaningDuty}
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {todayCleaningTask} ({cleaningAssignee})
                  </p>
                </div>
              </div>
              <ArrowRight size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{T.dashboard.todayCooking}</span>
            <strong className="text-slate-900 dark:text-slate-100 font-extrabold">
              <CountUpNumber value={todayTotalMeals.total} /> {T.meals.total}
            </strong>
          </div>
        </SpotlightCard>
      </div>

      {/* ============================================================
          4. Visual Analytics Section (Charts)
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Weekly Meal Trend Bar Chart */}
        <MealTrendChart
          data={weeklyMealTrend}
          todayTotal={todayTotalMeals.total}
          averageMeals={Math.round(weeklyMealTrend.reduce((s, d) => s + d.meals, 0) / (weeklyMealTrend.length || 1))}
        />

        {/* Monthly Expense Share Breakdown */}
        <ExpenseBreakdownChart
          rent={24500}
          utilities={monthUtilityBills}
          bazar={monthBazarExpense}
          household={0}
          totalMembers={totalMembers}
        />
      </div>

      {/* ============================================================
          5. 7-Member Live Roster & Recent Feed
         ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Left: 7-Member Directory (2 Cols) */}
        <SpotlightCard
          spotlightColor="rgba(99, 102, 241, 0.1)"
          className="lg:col-span-2 p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {T.dashboard.membersStatus}
              </h4>
            </div>
            <Link href="/rooms" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>{T.dashboard.roomDetails}</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {memberStatusList.map((m, idx) => {
              const name = m.user?.name ?? m.name ?? `Member ${idx + 1}`;
              const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              const roomInfo = m.seat ? `${m.seat.room?.name ?? "Room"} • ${T.common.seat} ${m.seat.label}` : `Room 10${Math.floor(idx / 2) + 1}`;
              const totalPaid = m.totalPaid || 0;
              const memBal = m.balance !== undefined ? m.balance : 0;
              const isMemCredit = memBal >= 0;

              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-slate-700">
                      <AvatarFallback className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">{name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{roomInfo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{T.dashboard.deposit}</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className="w-16 sm:w-20 text-right">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{T.dashboard.balanceText}</p>
                      <span className={cn("text-xs font-extrabold", isMemCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {isMemCredit ? "+" : ""}{formatCurrency(memBal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>

        {/* Right: Recent Feed & Quick Links */}
        <SpotlightCard
          spotlightColor="rgba(168, 85, 247, 0.1)"
          className="p-5 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {T.dashboard.recentActivity}
            </h4>
            <Link href="/payments" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>{T.dashboard.allText}</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentActivities.slice(0, 4).map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">{act.title}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{formatShortDate(act.time)}</p>
                </div>
                {act.amount !== null && (
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0 border border-slate-200 dark:border-slate-700">
                    {formatCurrency(act.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/calendar"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all text-center active:scale-95"
            >
              <span>{T.dashboard.calendarSchedule}</span>
            </Link>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
