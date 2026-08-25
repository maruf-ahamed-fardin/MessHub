import { prisma } from "@/lib/db/prisma";
import { isMonthFinalized } from "@/backend/services/settlement.service";
import { getMonthRange } from "@/lib/utils/date";

export async function getPayments(memberId?: string, month?: number, year?: number) {
  const where: any = {};
  if (memberId) where.memberId = memberId;
  if (month && year) {
    const { startDate, endDate } = getMonthRange(month, year);
    where.date = { gte: startDate, lte: endDate };
  }

  return prisma.payment.findMany({
    where,
    include: {
      member: { include: { user: { select: { name: true, image: true } } } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createPayment(data: {
  memberId: string;
  amount: number;
  date: Date;
  method: string;
  note?: string;
  recordedById: string;
}) {
  if (data.amount <= 0) throw new Error("Payment amount must be greater than zero.");

  const month = data.date.getMonth() + 1;
  const year = data.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Payments cannot be added for this period.");
  }

  return prisma.payment.create({
    data: {
      memberId: data.memberId,
      amount: data.amount,
      date: data.date,
      method: data.method as any,
      note: data.note,
      recordedById: data.recordedById,
    },
  });
}

export async function deletePayment(id: string) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new Error("Payment not found.");
  const month = payment.date.getMonth() + 1;
  const year = payment.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Payments cannot be deleted.");
  }
  return prisma.payment.delete({ where: { id } });
}
