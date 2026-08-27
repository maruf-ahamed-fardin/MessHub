import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getMemberByUserId } from "@/backend/members/member.repository";
import { calculateMemberFoodCost, calculateMealRate } from "@/backend/services/meal-calculation.service";
import { calculateGuestMealCost } from "@/backend/services/guest-meal.service";
import { calculateMemberExpenseShare } from "@/backend/services/expense-calculation.service";
import { calculateUtilityShare } from "@/backend/services/utility.service";
import { getCurrentMonthYear, getMonthRange } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { PersonalBalanceSheet } from "@/components/members/PersonalBalanceSheet";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "My Balance Sheet & Profile" };

export default async function MyProfilePage() {
  const session = await auth();
  const { month, year } = getCurrentMonthYear();
  const { startDate, endDate } = getMonthRange(month, year);

  let member: any = {
    id: "m1",
    seatRent: 3500,
    phone: "01700000000",
    joinedAt: new Date(2025, 0, 1),
    avatar: null,
    user: {
      name: session?.user.name ?? "Admin (You)",
      email: session?.user.email ?? "admin@messhub.app",
      image: null,
    },
    seat: {
      label: "A",
      room: { name: "Room 101" },
    },
  };

  let mealRate = 65.5;
  let foodCost = 4061;
  let totalMeals = 62;
  let guestMealCost = 0;
  let totalGuestMeals = 0;
  let utilityShare = 4550;
  let seatRent = 3500;
  let otherExpenseShare = 0;
  let totalPaid = 12000;
  let balance = 0;
  let paymentHistory: any[] = [];
  let utilityDetails = {
    buaBill: 300,
    electricity: 300,
    gas: 150,
    water: 100,
    internet: 150,
    waste: 50,
  };

  try {
    const dbMember = session?.user.id ? await getMemberByUserId(session.user.id) : null;
    if (dbMember) {
      member = dbMember;
      seatRent = Number(dbMember.seatRent) || 0;

      const totalMembers = (await prisma.memberProfile.count({ where: { isActive: true } })) || 7;
      const calcMealRate = await calculateMealRate(month, year);
      mealRate = calcMealRate;

      const [
        guestData,
        utilityData,
        otherCost,
        paymentsList,
        paidAgg,
        rawUtilityBills,
      ] = await Promise.all([
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
      const foodData = await calculateMemberFoodCost(member.id, month, year, mealRate);
      foodCost = foodData.foodCost;
      totalMeals = foodData.totalMeals;
      guestMealCost = guestData.guestMealCost;
      totalGuestMeals = guestData.totalGuestMeals;
      utilityShare = utilityData.perMemberShare;
      otherExpenseShare = otherCost;
      totalPaid = Number(paidAgg._sum.amount) || 0;
      paymentHistory = paymentsList;

      // Extract specific utility breakdowns
      const billByType: Record<string, number> = {};
      for (const b of rawUtilityBills) {
        billByType[b.type] = Number(b.amount) || 0;
      }
      utilityDetails = {
        buaBill: Math.round((billByType["COOK"] || 2100) / totalMembers),
        electricity: Math.round((billByType["ELECTRICITY"] || 2100) / totalMembers),
        gas: Math.round((billByType["GAS"] || 1050) / totalMembers),
        water: Math.round((billByType["WATER"] || 700) / totalMembers),
        internet: Math.round((billByType["INTERNET"] || 1050) / totalMembers),
        waste: Math.round((billByType["WASTE"] || 350) / totalMembers),
      };

      const totalCost = foodCost + guestMealCost + utilityShare + seatRent + otherExpenseShare;
      balance = Math.round((totalPaid - totalCost) * 100) / 100;
    }
  } catch (err) {
    console.error("MyProfile error:", err);
  }

  const T = await getServerT();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={T.profile.title}
        description={T.profile.description}
      />

      <PersonalBalanceSheet
        member={member}
        totalPaid={totalPaid}
        totalMeals={totalMeals}
        mealRate={mealRate}
        foodCost={foodCost}
        guestMealCost={guestMealCost}
        totalGuestMeals={totalGuestMeals}
        utilityShare={utilityShare}
        utilityDetails={utilityDetails}
        seatRent={seatRent}
        otherExpenseShare={otherExpenseShare}
        balance={balance}
        paymentHistory={paymentHistory}
        month={month}
        year={year}
      />
    </div>
  );
}
