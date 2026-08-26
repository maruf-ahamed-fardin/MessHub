import { prisma } from "@/lib/db/prisma";
import { toNumber, roundMoney } from "./meal-calculation.service";
import { getMonthlyHouseExpense } from "./expense-calculation.service";
import { getMonthRange } from "@/lib/utils/date";

export interface MemberBalanceSummary {
  memberId: string;
  totalPaid: number;
  foodCost: number;
  totalMeals: number;
  utilityShare: number;
  expenseShare: number;
  totalCost: number;
  balance: number;
}

/**
 * Get total payments made by a member in a given month.
 */
export async function getMemberTotalPayments(
  memberId: string,
  month: number,
  year: number
): Promise<number> {
  const { startDate, endDate } = getMonthRange(month, year);

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
 * Batch calculate live running balances for ALL active members in a single parallel batch.
 * Eliminates N+1 queries by fetching datasets once and computing in-memory in O(N).
 */
export async function getAllMembersRunningBalances(
  month?: number,
  year?: number
): Promise<{
  mealRate: number;
  totalFoodExpense: number;
  totalNormalMeals: number;
  totalUtility: number;
  monthBazarExpense: number;
  monthUtilityBills: number;
  totalPayments: number;
  balances: Record<string, MemberBalanceSummary>;
}> {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();
  const { startDate, endDate } = getMonthRange(m, y);

  // Single parallel batch for ALL required calculations
  const [
    members,
    allPayments,
    allMeals,
    allBazars,
    utilityBills,
    expenses,
    houseExpenses,
  ] = await Promise.all([
    prisma.memberProfile.findMany({
      where: { isActive: true },
      select: { id: true, seatRent: true },
    }),
    prisma.payment.findMany({
      select: { memberId: true, amount: true },
    }),
    prisma.meal.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        member: { isActive: true },
      },
      select: { memberId: true, breakfast: true, lunch: true, dinner: true },
    }),
    prisma.bazar.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { totalAmount: true },
    }),
    prisma.utilityBill.findMany({
      where: { month: m, year: y },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { amount: true, sharingMethod: true, selectedMemberIds: true },
    }),
    getMonthlyHouseExpense(m, y),
  ]);

  const activeCount = members.length || 1;

  // 1. Food totals & Meal rate
  const totalFoodExpense = allBazars.reduce((sum, b) => sum + toNumber(b.totalAmount), 0);
  const memberMealCountMap: Record<string, number> = {};
  for (const member of members) {
    memberMealCountMap[member.id] = 0;
  }

  let totalNormalMeals = 0;
  for (const meal of allMeals) {
    let count = 0;
    if (meal.breakfast) count++;
    if (meal.lunch) count++;
    if (meal.dinner) count++;
    if (count > 0) {
      memberMealCountMap[meal.memberId] = (memberMealCountMap[meal.memberId] || 0) + count;
      totalNormalMeals += count;
    }
  }

  const mealRate = totalNormalMeals > 0 ? roundMoney(totalFoodExpense / totalNormalMeals) : 0;

  // 2. Utility share
  const monthUtilityBills = utilityBills.reduce((sum, u) => sum + toNumber(u.amount), 0);
  const utilityPerMember = roundMoney(monthUtilityBills / activeCount);

  // 3. Other & House expenses
  const houseCostPerMember = houseExpenses.totalHouseCost > 0 ? houseExpenses.totalHouseCost / activeCount : 0;
  const memberExpenseMap: Record<string, number> = {};
  for (const member of members) {
    memberExpenseMap[member.id] = houseCostPerMember;
  }

  for (const exp of expenses) {
    const amt = toNumber(exp.amount);
    if (exp.sharingMethod === "EQUAL") {
      const share = amt / activeCount;
      for (const member of members) {
        memberExpenseMap[member.id] += share;
      }
    } else if (exp.sharingMethod === "SELECTED_MEMBERS") {
      const selected = exp.selectedMemberIds ? exp.selectedMemberIds.split(",").filter(Boolean) : [];
      if (selected.length > 0) {
        const share = amt / selected.length;
        for (const sid of selected) {
          if (memberExpenseMap[sid] !== undefined) {
            memberExpenseMap[sid] += share;
          }
        }
      }
    } else if (exp.sharingMethod === "MEAL_BASED") {
      for (const member of members) {
        const mMeals = memberMealCountMap[member.id] || 0;
        const ratio = totalNormalMeals > 0 ? mMeals / totalNormalMeals : 1 / activeCount;
        memberExpenseMap[member.id] += amt * ratio;
      }
    }
  }

  // 4. Payments per member
  const memberPaidMap: Record<string, number> = {};
  let totalPayments = 0;
  for (const p of allPayments) {
    const amt = toNumber(p.amount);
    totalPayments += amt;
    memberPaidMap[p.memberId] = (memberPaidMap[p.memberId] || 0) + amt;
  }

  // 5. Final summary per member
  const balances: Record<string, MemberBalanceSummary> = {};
  for (const member of members) {
    const totalMeals = memberMealCountMap[member.id] || 0;
    const foodCost = roundMoney(totalMeals * mealRate);
    const utilityShare = utilityPerMember;
    const expenseShare = roundMoney(memberExpenseMap[member.id] || 0);
    const totalCost = roundMoney(foodCost + utilityShare + expenseShare);
    const totalPaid = roundMoney(memberPaidMap[member.id] || 0);
    const balance = roundMoney(totalPaid - totalCost);

    balances[member.id] = {
      memberId: member.id,
      totalPaid,
      foodCost,
      totalMeals,
      utilityShare,
      expenseShare,
      totalCost,
      balance,
    };
  }

  return {
    mealRate,
    totalFoodExpense,
    totalNormalMeals,
    totalUtility: monthUtilityBills,
    monthBazarExpense: totalFoodExpense,
    monthUtilityBills,
    totalPayments,
    balances,
  };
}

/**
 * Calculate live outstanding balance for a single member.
 */
export async function calculateMemberRunningBalance(memberId: string): Promise<number> {
  const result = await getAllMembersRunningBalances();
  return result.balances[memberId]?.balance ?? 0;
}

/**
 * Calculate member balance for a specific month.
 * balance = totalPaid - totalCost
 */
export function calculateBalance(totalPaid: number, totalCost: number): number {
  return roundMoney(totalPaid - totalCost);
}

