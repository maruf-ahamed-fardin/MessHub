import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getPayments } from "@/backend/payments/payment.repository";
import { getExpenses } from "@/backend/expenses/expense.repository";
import { getBazarList } from "@/backend/bazar/bazar.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { MoneyTransactionHub } from "@/components/payments/MoneyTransactionHub";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Money Transaction" };

export default async function PaymentsPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";
  const { month, year } = getCurrentMonthYear();

  const [payments, expenses, bazars, members] = await Promise.all([
    getPayments(undefined, month, year),
    getExpenses(month, year),
    getBazarList(month, year),
    getAllMembers(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pages.payments.title}
        description={T.pages.payments.description}
      />

      <MoneyTransactionHub
        payments={payments}
        expenses={expenses}
        bazars={bazars}
        members={members}
        isAdmin={isAdmin}
        currentUserId={session?.user.id ?? "admin-user"}
      />
    </div>
  );
}
