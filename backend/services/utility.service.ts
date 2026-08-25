import { prisma } from "@/lib/db/prisma";
import { toNumber, roundMoney } from "./meal-calculation.service";

/**
 * Get total utility expense for a month.
 */
export async function getTotalUtility(month: number, year: number): Promise<number> {
  const bills = await prisma.utilityBill.findMany({
    where: { month, year },
    select: { amount: true },
  });

  return roundMoney(bills.reduce((sum, b) => sum + toNumber(b.amount), 0));
}

/**
 * Calculate per-member utility share (equal split among active members).
 */
export async function calculateUtilityShare(
  month: number,
  year: number,
  activeMembers?: number
): Promise<{ perMemberShare: number; totalUtility: number }> {
  const [totalUtility, memberCount] = await Promise.all([
    getTotalUtility(month, year),
    activeMembers !== undefined
      ? Promise.resolve(activeMembers)
      : prisma.memberProfile.count({ where: { isActive: true } }),
  ]);

  if (memberCount === 0) {
    return { perMemberShare: 0, totalUtility };
  }

  const perMemberShare = roundMoney(totalUtility / memberCount);
  return { perMemberShare, totalUtility };
}
