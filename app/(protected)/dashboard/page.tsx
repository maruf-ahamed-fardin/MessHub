import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { calculateMemberFoodCost, calculateMealRate } from "@/backend/services/meal-calculation.service";
import { calculateMemberRunningBalance } from "@/backend/services/balance.service";
import { getMonthlyHouseExpense } from "@/backend/services/expense-calculation.service";
import { getActiveNotices } from "@/backend/community/community.repository";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PersonalSummary } from "@/components/dashboard/PersonalSummary";
import { MessSummary } from "@/components/dashboard/MessSummary";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ImportantNotice } from "@/components/dashboard/ImportantNotice";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const { month, year } = getCurrentMonthYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Defaults
  let member = null;
  let todayMeal: any = { breakfast: true, lunch: true, dinner: true };
  let mealRate = 65.5;
  let foodCost = 3930;
  let totalMeals = 60;
  let balance = 1200;
  let totalMembers = 8;
  let totalSeats = 10;
  let occupiedSeats = 8;
  let todayTotalMeals = 22;
  let monthBazarExpense = 0;
  let monthHouseExpense = 0;
  let recentBazar: any[] = [];
  let recentPayments: any[] = [];
  let recentGuestMeals: any[] = [];
  let urgentNotice: any = null;
  let upcomingCleaning: any[] = [];
  let upcomingTasks: any[] = [];

  try {
    if (session?.user.memberId) {
      member = await prisma.memberProfile.findUnique({
        where: { id: session.user.memberId },
        include: { seat: { include: { room: true } }, user: true },
      });
    }

    if (member) {
      todayMeal = await prisma.meal.findUnique({
        where: { memberId_date: { memberId: member.id, date: today } },
      });
      mealRate = await calculateMealRate(month, year);
      const calculated = await calculateMemberFoodCost(member.id, month, year, mealRate);
      foodCost = calculated.foodCost;
      totalMeals = calculated.totalMeals;
      balance = await calculateMemberRunningBalance(member.id);
    }

    const [dbTotalMembers, dbTotalSeats, dbOccupiedSeats, houseCostData] = await Promise.all([
      prisma.memberProfile.count({ where: { isActive: true } }),
      prisma.seat.count(),
      prisma.seat.count({ where: { isOccupied: true } }),
      getMonthlyHouseExpense(month, year),
    ]);

    totalMembers = dbTotalMembers;
    totalSeats = dbTotalSeats;
    occupiedSeats = dbOccupiedSeats;
    monthHouseExpense = houseCostData.totalHouseCost;

    const todayMeals = await prisma.meal.findMany({ where: { date: today } });
    if (todayMeals.length > 0) {
      todayTotalMeals = todayMeals.reduce(
        (sum, m) => sum + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0
      );
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const bazarAgg = await prisma.bazar.aggregate({
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { totalAmount: true },
    });
    monthBazarExpense = Number(bazarAgg._sum.totalAmount) || 0;

    const [dbBazar, dbPayments, dbGuestMeals] = await Promise.all([
      prisma.bazar.findMany({ take: 3, orderBy: { createdAt: "desc" }, include: { buyerMember: { include: { user: { select: { name: true } } } } } }),
      prisma.payment.findMany({ take: 3, orderBy: { createdAt: "desc" }, include: { member: { include: { user: { select: { name: true } } } } } }),
      prisma.guestMeal.findMany({ take: 2, orderBy: { createdAt: "desc" }, include: { addedBy: { include: { user: { select: { name: true } } } } } }),
    ]);

    recentBazar = dbBazar;
    recentPayments = dbPayments;
    recentGuestMeals = dbGuestMeals;

    const notices = await getActiveNotices();
    if (notices.length > 0) {
      urgentNotice = notices.find((n) => n.priority === "URGENT") ?? notices.find((n) => n.priority === "IMPORTANT") ?? notices[0] ?? null;
    }

    const [dbCleaning, dbTasks] = await Promise.all([
      prisma.cleaningTask.findMany({ where: { status: "PENDING", dueDate: { gte: today } }, include: { assignedMember: { include: { user: { select: { name: true } } } } }, orderBy: { dueDate: "asc" }, take: 3 }),
      prisma.householdTask.findMany({ where: { status: "PENDING", dueDate: { gte: today } }, include: { assignedMember: { include: { user: { select: { name: true } } } } }, orderBy: { dueDate: "asc" }, take: 2 }),
    ]);

    upcomingCleaning = dbCleaning;
    upcomingTasks = dbTasks;
  } catch (err) {
    console.error("Dashboard error:", err);
  }

  return (
    <div className="space-y-6">
      <DashboardHeader name={session?.user.name ?? "Admin"} />

      {urgentNotice && <ImportantNotice notice={urgentNotice} />}

      <PersonalSummary
        balance={balance}
        foodCost={foodCost}
        totalMeals={totalMeals}
        todayMeal={todayMeal}
        room={member?.seat?.room?.name ?? "Room 1"}
        seat={member?.seat?.label ?? "A"}
        mealRate={mealRate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MessSummary
            totalMembers={totalMembers}
            occupiedSeats={occupiedSeats}
            availableSeats={totalSeats - occupiedSeats}
            todayTotalMeals={todayTotalMeals}
            monthBazarExpense={monthBazarExpense}
            monthHouseExpense={monthHouseExpense}
          />

          <RecentActivity
            bazar={recentBazar}
            payments={recentPayments}
            guestMeals={recentGuestMeals}
          />
        </div>

        <div>
          <UpcomingTasks cleaning={upcomingCleaning} tasks={upcomingTasks} />
        </div>
      </div>
    </div>
  );
}
