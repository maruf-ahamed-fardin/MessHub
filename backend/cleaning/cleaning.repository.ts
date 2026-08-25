import { prisma } from "@/lib/db/prisma";

export async function getCleaningTasks(upcoming = false) {
  const where = upcoming ? { status: "PENDING" as const } : {};
  return prisma.cleaningTask.findMany({
    where,
    include: {
      assignedMember: { include: { user: { select: { name: true, image: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function createCleaningTask(data: {
  title: string;
  location: string;
  assignedMemberId: string;
  dueDate: Date;
  recurrence?: string;
  recurrenceInterval?: number;
  note?: string;
}) {
  return prisma.cleaningTask.create({
    data: {
      title: data.title,
      location: data.location,
      assignedMemberId: data.assignedMemberId,
      dueDate: data.dueDate,
      recurrence: data.recurrence as any,
      recurrenceInterval: data.recurrenceInterval,
      note: data.note,
      status: "PENDING",
    },
  });
}

export async function updateCleaningTaskStatus(id: string, status: string) {
  return prisma.cleaningTask.update({
    where: { id },
    data: {
      status: status as any,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
}

export async function getHouseholdTasks(upcoming = false) {
  const where = upcoming ? { status: "PENDING" as const } : {};
  return prisma.householdTask.findMany({
    where,
    include: {
      assignedMember: { include: { user: { select: { name: true, image: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });
}

export async function createHouseholdTask(data: {
  title: string;
  category: string;
  assignedMemberId: string;
  dueDate: Date;
  note?: string;
}) {
  return prisma.householdTask.create({ data: { ...data, status: "PENDING" } });
}

export async function updateHouseholdTaskStatus(id: string, status: string) {
  return prisma.householdTask.update({
    where: { id },
    data: { status: status as any, completedAt: status === "DONE" ? new Date() : null },
  });
}
