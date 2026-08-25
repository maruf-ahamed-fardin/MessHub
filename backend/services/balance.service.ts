import { prisma } from "@/lib/db/prisma";
import { toNumber, roundMoney } from "./meal-calculation.service";

/**
 * Get total payments made by a member in a given month.
 */
export async function getMemberTotalPayments(
  memberId: string,
  month: number,
  year: number
): Promise<number> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

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
 * Calculate total outstanding balance for a member.
 * A negative balance means they owe money.
 * A positive balance means they have credit.
 * This is a running total across all unfinalized months.
 */
export async function calculateMemberRunningBalance(memberId: string): Promise<number> {
  // Sum all finalized member settlements
  const settlements = await prisma.memberSettlement.findMany({
    where: { memberId },
    select: { balance: true },
  });

  const settledBalance = settlements.reduce(
    (sum, s) => sum + toNumber(s.balance),
    0
  );

  return roundMoney(settledBalance);
}

/**
 * Calculate member balance for a specific month (not yet finalized).
 * balance = totalPaid - totalCost
 * Negative = owes money, positive = credit
 */
export function calculateBalance(totalPaid: number, totalCost: number): number {
  return roundMoney(totalPaid - totalCost);
}
