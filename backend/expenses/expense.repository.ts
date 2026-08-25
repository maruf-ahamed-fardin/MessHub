import { prisma } from "@/lib/db/prisma";
import { isMonthFinalized } from "@/backend/services/settlement.service";
import { getMonthRange } from "@/lib/utils/date";

export async function getExpenses(month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);
  return prisma.expense.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: { paidBy: { include: { user: { select: { name: true, image: true } } } } },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(data: {
  title: string;
  category: string;
  amount: number;
  date: Date;
  paidById: string;
  sharingMethod: string;
  selectedMemberIds?: string[];
  note?: string;
  receiptUrl?: string;
}) {
  const month = data.date.getMonth() + 1;
  const year = data.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Expenses cannot be added.");
  }

  const selectedStr = Array.isArray(data.selectedMemberIds) ? data.selectedMemberIds.join(",") : "";

  return prisma.expense.create({
    data: {
      title: data.title,
      category: data.category as any,
      amount: data.amount,
      date: data.date,
      paidById: data.paidById,
      sharingMethod: data.sharingMethod as any,
      selectedMemberIds: selectedStr,
      note: data.note,
      receiptUrl: data.receiptUrl,
    },
  });
}

export async function deleteExpense(id: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error("Expense not found.");
  const month = expense.date.getMonth() + 1;
  const year = expense.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Expenses cannot be deleted.");
  }
  return prisma.expense.delete({ where: { id } });
}

export async function getUtilityBills(month: number, year: number) {
  return prisma.utilityBill.findMany({
    where: { month, year },
    orderBy: { type: "asc" },
  });
}

export async function upsertUtilityBill(data: {
  type: string;
  amount: number;
  month: number;
  year: number;
  date: Date;
  note?: string;
}) {
  return prisma.utilityBill.upsert({
    where: { type_month_year: { type: data.type as any, month: data.month, year: data.year } },
    create: {
      type: data.type as any,
      amount: data.amount,
      month: data.month,
      year: data.year,
      date: data.date,
      note: data.note,
    },
    update: {
      amount: data.amount,
      date: data.date,
      note: data.note,
    },
  });
}
