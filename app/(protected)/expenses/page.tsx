import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getExpenses, getUtilityBills } from "@/backend/expenses/expense.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear, formatMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { ExpensesTabContainer } from "@/components/expenses/ExpensesTabContainer";
import { SettlementMonthSelector } from "@/components/settlement/SettlementMonthSelector";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Expenses & Utilities" };

interface ExpensesPageProps {
  searchParams?: Promise<{ month?: string; year?: string }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const [session, T, rawParams] = await Promise.all([
    auth(),
    getServerT(),
    searchParams ? searchParams : Promise.resolve({} as { month?: string; year?: string }),
  ]);
  const isAdmin = session?.user.role === "ADMIN";
  const { month: currMonth, year: currYear } = getCurrentMonthYear();

  const month = rawParams.month ? Math.max(1, Math.min(12, parseInt(rawParams.month, 10))) : currMonth;
  const year = rawParams.year ? parseInt(rawParams.year, 10) : currYear;
  const isCurrentMonth = month === currMonth && year === currYear;

  const [expenses, utilities, members] = await Promise.all([
    getExpenses(month, year),
    getUtilityBills(month, year),
    getAllMembers(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pages.expenses.title}
        description={
          isCurrentMonth
            ? T.pages.expenses.description
            : `${formatMonthYear(month, year)} - এর সংরক্ষিত ইউটিলিটি ও মেস খরচের হিসাব`
        }
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <SettlementMonthSelector
              selectedMonth={month}
              selectedYear={year}
              baseUrl="/expenses"
            />
            {isAdmin && <AddExpenseDialog members={members} />}
          </div>
        }
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

