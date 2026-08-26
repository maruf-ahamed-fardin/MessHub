import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getExpenses, getUtilityBills } from "@/backend/expenses/expense.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { ExpensesTabContainer } from "@/components/expenses/ExpensesTabContainer";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Expenses & Utilities" };

export default async function ExpensesPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
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
        title={T.pages.expenses.title}
        description={T.pages.expenses.description}
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
