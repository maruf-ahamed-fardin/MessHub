import { prisma } from "@/lib/db/prisma";
import {
  calculateMealRate,
  getTotalFoodExpense,
  getTotalNormalMeals,
  getMemberTotalMeals,
  roundMoney,
  toNumber,
} from "./meal-calculation.service";
import { calculateGuestMealCost, getTotalGuestMeals } from "./guest-meal.service";
import { getTotalUtility } from "./utility.service";
import {
  getTotalOtherExpense,
  calculateMemberExpenseShare,
  getMonthlyHouseExpense,
} from "./expense-calculation.service";
import { getMemberTotalPayments, calculateBalance } from "./balance.service";
import { SettlementSummary } from "@/types";
import { getCurrentMonthYear, getMonthRange } from "@/lib/utils/date";

/**
 * Calculate the full monthly settlement for a given month/year.
 * Does NOT persist to the database — use finalizeMonthlySettlement() for that.
 */
export async function calculateMonthlySettlement(
  month: number,
  year: number
): Promise<SettlementSummary> {
  const { startDate, endDate } = getMonthRange(month, year);

  // Single parallel batch for ALL data needed for monthly settlement
  const [
    members,
    allMeals,
    allGuestMeals,
    allPayments,
    allBazars,
    utilityBills,
    expenses,
    houseExpenses,
  ] = await Promise.all([
    prisma.memberProfile.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true, image: true } } },
    }),
    prisma.meal.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        member: { isActive: true },
      },
      select: { memberId: true, breakfast: true, lunch: true, dinner: true },
    }),
    prisma.guestMeal.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { memberId: true, quantity: true },
    }),
    prisma.payment.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { memberId: true, amount: true },
    }),
    prisma.bazar.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { totalAmount: true },
    }),
    prisma.utilityBill.findMany({
      where: { month, year },
      select: { amount: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { amount: true, sharingMethod: true, selectedMemberIds: true },
    }),
    getMonthlyHouseExpense(month, year),
  ]);

  const activeCount = members.length || 1;

  // 1. Food totals & Meal rate
  const foodExpense = allBazars.reduce((sum: number, b: { totalAmount: number | string }) => sum + toNumber(b.totalAmount), 0);
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

  const mealRate = totalNormalMeals > 0 ? roundMoney(foodExpense / totalNormalMeals) : 0;

  // 2. Guest meals per member
  const memberGuestMap: Record<string, number> = {};
  let totalGuestMeals = 0;
  for (const g of allGuestMeals) {
    const qty = Number(g.quantity) || 1;
    memberGuestMap[g.memberId] = (memberGuestMap[g.memberId] || 0) + qty;
    totalGuestMeals += qty;
  }

  // 3. Utility per member
  const totalUtility = utilityBills.reduce((sum: number, u: { amount: number | string }) => sum + toNumber(u.amount), 0);
  const utilityPerMember = roundMoney(totalUtility / activeCount);

  // 4. Other & House expenses per member
  const houseCostPerMember = houseExpenses.totalHouseCost > 0 ? houseExpenses.totalHouseCost / activeCount : 0;
  const memberExpenseMap: Record<string, number> = {};
  for (const member of members) {
    memberExpenseMap[member.id] = houseCostPerMember;
  }

  let totalOtherExpense = houseExpenses.totalHouseCost;
  for (const exp of expenses) {
    const amt = toNumber(exp.amount);
    totalOtherExpense += amt;
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

  // 5. Payments per member
  const memberPaidMap: Record<string, number> = {};
  for (const p of allPayments) {
    const amt = toNumber(p.amount);
    memberPaidMap[p.memberId] = (memberPaidMap[p.memberId] || 0) + amt;
  }

  // 6. Member summaries
  const memberSummaries = members.map((member: (typeof members)[number]) => {
    const totalMeals = memberMealCountMap[member.id] || 0;
    const foodCost = roundMoney(totalMeals * mealRate);
    const guestCount = memberGuestMap[member.id] || 0;
    const guestMealCost = roundMoney(guestCount * mealRate);
    const seatRent = toNumber(member.seatRent);
    const utilityCost = utilityPerMember;
    const otherCost = roundMoney(memberExpenseMap[member.id] || 0);
    const totalCost = roundMoney(foodCost + guestMealCost + utilityCost + seatRent + otherCost);
    const totalPaid = roundMoney(memberPaidMap[member.id] || 0);
    const balance = calculateBalance(totalPaid, totalCost);

    return {
      memberId: member.id,
      memberName: member.user?.name ?? "Unknown",
      avatar: member.user?.image ?? null,
      totalMeals,
      foodCost,
      guestMealCost,
      utilityCost,
      seatRent,
      otherCost,
      totalCost,
      totalPaid,
      balance,
      status: balance >= 0 ? ("REFUND" as const) : ("DUE" as const),
    };
  });

  return {
    month,
    year,
    mealRate,
    totalFoodExpense: foodExpense,
    totalNormalMeals,
    totalGuestMeals,
    totalUtility,
    totalOtherExpense,
    activeMembers: activeCount,
    isFinalized: false,
    memberSummaries,
  };
}

/**
 * Finalize a month's settlement.
 * Locks records and persists MemberSettlement rows.
 * Throws if already finalized or if current month.
 */
export async function finalizeMonthlySettlement(
  month: number,
  year: number,
  finalizedById: string
): Promise<void> {
  const { month: currMonth, year: currYear } = getCurrentMonthYear();
  if (month === currMonth && year === currYear) {
    throw new Error("চলতি মাস এখনও শেষ হয়নি। মাস শেষ হওয়ার পর ফাইনাল ও লক করা যাবে। (The current running month cannot be finalized.)");
  }

  // Check if already finalized
  const existing = await prisma.monthlySettlement.findUnique({
    where: { month_year: { month, year } },
  });

  if (existing?.isFinalized) {
    throw new Error(`${getMonthName(month)} ${year} settlement is already finalized.`);
  }

  const summary = await calculateMonthlySettlement(month, year);

  await prisma.$transaction(async (tx) => {
    // Upsert the MonthlySettlement record
    const settlement = await tx.monthlySettlement.upsert({
      where: { month_year: { month, year } },
      create: {
        month,
        year,
        isFinalized: true,
        finalizedAt: new Date(),
        finalizedById,
        totalFoodExpense: summary.totalFoodExpense,
        totalNormalMeals: summary.totalNormalMeals,
        mealRate: summary.mealRate,
        totalGuestMeals: summary.totalGuestMeals,
        totalUtility: summary.totalUtility,
        totalOtherExpense: summary.totalOtherExpense,
        activeMembers: summary.activeMembers,
      },
      update: {
        isFinalized: true,
        finalizedAt: new Date(),
        finalizedById,
        totalFoodExpense: summary.totalFoodExpense,
        totalNormalMeals: summary.totalNormalMeals,
        mealRate: summary.mealRate,
        totalGuestMeals: summary.totalGuestMeals,
        totalUtility: summary.totalUtility,
        totalOtherExpense: summary.totalOtherExpense,
        activeMembers: summary.activeMembers,
      },
    });

    // Upsert per-member settlements
    for (const ms of summary.memberSummaries) {
      await tx.memberSettlement.upsert({
        where: {
          settlementId_memberId: {
            settlementId: settlement.id,
            memberId: ms.memberId,
          },
        },
        create: {
          settlementId: settlement.id,
          memberId: ms.memberId,
          totalMeals: ms.totalMeals,
          foodCost: ms.foodCost,
          guestMealCost: ms.guestMealCost,
          utilityCost: ms.utilityCost,
          seatRent: ms.seatRent,
          otherCost: ms.otherCost,
          totalCost: ms.totalCost,
          totalPaid: ms.totalPaid,
          balance: ms.balance,
        },
        update: {
          totalMeals: ms.totalMeals,
          foodCost: ms.foodCost,
          guestMealCost: ms.guestMealCost,
          utilityCost: ms.utilityCost,
          seatRent: ms.seatRent,
          otherCost: ms.otherCost,
          totalCost: ms.totalCost,
          totalPaid: ms.totalPaid,
          balance: ms.balance,
        },
      });
    }
  });
}

/**
 * Reopen a finalized month (admin only).
 */
export async function reopenMonthlySettlement(
  month: number,
  year: number
): Promise<void> {
  const settlement = await prisma.monthlySettlement.findUnique({
    where: { month_year: { month, year } },
  });

  if (!settlement) {
    throw new Error(`No settlement found for ${getMonthName(month)} ${year}.`);
  }

  if (!settlement.isFinalized) {
    throw new Error(`${getMonthName(month)} ${year} settlement is not finalized.`);
  }

  await prisma.monthlySettlement.update({
    where: { month_year: { month, year } },
    data: {
      isFinalized: false,
      finalizedAt: null,
      finalizedById: null,
    },
  });
}

/**
 * Check if a month is finalized.
 */
export async function isMonthFinalized(month: number, year: number): Promise<boolean> {
  const { month: currMonth, year: currYear } = getCurrentMonthYear();
  if (month === currMonth && year === currYear) {
    return false;
  }
  const settlement = await prisma.monthlySettlement.findUnique({
    where: { month_year: { month, year } },
    select: { isFinalized: true },
  });
  return settlement?.isFinalized ?? false;
}

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en", { month: "long" });
}
