import { prisma } from "@/lib/db/prisma";
import { toNumber, roundMoney } from "./meal-calculation.service";

/**
  * Calculate a member's share of other (non-utility, non-bazar) expenses for a month.
  */
export async function calculateMemberExpenseShare(
  memberId: string,
  month: number,
  year: number,
  totalMembers: number
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [expenses, houseExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    }),
    getMonthlyHouseExpense(month, year),
  ]);

  let memberShare = 0;

  for (const expense of expenses) {
    const amount = toNumber(expense.amount);

    if (expense.sharingMethod === "EQUAL") {
      memberShare += amount / (totalMembers || 1);
    } else if (expense.sharingMethod === "SELECTED_MEMBERS") {
      const selectedIds = expense.selectedMemberIds ? expense.selectedMemberIds.split(",").filter(Boolean) : [];
      if (selectedIds.includes(memberId)) {
        const count = selectedIds.length;
        memberShare += amount / (count || 1);
      }
    } else if (expense.sharingMethod === "MEAL_BASED") {
      memberShare += amount / (totalMembers || 1);
    }
  }

  // House expenses (Maintenance + Shopping items) shared equally
  if (houseExpenses.totalHouseCost > 0 && totalMembers > 0) {
    memberShare += houseExpenses.totalHouseCost / totalMembers;
  }

  return roundMoney(memberShare);
}

/**
 * Get monthly house expenses (Maintenance repairs + Shopping item purchases).
 */
export async function getMonthlyHouseExpense(month: number, year: number): Promise<{
  totalHouseCost: number;
  maintenanceCost: number;
  shoppingCost: number;
}> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [maintResult, shopResult] = await Promise.all([
    prisma.maintenanceReport.aggregate({
      where: {
        cost: { gt: 0 },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { cost: true },
    }),
    prisma.shoppingItem.aggregate({
      where: {
        cost: { gt: 0 },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { cost: true },
    }),
  ]);

  const maintenanceCost = maintResult._sum.cost ?? 0;
  const shoppingCost = shopResult._sum.cost ?? 0;
  return {
    totalHouseCost: maintenanceCost + shoppingCost,
    maintenanceCost,
    shoppingCost,
  };
}

/**
 * Get total expenses for a month (non-utility, non-bazar).
 */
export async function getTotalOtherExpense(month: number, year: number): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [result, house] = await Promise.all([
    prisma.expense.aggregate({
      where: { date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    getMonthlyHouseExpense(month, year),
  ]);

  return toNumber(result._sum.amount) + house.totalHouseCost;
}
