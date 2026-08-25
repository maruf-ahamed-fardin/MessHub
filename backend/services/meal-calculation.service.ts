import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { getMonthRange } from "@/lib/utils/date";

/**
 * Get total bazar (food) expense for a given month/year.
 * Only counts bazar entries in that month.
 */
export async function getTotalFoodExpense(month: number, year: number): Promise<number> {
  const { startDate, endDate } = getMonthRange(month, year);

  const result = await prisma.bazar.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    _sum: { totalAmount: true },
  });

  return toNumber(result._sum.totalAmount);
}

/**
 * Get total normal meals (breakfast + lunch + dinner) across all members for a month.
 * This is the denominator for meal rate calculation.
 * Guest meals are NOT included.
 */
export async function getTotalNormalMeals(month: number, year: number): Promise<number> {
  const { startDate, endDate } = getMonthRange(month, year);

  const meals = await prisma.meal.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      member: { isActive: true },
    },
    select: { breakfast: true, lunch: true, dinner: true },
  });

  let total = 0;
  for (const meal of meals) {
    if (meal.breakfast) total++;
    if (meal.lunch) total++;
    if (meal.dinner) total++;
  }
  return total;
}

/**
 * Calculate meal rate for a month.
 * mealRate = totalFoodExpense / totalNormalMeals
 * Returns 0 if there are no meals (avoids division by zero).
 */
export async function calculateMealRate(month: number, year: number): Promise<number> {
  const [foodExpense, totalMeals] = await Promise.all([
    getTotalFoodExpense(month, year),
    getTotalNormalMeals(month, year),
  ]);

  if (totalMeals === 0) return 0;
  return roundMoney(foodExpense / totalMeals);
}

/**
 * Get a specific member's total meals for a month.
 */
export async function getMemberTotalMeals(
  memberId: string,
  month: number,
  year: number
): Promise<number> {
  const { startDate, endDate } = getMonthRange(month, year);

  const meals = await prisma.meal.findMany({
    where: {
      memberId,
      date: { gte: startDate, lte: endDate },
    },
    select: { breakfast: true, lunch: true, dinner: true },
  });

  let total = 0;
  for (const meal of meals) {
    if (meal.breakfast) total++;
    if (meal.lunch) total++;
    if (meal.dinner) total++;
  }
  return total;
}

/**
 * Calculate a member's food cost for a month.
 * memberFoodCost = memberTotalMeals × mealRate
 */
export async function calculateMemberFoodCost(
  memberId: string,
  month: number,
  year: number,
  mealRate?: number
): Promise<{ foodCost: number; totalMeals: number; mealRate: number }> {
  const [totalMeals, rate] = await Promise.all([
    getMemberTotalMeals(memberId, month, year),
    mealRate !== undefined ? Promise.resolve(mealRate) : calculateMealRate(month, year),
  ]);

  const foodCost = roundMoney(totalMeals * rate);
  return { foodCost, totalMeals, mealRate: rate };
}

/**
 * Comprehensive monthly meal & bazar rate analytics for all members.
 */
export async function getMonthlyMealAnalytics(month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);

  const [members, allMeals, allGuestMeals, allBazars] = await Promise.all([
    prisma.memberProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true, image: true } },
        seat: { include: { room: true } },
      },
    }),
    prisma.meal.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        member: { isActive: true },
      },
      select: { memberId: true, breakfast: true, lunch: true, dinner: true },
    }),
    prisma.guestMeal.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      select: { memberId: true, quantity: true },
    }),
    prisma.bazar.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      select: { buyerId: true, totalAmount: true },
    }),
  ]);

  // 1. Total Bazar Expense
  const totalBazarExpense = allBazars.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  // 2. Count meals per member & aggregate
  const memberMealMap: Record<string, { breakfast: number; lunch: number; dinner: number; normal: number }> = {};
  for (const m of members) {
    memberMealMap[m.id] = { breakfast: 0, lunch: 0, dinner: 0, normal: 0 };
  }

  let totalNormalMeals = 0;
  for (const meal of allMeals) {
    if (!memberMealMap[meal.memberId]) {
      memberMealMap[meal.memberId] = { breakfast: 0, lunch: 0, dinner: 0, normal: 0 };
    }
    if (meal.breakfast) {
      memberMealMap[meal.memberId].breakfast++;
      memberMealMap[meal.memberId].normal++;
      totalNormalMeals++;
    }
    if (meal.lunch) {
      memberMealMap[meal.memberId].lunch++;
      memberMealMap[meal.memberId].normal++;
      totalNormalMeals++;
    }
    if (meal.dinner) {
      memberMealMap[meal.memberId].dinner++;
      memberMealMap[meal.memberId].normal++;
      totalNormalMeals++;
    }
  }

  // 3. Guest meals per member
  const memberGuestMap: Record<string, number> = {};
  let totalGuestMeals = 0;
  for (const g of allGuestMeals) {
    const qty = Number(g.quantity) || 1;
    memberGuestMap[g.memberId] = (memberGuestMap[g.memberId] || 0) + qty;
    totalGuestMeals += qty;
  }

  // 4. Bazar done per member
  const memberBazarMap: Record<string, number> = {};
  for (const b of allBazars) {
    const amt = Number(b.totalAmount) || 0;
    memberBazarMap[b.buyerId] = (memberBazarMap[b.buyerId] || 0) + amt;
  }

  // 5. Calculate live meal rate
  const mealRate = totalNormalMeals > 0 ? roundMoney(totalBazarExpense / totalNormalMeals) : 0;

  // 6. Build detailed member breakdowns
  const memberBreakdowns = members.map((m) => {
    const meals = memberMealMap[m.id] || { breakfast: 0, lunch: 0, dinner: 0, normal: 0 };
    const guestCount = memberGuestMap[m.id] || 0;
    const totalCount = meals.normal + guestCount;
    const normalCost = roundMoney(meals.normal * mealRate);
    const guestCost = roundMoney(guestCount * mealRate);
    const totalFoodCost = roundMoney(normalCost + guestCost);
    const totalBazarDone = roundMoney(memberBazarMap[m.id] || 0);
    const bazarBalance = roundMoney(totalBazarDone - totalFoodCost);

    return {
      memberId: m.id,
      memberName: m.user.name ?? "Member",
      email: m.user.email,
      avatar: m.user.image ?? m.avatar ?? null,
      seat: m.seat ? `${m.seat.room?.name ?? "Room"} (${m.seat.label})` : "Unassigned",
      breakfastCount: meals.breakfast,
      lunchCount: meals.lunch,
      dinnerCount: meals.dinner,
      normalMealsCount: meals.normal,
      guestMealsCount: guestCount,
      totalMealsCount: totalCount,
      foodCost: totalFoodCost,
      totalBazarDone,
      bazarBalance,
    };
  });

  return {
    month,
    year,
    totalBazarExpense: roundMoney(totalBazarExpense),
    totalNormalMeals,
    totalGuestMeals,
    totalMeals: totalNormalMeals + totalGuestMeals,
    mealRate,
    memberBreakdowns,
  };
}

// ---- Helpers ----

export function toNumber(value: number | string | { toString(): string } | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
