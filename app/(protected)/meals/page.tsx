import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getMealsCalendar, getAllMealsForDate } from "@/backend/meals/meal.repository";
import { getGuestMealsForDate } from "@/backend/guest-meals/guest-meal.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getMonthlyMealAnalytics } from "@/backend/services/meal-calculation.service";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { MealCalendar } from "@/components/meals/MealCalendar";
import { DailyMealGrid } from "@/components/meals/DailyMealGrid";
import { MonthlyMealAnalyticsSheet } from "@/components/meals/MonthlyMealAnalyticsSheet";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Meals & Rate Engine" };

interface MealsPageProps {
  searchParams?: Promise<{ date?: string; month?: string; year?: string }>;
}

export default async function MealsPage({ searchParams }: MealsPageProps) {
  const [session, T, resolvedParams] = await Promise.all([
    auth(),
    getServerT(),
    searchParams,
  ]);

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let selectedDate = today;
  if (resolvedParams?.date) {
    const parts = resolvedParams.date.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      selectedDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
  }

  const selectedMonth = selectedDate.getUTCMonth() + 1;
  const selectedYear = selectedDate.getUTCFullYear();
  const isAdmin = session?.user.role === "ADMIN";

  const [calendarData, members, dayMeals, dayGuestMeals, analytics] = await Promise.all([
    getMealsCalendar(selectedMonth, selectedYear),
    getAllMembers(),
    getAllMealsForDate(selectedDate),
    getGuestMealsForDate(selectedDate),
    getMonthlyMealAnalytics(selectedMonth, selectedYear),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={T.pages.meals.title}
        description={T.pages.meals.description}
        action={
          <MealCalendar
            calendarData={calendarData}
            month={selectedMonth}
            year={selectedYear}
            selectedDate={selectedDate}
          />
        }
      />

      <DailyMealGrid
        date={selectedDate}
        members={members}
        meals={dayMeals}
        guestMeals={dayGuestMeals}
        currentMemberId={session?.user.memberId ?? null}
        isAdmin={isAdmin}
        month={selectedMonth}
        year={selectedYear}
      />

      {/* Comprehensive Monthly Meal Rate & Member Breakdown Sheet */}
      <div className="pt-2">
        <MonthlyMealAnalyticsSheet
          analytics={analytics}
          currentMemberId={session?.user.memberId ?? undefined}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
