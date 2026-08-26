import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getBazarList, getProducts } from "@/backend/bazar/bazar.repository";
import { getWeeklyBazarSchedule } from "@/backend/bazar/bazar-schedule.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear, formatMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddBazarDialog } from "@/components/bazar/AddBazarDialog";
import { BazarScheduleSection } from "@/components/bazar/BazarScheduleSection";
import { BazarExplorer } from "@/components/bazar/BazarExplorer";
import { SettlementMonthSelector } from "@/components/settlement/SettlementMonthSelector";
import { toNumber } from "@/backend/services/meal-calculation.service";
import { formatCurrency } from "@/lib/utils/currency";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Bazar" };

interface BazarPageProps {
  searchParams?: Promise<{ month?: string; year?: string }>;
}

export default async function BazarPage({ searchParams }: BazarPageProps) {
  const [session, T, rawParams] = await Promise.all([
    auth(),
    getServerT(),
    searchParams ? searchParams : Promise.resolve({} as { month?: string; year?: string }),
  ]);
  const { month: currMonth, year: currYear } = getCurrentMonthYear();
  const isAdmin = session?.user.role === "ADMIN";

  const month = rawParams.month ? Math.max(1, Math.min(12, parseInt(rawParams.month, 10))) : currMonth;
  const year = rawParams.year ? parseInt(rawParams.year, 10) : currYear;
  const isCurrentMonth = month === currMonth && year === currYear;

  const [bazarList, products, members, schedules, pendingSwaps] = await Promise.all([
    getBazarList(month, year),
    getProducts(),
    getAllMembers(),
    getWeeklyBazarSchedule(),
    import("@/backend/bazar/bazar-schedule.repository").then((m) => m.getPendingBazarSwapRequests()),
  ]);

  const totalAmount = bazarList.reduce((sum, b) => sum + toNumber(b.totalAmount), 0);
  const currentMemberId = session?.user.memberId ?? members[0]?.id ?? "admin-user";

  return (
    <div className="space-y-6">
      <PageHeader
        title={T.pages.bazar.title}
        description={
          isCurrentMonth
            ? `${T.pages.bazar.description}: ${formatCurrency(totalAmount)}`
            : `${formatMonthYear(month, year)} - এর সংরক্ষিত বাজার খরচ: ${formatCurrency(totalAmount)}`
        }
        action={
          <SettlementMonthSelector
            selectedMonth={month}
            selectedYear={year}
            baseUrl="/bazar"
          />
        }
      />

      {/* Side-by-Side 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Side Column: 7-Member Bazar Schedule & Duty Roster */}
        <div className="lg:col-span-4 lg:sticky lg:top-20">
          <BazarScheduleSection
            schedules={schedules}
            members={members}
            isAdmin={isAdmin}
            currentMemberId={currentMemberId}
            pendingSwaps={pendingSwaps}
          />
        </div>

        {/* Right / Main Column: Interactive Mini Calendar + Daily Bazar Receipts */}
        <div className="lg:col-span-8 space-y-3">
          <BazarExplorer
            items={bazarList}
            products={products}
            members={members}
            month={month}
            year={year}
            isAdmin={isAdmin}
            currentMemberId={currentMemberId}
          />
        </div>
      </div>
    </div>
  );
}

