import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getMealsCalendar, getAllMealsForDate } from "@/backend/meals/meal.repository";
import { getGuestMealsForDate } from "@/backend/guest-meals/guest-meal.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { MealCalendar } from "@/components/meals/MealCalendar";
import { DailyMealGrid } from "@/components/meals/DailyMealGrid";

export const metadata: Metadata = { title: "Meals" };

export default async function MealsPage() {
  const session = await auth();
  const { month, year } = getCurrentMonthYear();
  const isAdmin = session?.user.role === "ADMIN";

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const [calendarData, members, todayMeals, todayGuestMeals] = await Promise.all([
    getMealsCalendar(month, year),
    getAllMembers(),
    getAllMealsForDate(today),
    getGuestMealsForDate(today),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Meals" description="দৈনিক মিল অন/অফ, গেস্ট মিল এবং মাসিক হিস্ট্রি" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <DailyMealGrid
            date={today}
            members={members}
            meals={todayMeals}
            guestMeals={todayGuestMeals}
            currentMemberId={session?.user.memberId ?? null}
            isAdmin={isAdmin}
            month={month}
            year={year}
          />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <p className="section-heading">মাসিক ক্যালেন্ডার</p>
          <MealCalendar calendarData={calendarData} month={month} year={year} />
        </div>
      </div>
    </div>
  );
}
