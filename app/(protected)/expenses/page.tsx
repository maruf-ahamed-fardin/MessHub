import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getExpenses, getUtilityBills } from "@/backend/expenses/expense.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { ExpensesTabContainer } from "@/components/expenses/ExpensesTabContainer";

export const metadata: Metadata = { title: "Expenses & Utilities" };

export default async function ExpensesPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";
  const { month, year } = getCurrentMonthYear();

  const [expenses, utilities, members] = await Promise.all([
    getExpenses(month, year),
    getUtilityBills(month, year),
    getAllMembers(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses & Utilities"
        description="বাসা ভাড়া, কারেন্ট, গ্যাস, পানি, ইন্টারনেট বিল ও ৭ জনের সমান বণ্টন"
        action={isAdmin ? <AddExpenseDialog members={members} /> : undefined}
      />

      <ExpensesTabContainer
        expenses={expenses}
        utilities={utilities}
        members={members}
        month={month}
        year={year}
        isAdmin={isAdmin}
      />
    </div>
  );
}
