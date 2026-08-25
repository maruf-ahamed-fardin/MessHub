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

// ---- Helpers ----

export function toNumber(value: number | string | { toString(): string } | null | undefined): number {
  if (!value) return 0;
  return Number(value.toString());
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
