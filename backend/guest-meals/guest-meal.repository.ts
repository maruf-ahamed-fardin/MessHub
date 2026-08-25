import { prisma } from "@/lib/db/prisma";
import { isMonthFinalized } from "@/backend/services/settlement.service";

export async function getGuestMealsForDate(date: Date) {
  return prisma.guestMeal.findMany({
    where: { date },
    include: {
      member: { include: { user: { select: { name: true, image: true } } } },
      addedBy: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGuestMealsForMonth(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return prisma.guestMeal.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: {
      member: { include: { user: { select: { name: true, image: true } } } },
      addedBy: { include: { user: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createGuestMeal(data: {
  memberId: string;
  addedById: string;
  guestName: string;
  date: Date;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  quantity: number;
  note?: string;
}) {
  const month = data.date.getMonth() + 1;
  const year = data.date.getFullYear();
  const finalized = await isMonthFinalized(month, year);
  if (finalized) {
    throw new Error("This month is finalized. Guest meals cannot be added.");
  }
  if (data.quantity <= 0) throw new Error("Guest meal quantity must be greater than zero.");

  return prisma.guestMeal.create({ data });
}

export async function deleteGuestMeal(id: string) {
  const gm = await prisma.guestMeal.findUnique({ where: { id } });
  if (!gm) throw new Error("Guest meal not found.");

  const finalized = await isMonthFinalized(
    gm.date.getMonth() + 1,
    gm.date.getFullYear()
  );
  if (finalized) throw new Error("This month is finalized. Guest meals cannot be deleted.");

  return prisma.guestMeal.delete({ where: { id } });
}
