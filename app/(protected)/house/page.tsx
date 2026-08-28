import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { getCleaningTasks } from "@/backend/cleaning/cleaning.repository";
import { getMaintenanceReports } from "@/backend/maintenance/maintenance.repository";
import { getShoppingItems } from "@/backend/shopping/shopping.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getMonthlyHouseExpense } from "@/backend/services/expense-calculation.service";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { HouseHub } from "@/components/house/HouseHub";
import { getServerT } from "@/lib/i18n/serverT";

import { getCookAttendanceStats } from "@/backend/house/cook-attendance.repository";

export const metadata: Metadata = { title: "House & Tasks" };

export default async function HousePage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";
  const { month, year } = getCurrentMonthYear();

  const [cleaningTasks, maintenanceReports, shoppingItems, members, monthlyHouseCost, cookStats] = await Promise.all([
    getCleaningTasks(),
    getMaintenanceReports(),
    getShoppingItems(),
    getAllMembers(),
    getMonthlyHouseExpense(month, year),
    getCookAttendanceStats(month, year),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={T.pages.house.title}
        description={T.pages.house.description}
      />

      <Suspense fallback={<div className="py-20 text-center text-xs text-muted-foreground">{T.pages.house.loading}</div>}>
        <HouseHub
          cleaningTasks={cleaningTasks}
          maintenanceReports={maintenanceReports}
          shoppingItems={shoppingItems}
          members={members}
          isAdmin={isAdmin}
          currentMemberId={session?.user.memberId ?? null}
          monthlyHouseCost={monthlyHouseCost}
          cookStats={cookStats}
        />
      </Suspense>
    </div>
  );
}
