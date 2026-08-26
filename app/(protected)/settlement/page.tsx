import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { calculateMonthlySettlement } from "@/backend/services/settlement.service";
import { getMonthlyMealAnalytics } from "@/backend/services/meal-calculation.service";
import { prisma } from "@/lib/db/prisma";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettlementOverview } from "@/components/settlement/SettlementOverview";
import { MemberSettlementCard } from "@/components/settlement/MemberSettlementCard";
import { FinalizationControls } from "@/components/settlement/FinalizationControls";
import { MonthlyMealAnalyticsSheet } from "@/components/meals/MonthlyMealAnalyticsSheet";
import { SettlementSummary } from "@/types";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Monthly Settlement" };

export default async function SettlementPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";
  const { month, year } = getCurrentMonthYear();

  let summary: SettlementSummary = {
    month,
    year,
    mealRate: 65.5,
    totalFoodExpense: 15720,
    totalNormalMeals: 240,
    totalGuestMeals: 0,
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
        memberName: "Rahim Chowdhury",
        avatar: null,
        totalMeals: 58,
        foodCost: 3799,
        guestMealCost: 0,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8299,
        totalPaid: 8500,
        balance: 201,
      },
      {
        memberId: "m3",
        memberName: "Karim Ahmed",
        avatar: null,
        totalMeals: 60,
        foodCost: 3930,
        guestMealCost: 65.5,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8495.5,
        totalPaid: 8000,
        balance: -495.5,
      },
      {
        memberId: "m4",
        memberName: "Tanvir Hasan",
        avatar: null,
        totalMeals: 60,
        foodCost: 3930,
        guestMealCost: 0,
        utilityCost: 800,
        seatRent: 3500,
        otherCost: 200,
        totalCost: 8430,
        totalPaid: 8000,
        balance: -430,
      },
    ],
  };

  let isFinalized = false;
  let mealAnalytics: any = null;

  try {
    const [dbSummary, existing, analytics] = await Promise.all([
      calculateMonthlySettlement(month, year),
      prisma.monthlySettlement.findUnique({ where: { month_year: { month, year } } }),
      getMonthlyMealAnalytics(month, year),
    ]);
    mealAnalytics = analytics;
    if (dbSummary.memberSummaries.length > 0) {
      summary = dbSummary;
      isFinalized = existing?.isFinalized ?? false;
    }
  } catch {}

  return (
    <div className="space-y-6">
      <PageHeader
        title={T.pages.settlement.title}
        description={T.pages.settlement.description}
        action={isAdmin ? (
          <FinalizationControls month={month} year={year} isFinalized={isFinalized} />
        ) : undefined}
      />
      <SettlementOverview summary={summary} isFinalized={isFinalized} />

      {mealAnalytics && (
        <div className="pt-2">
          <MonthlyMealAnalyticsSheet analytics={mealAnalytics} />
        </div>
      )}

      <div>
        <p className="section-heading">{T.pages.settlement.perMember}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summary.memberSummaries.map((ms) => (
            <MemberSettlementCard key={ms.memberId} data={ms} />
          ))}
        </div>
      </div>
    </div>
  );
}
