import { prisma } from "@/lib/db/prisma";
import { toNumber, roundMoney, calculateMealRate, calculateMemberFoodCost } from "./meal-calculation.service";
import { calculateMemberExpenseShare } from "./expense-calculation.service";
import { calculateUtilityShare } from "./utility.service";

/**
 * Get total payments made by a member in a given month.
 */
export async function getMemberTotalPayments(
  memberId: string,
  month: number,
  year: number
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const result = await prisma.payment.aggregate({
    where: {
      memberId,
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  return toNumber(result._sum.amount);
}

/**
 * Calculate live outstanding balance for a member for current & past months.
 * Positive = Credit (টাকা জমা আছে)
 * Negative = Due (টাকা বকেয়া আছে)
 */
export async function calculateMemberRunningBalance(memberId: string): Promise<number> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const totalMembers = (await prisma.memberProfile.count({ where: { isActive: true } })) || 1;

  // 1. Total payments made by this member
  const totalPaidAgg = await prisma.payment.aggregate({
    where: { memberId },
    _sum: { amount: true },
  });
  const totalPaid = toNumber(totalPaidAgg._sum.amount);

  // 2. Food cost for this month
  const mealRate = await calculateMealRate(month, year);
  const foodData = await calculateMemberFoodCost(memberId, month, year, mealRate);
  const foodCost = foodData.foodCost;

  // 3. Utility & Rent share (Equal split of all bills)
  const utilityData = await calculateUtilityShare(month, year, totalMembers);
  const utilityShare = utilityData.perMemberShare;

  // 4. Other shared expenses
  const expenseShare = await calculateMemberExpenseShare(memberId, month, year, totalMembers);

  // Total cost incurred by member
  const totalCost = foodCost + utilityShare + expenseShare;

  return roundMoney(totalPaid - totalCost);
}

/**
 * Calculate member balance for a specific month.
 * balance = totalPaid - totalCost
 */
export function calculateBalance(totalPaid: number, totalCost: number): number {
  return roundMoney(totalPaid - totalCost);
}
