import { prisma } from "@/lib/db/prisma";

export async function getWeeklyBazarSchedule() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const next7Days = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 7));

  return prisma.bazarSchedule.findMany({
    where: {
      date: { gte: today, lte: next7Days },
    },
    include: {
      member: {
        include: {
          user: { select: { name: true, image: true } },
          seat: { include: { room: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function updateBazarSchedule(id: string, memberId: string, note?: string) {
  return prisma.bazarSchedule.update({
    where: { id },
    data: {
      memberId,
      note,
      status: "SWAPPED",
    },
  });
}

export async function assignBazarSchedule(data: {
  date: Date;
  memberId: string;
  dayName?: string;
  note?: string;
}) {
  return prisma.bazarSchedule.upsert({
    where: { date: data.date },
    create: {
      date: data.date,
      memberId: data.memberId,
      dayName: data.dayName,
      note: data.note,
      status: "PENDING",
    },
    update: {
      memberId: data.memberId,
      dayName: data.dayName,
      note: data.note,
    },
  });
}
