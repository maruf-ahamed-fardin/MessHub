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
import { getTotalOtherExpense, calculateMemberExpenseShare } from "./expense-calculation.service";
import { getMemberTotalPayments, calculateBalance } from "./balance.service";
import { SettlementSummary } from "@/types";

/**
 * Calculate the full monthly settlement for a given month/year.
 * Does NOT persist to the database — use finalizeMonthlySettlement() for that.
 */
export async function calculateMonthlySettlement(
  month: number,
  year: number
): Promise<SettlementSummary> {
  // Get all active members
  const members = await prisma.memberProfile.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, image: true } } },
  });

  const activeCount = members.length;

  // Core calculations
  const [foodExpense, totalNormalMeals, totalUtility, totalOtherExpense, totalGuestMeals] =
    await Promise.all([
      getTotalFoodExpense(month, year),
      getTotalNormalMeals(month, year),
      getTotalUtility(month, year),
      getTotalOtherExpense(month, year),
      getTotalGuestMeals(month, year),
    ]);

  const mealRate = totalNormalMeals > 0 ? roundMoney(foodExpense / totalNormalMeals) : 0;
  const utilityPerMember = activeCount > 0 ? roundMoney(totalUtility / activeCount) : 0;

  // Per-member calculations
  const memberSummaries = await Promise.all(
    members.map(async (member) => {
      const [{ totalMeals }, { guestMealCost }, totalPaid, otherCost] = await Promise.all([
        getMemberTotalMeals(member.id, month, year).then((totalMeals) => ({ totalMeals })),
        calculateGuestMealCost(member.id, month, year, mealRate),
        getMemberTotalPayments(member.id, month, year),
        calculateMemberExpenseShare(member.id, month, year, activeCount),
      ]);

      const foodCost = roundMoney(totalMeals * mealRate);
      const seatRent = toNumber(member.seatRent);
      const utilityCost = utilityPerMember;
      const totalCost = roundMoney(foodCost + guestMealCost + utilityCost + seatRent + otherCost);
      const balance = calculateBalance(totalPaid, totalCost);

      return {
        memberId: member.id,
        memberName: member.user.name ?? "Unknown",
        avatar: member.user.image ?? member.avatar,
        totalMeals,
        foodCost,
        guestMealCost,
        utilityCost,
        seatRent,
        otherCost,
        totalCost,
        totalPaid,
        balance,
      };
    })
  );

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
 * Throws if already finalized.
 */
export async function finalizeMonthlySettlement(
  month: number,
  year: number,
  finalizedById: string
): Promise<void> {
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
  const settlement = await prisma.monthlySettlement.findUnique({
    where: { month_year: { month, year } },
    select: { isFinalized: true },
  });
  return settlement?.isFinalized ?? false;
}

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en", { month: "long" });
}
