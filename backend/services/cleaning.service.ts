import { prisma } from "@/lib/db/prisma";
import { addDays } from "date-fns";

const RECURRENCE_DAYS: Record<string, number> = {
  DAILY: 1,
  EVERY_2_DAYS: 2,
  EVERY_3_DAYS: 3,
  WEEKLY: 7,
};

/**
 * Generate the next due date for a recurring cleaning task.
 */
export function generateNextCleaningDate(
  currentDueDate: Date,
  recurrence: string,
  customInterval?: number | null
): Date {
  if (recurrence === "CUSTOM" && customInterval) {
    return addDays(currentDueDate, customInterval);
  }
  const days = RECURRENCE_DAYS[recurrence] ?? 1;
  return addDays(currentDueDate, days);
}

/**
 * Complete a cleaning task and create the next one if it has a recurrence.
 */
export async function completeCleaningTask(taskId: string, memberId: string): Promise<void> {
  const task = await prisma.cleaningTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Cleaning task not found.");

  await prisma.cleaningTask.update({
    where: { id: taskId },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
  });

  // If recurring, create the next task
  if (task.recurrence) {
    const nextDate = generateNextCleaningDate(
      task.dueDate,
      task.recurrence,
      task.recurrenceInterval
    );

    await prisma.cleaningTask.create({
      data: {
        title: task.title,
        location: task.location,
        assignedMemberId: task.assignedMemberId,
        dueDate: nextDate,
        status: "PENDING",
        recurrence: task.recurrence,
        recurrenceInterval: task.recurrenceInterval,
        note: task.note,
      },
    });
  }
}
