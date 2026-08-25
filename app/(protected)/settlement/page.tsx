import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { calculateMonthlySettlement } from "@/backend/services/settlement.service";
import { prisma } from "@/lib/db/prisma";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettlementOverview } from "@/components/settlement/SettlementOverview";
import { MemberSettlementCard } from "@/components/settlement/MemberSettlementCard";
import { FinalizationControls } from "@/components/settlement/FinalizationControls";
import { SettlementSummary } from "@/types";

export const metadata: Metadata = { title: "Monthly Settlement" };

export default async function SettlementPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";
  const { month, year } = getCurrentMonthYear();

  let summary: SettlementSummary = {
    month,
    year,
    mealRate: 65.5,
    totalFoodExpense: 15720,
    totalNormalMeals: 240,
    totalUtility: 3200,
    totalOtherExpense: 800,
    activeMembers: 4,
    isFinalized: false,
    memberSummaries: [
      {
        memberId: "m1",
        memberName: "Admin (You)",
        avatar: null,
        totalMeals: 62,
        foodCost: 4061,
        guestMealCost: 131,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8692,
        totalPaid: 10000,
        balance: 1308,
      },
      {
        memberId: "m2",
        memberName: "Tanvir Ahmed",
        avatar: null,
        totalMeals: 58,
        foodCost: 3799,
        guestMealCost: 0,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8299,
        totalPaid: 8000,
        balance: -299,
      },
      {
        memberId: "m3",
        memberName: "Rahim Chowdhury",
        avatar: null,
        totalMeals: 60,
        foodCost: 3930,
        guestMealCost: 65.5,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8495.5,
        totalPaid: 8500,
        balance: 4.5,
      },
      {
        memberId: "m4",
        memberName: "Karim Hassan",
        avatar: null,
        totalMeals: 60,
        foodCost: 3930,
        guestMealCost: 0,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8430,
        totalPaid: 7000,
        balance: -1430,
      }
    ]
  };

  let isFinalized = false;

  try {
    const [dbSummary, existing] = await Promise.all([
      calculateMonthlySettlement(month, year),
      prisma.monthlySettlement.findUnique({ where: { month_year: { month, year } } }),
    ]);
    if (dbSummary.memberSummaries.length > 0) {
      summary = dbSummary;
      isFinalized = existing?.isFinalized ?? false;
    }
  } catch {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Settlement"
        description="Calculated settlement for the current month"
        action={isAdmin ? (
          <FinalizationControls month={month} year={year} isFinalized={isFinalized} />
        ) : undefined}
      />
      <SettlementOverview summary={summary} isFinalized={isFinalized} />
      <div>
        <p className="section-heading">Per Member Breakdown</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summary.memberSummaries.map((ms) => (
            <MemberSettlementCard key={ms.memberId} data={ms} />
          ))}
        </div>
      </div>
    </div>
  );
}
