import { prisma } from "@/lib/db/prisma";
import { isMonthFinalized } from "@/backend/services/settlement.service";
import { getMonthRange } from "@/lib/utils/date";

export async function getMealForDate(memberId: string, date: Date) {
  return prisma.meal.findUnique({
    where: { memberId_date: { memberId, date } },
  });
}

export async function getMealsForMonth(memberId: string, month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);

  return prisma.meal.findMany({
    where: { memberId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });
}

export async function getAllMealsForDate(date: Date) {
  return prisma.meal.findMany({
    where: { date },
    include: {
      member: { include: { user: { select: { name: true, image: true } } } },
    },
    orderBy: { member: { user: { name: "asc" } } },
  });
}

export async function upsertMeal(data: {
  memberId: string;
  date: Date;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  note?: string;
}) {
  // Check if month is finalized (members cannot edit)
  const month = data.date.getMonth() + 1;
  const year = data.date.getFullYear();
  const finalized = await isMonthFinalized(month, year);
  if (finalized) {
    throw new Error("This month is finalized. Meals cannot be modified.");
  }

  return prisma.meal.upsert({
    where: { memberId_date: { memberId: data.memberId, date: data.date } },
    create: {
      memberId: data.memberId,
      date: data.date,
      breakfast: data.breakfast ?? true,
      lunch: data.lunch ?? true,
      dinner: data.dinner ?? true,
      note: data.note,
    },
    update: {
      breakfast: data.breakfast ?? true,
      lunch: data.lunch ?? true,
      dinner: data.dinner ?? true,
      note: data.note,
    },
  });
}

export async function getMealsCalendar(month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);

  const meals = await prisma.meal.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: {
      member: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ date: "asc" }, { member: { user: { name: "asc" } } }],
  });

  // Group by date
  const byDate: Record<string, typeof meals> = {};
  for (const meal of meals) {
    const key = meal.date.toISOString().split("T")[0];
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(meal);
  }
  return byDate;
}
