import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getCleaningTasks } from "@/backend/cleaning/cleaning.repository";
import { getMaintenanceReports } from "@/backend/maintenance/maintenance.repository";
import { getShoppingItems } from "@/backend/shopping/shopping.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getMonthlyHouseExpense } from "@/backend/services/expense-calculation.service";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { HouseHub } from "@/components/house/HouseHub";

export const metadata: Metadata = { title: "House & Tasks" };

export default async function HousePage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";
  const { month, year } = getCurrentMonthYear();

  const [cleaningTasks, maintenanceReports, shoppingItems, members, monthlyHouseCost] = await Promise.all([
    getCleaningTasks(),
    getMaintenanceReports(),
    getShoppingItems(),
    getAllMembers(),
    getMonthlyHouseExpense(month, year),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="House Management"
        description="ক্লিনিং শিডিউল, মেরামত খরচ ও শেয়ার্ড শপিং লিস্ট"
      />

      <HouseHub
        cleaningTasks={cleaningTasks}
        maintenanceReports={maintenanceReports}
        shoppingItems={shoppingItems}
        members={members}
        isAdmin={isAdmin}
        currentMemberId={session?.user.memberId ?? null}
        monthlyHouseCost={monthlyHouseCost}
      />
    </div>
  );
}
