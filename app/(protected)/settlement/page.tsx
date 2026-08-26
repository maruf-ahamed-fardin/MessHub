import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { calculateMonthlySettlement } from "@/backend/services/settlement.service";
import { getMonthlyMealAnalytics } from "@/backend/services/meal-calculation.service";
import { prisma } from "@/lib/db/prisma";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettlementOverview } from "@/components/settlement/SettlementOverview";
import { MySettlementSummaryCard } from "@/components/settlement/MySettlementSummaryCard";
import { MemberSettlementList } from "@/components/settlement/MemberSettlementList";
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
  let currentMemberId = session?.user.memberId ?? null;

  try {
    if (!currentMemberId && session?.user.id) {
      const profile = await prisma.memberProfile.findUnique({ where: { userId: session.user.id } });
      currentMemberId = profile?.id ?? null;
    }

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

  // Resolve user's personal summary
  const mySummary =
    summary.memberSummaries.find((ms) => ms.memberId === currentMemberId) ||
    summary.memberSummaries[0] ||
    null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={T.pages.settlement.title}
        description={T.pages.settlement.description}
        action={isAdmin ? (
          <FinalizationControls month={month} year={year} isFinalized={isFinalized} />
        ) : undefined}
      />

      {/* 1. Hero Card: User's Personal Settlement Status (Refund vs Due) */}
      <MySettlementSummaryCard mySummary={mySummary} mealRate={summary.mealRate} />

      {/* 2. Overview of the whole mess */}
      <SettlementOverview summary={summary} isFinalized={isFinalized} />

      {/* 3. Detailed Meal & Bazar Analytics */}
      {mealAnalytics && (
        <div className="pt-1">
          <MonthlyMealAnalyticsSheet
            analytics={mealAnalytics}
            currentMemberId={currentMemberId}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* 4. Members Breakdown Cards with Search & Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-heading mb-0">
            {T.pages.settlement.perMember}
          </h3>
        </div>
        <MemberSettlementList
          memberSummaries={summary.memberSummaries}
          currentMemberId={currentMemberId}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}

