import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getBazarList, getProducts } from "@/backend/bazar/bazar.repository";
import { getWeeklyBazarSchedule } from "@/backend/bazar/bazar-schedule.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddBazarDialog } from "@/components/bazar/AddBazarDialog";
import { BazarScheduleSection } from "@/components/bazar/BazarScheduleSection";
import { BazarExplorer } from "@/components/bazar/BazarExplorer";
import { toNumber } from "@/backend/services/meal-calculation.service";
import { formatCurrency } from "@/lib/utils/currency";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Bazar" };

export default async function BazarPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const { month, year } = getCurrentMonthYear();
  const isAdmin = session?.user.role === "ADMIN";

  const [bazarList, products, members, schedules] = await Promise.all([
    getBazarList(month, year),
    getProducts(),
    getAllMembers(),
    getWeeklyBazarSchedule(),
  ]);

  const totalAmount = bazarList.reduce((sum, b) => sum + toNumber(b.totalAmount), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={T.pages.bazar.title}
        description={`${T.pages.bazar.description}: ${formatCurrency(totalAmount)}`}
        action={
          <AddBazarDialog
            products={products}
            members={members}
            currentMemberId={session?.user.memberId ?? "member-admin"}
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
            currentMemberId={session?.user.memberId ?? "member-admin"}
          />
        </div>
      </div>
    </div>
  );
}
