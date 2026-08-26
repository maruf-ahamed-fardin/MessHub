import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getPayments } from "@/backend/payments/payment.repository";
import { getExpenses, getUtilityBills } from "@/backend/expenses/expense.repository";
import { getBazarList } from "@/backend/bazar/bazar.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear, formatMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { MoneyTransactionHub } from "@/components/payments/MoneyTransactionHub";
import { SettlementMonthSelector } from "@/components/settlement/SettlementMonthSelector";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Money Transaction" };

interface PaymentsPageProps {
  searchParams?: Promise<{ month?: string; year?: string }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
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

  const [payments, expenses, bazars, members, utilityBills] = await Promise.all([
    getPayments(undefined, month, year),
    getExpenses(month, year),
    getBazarList(month, year),
    getAllMembers(),
    getUtilityBills(month, year),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pages.payments.title}
        description={
          isCurrentMonth
            ? T.pages.payments.description
            : `${formatMonthYear(month, year)} - এর সংরক্ষিত লেনদেন ও মেস ফান্ড রেকর্ড`
        }
        action={
          <SettlementMonthSelector
            selectedMonth={month}
            selectedYear={year}
            baseUrl="/payments"
          />
        }
      />

      <MoneyTransactionHub
        payments={payments}
        expenses={expenses}
        bazars={bazars}
        members={members}
        utilityBills={utilityBills}
        isAdmin={isAdmin}
        currentUserId={session?.user.id ?? "admin-user"}
        selectedMonth={month}
        selectedYear={year}
      />
    </div>
  );
}

