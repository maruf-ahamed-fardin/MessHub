import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getMemberById } from "@/backend/members/member.repository";
import { getAllRooms, getAvailableSeats } from "@/backend/rooms/room.repository";
import { calculateMemberFoodCost, calculateMealRate } from "@/backend/services/meal-calculation.service";
import { calculateGuestMealCost } from "@/backend/services/guest-meal.service";
import { calculateMemberExpenseShare } from "@/backend/services/expense-calculation.service";
import { calculateUtilityShare } from "@/backend/services/utility.service";
import { getCurrentMonthYear, getMonthRange } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { notFound } from "next/navigation";
import { MemberManageForm } from "@/components/members/MemberManageForm";
import { PersonalBalanceSheet } from "@/components/members/PersonalBalanceSheet";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Manage Member & Statement" };

export default async function ManageMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";

  const member = await getMemberById(id);
  if (!member) notFound();

  const { month, year } = getCurrentMonthYear();
  const { startDate, endDate } = getMonthRange(month, year);
  const seatRent = Number(member.seatRent) || 0;

  const totalMembers = (await prisma.memberProfile.count({ where: { isActive: true } })) || 7;

  const mealRate = await calculateMealRate(month, year);

  const [
    rooms,
    availableSeats,
    guestData,
    utilityData,
    otherCost,
    paymentsList,
    paidAgg,
    rawUtilityBills,
  ] = await Promise.all([
    getAllRooms(),
    getAvailableSeats(),
    calculateGuestMealCost(member.id, month, year, mealRate),
    calculateUtilityShare(month, year, totalMembers),
    calculateMemberExpenseShare(member.id, month, year, totalMembers),
    prisma.payment.findMany({
      where: { memberId: member.id, date: { gte: startDate, lte: endDate } },
      orderBy: { date: "desc" },
    }),
    prisma.payment.aggregate({
      where: { memberId: member.id, date: { gte: startDate, lte: endDate } },
      _sum: { amount: true },
    }),
    prisma.utilityBill.findMany({ where: { month, year } }),
  ]);
  const { foodCost, totalMeals } = await calculateMemberFoodCost(member.id, month, year, mealRate);
  const totalPaid = Number(paidAgg._sum.amount) || 0;
  const utilityShare = utilityData.perMemberShare;

  const billByType: Record<string, number> = {};
  for (const b of rawUtilityBills) {
    billByType[b.type] = Number(b.amount) || 0;
  }
  const utilityDetails = {
    buaBill: Math.round((billByType["COOK"] || 2100) / totalMembers),
    electricity: Math.round((billByType["ELECTRICITY"] || 2100) / totalMembers),
    gas: Math.round((billByType["GAS"] || 1050) / totalMembers),
    water: Math.round((billByType["WATER"] || 700) / totalMembers),
    internet: Math.round((billByType["INTERNET"] || 1050) / totalMembers),
    waste: Math.round((billByType["WASTE"] || 350) / totalMembers),
  };

  const totalCost = foodCost + guestData.guestMealCost + utilityShare + seatRent + otherCost;
  const balance = Math.round((totalPaid - totalCost) * 100) / 100;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={member.user.name ?? T.pages.members.title}
        description={T.pages.members.description}
      />

      {isAdmin && (
        <MemberManageForm
          member={member}
          rooms={rooms}
          availableSeats={availableSeats}
        />
      )}

      <PersonalBalanceSheet
        member={member}
        totalPaid={totalPaid}
        totalMeals={totalMeals}
        mealRate={mealRate}
        foodCost={foodCost}
        guestMealCost={guestData.guestMealCost}
        totalGuestMeals={guestData.totalGuestMeals}
        utilityShare={utilityShare}
        utilityDetails={utilityDetails}
        seatRent={seatRent}
        otherExpenseShare={otherCost}
        balance={balance}
        paymentHistory={paymentsList}
        month={month}
        year={year}
      />
    </div>
  );
}
