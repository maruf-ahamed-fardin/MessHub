import { prisma } from "@/lib/db/prisma";
import { toNumber, roundMoney } from "./meal-calculation.service";
import { getMonthRange } from "@/lib/utils/date";

/**
 * Get total guest meal cost for a member in a month.
 * Uses either dynamic (meal rate) or fixed pricing from MessSettings.
 */
export async function calculateGuestMealCost(
  memberId: string,
  month: number,
  year: number,
  mealRate: number
): Promise<{ guestMealCost: number; totalGuestMeals: number }> {
  const { startDate, endDate } = getMonthRange(month, year);

  const settings = await prisma.messSettings.findUnique({
    where: { id: "singleton" },
  });

  const guestMeals = await prisma.guestMeal.findMany({
    where: {
      memberId,
      date: { gte: startDate, lte: endDate },
    },
    select: { quantity: true },
  });

  const totalGuestMeals = guestMeals.reduce((sum, gm) => sum + gm.quantity, 0);

  let pricePerMeal: number;
  if (settings?.guestMealPricing === "FIXED" && settings.guestMealFixedPrice) {
    pricePerMeal = toNumber(settings.guestMealFixedPrice);
  } else {
    pricePerMeal = mealRate;
  }

  const guestMealCost = roundMoney(totalGuestMeals * pricePerMeal);
  return { guestMealCost, totalGuestMeals };
}

/**
 * Get total guest meals for all members in a month.
 */
export async function getTotalGuestMeals(month: number, year: number): Promise<number> {
  const { startDate, endDate } = getMonthRange(month, year);

  const result = await prisma.guestMeal.aggregate({
    where: { date: { gte: startDate, lte: endDate } },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}
