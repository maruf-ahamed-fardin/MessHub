import { getPrisma } from "@/lib/db/prisma";
import { getMonthRange } from "@/lib/utils/date";

export async function getCookAttendancesForMonth(month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);
  const db = getPrisma();
  return db.cookAttendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function upsertCookAttendance(
  date: Date,
  status: "PRESENT" | "ABSENT" | "LEAVE" | "OVERTIME",
  note?: string,
  deduction: number = 0
) {
  const db = getPrisma();
  // Normalize date to UTC midnight
  const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  return db.cookAttendance.upsert({
    where: { date: normalizedDate },
    create: {
      date: normalizedDate,
      status,
      note,
      deduction,
    },
    update: {
      status,
      note,
      deduction,
    },
  });
}

export async function getCookAttendanceStats(month: number, year: number, baseSalary: number = 2500) {
  const records = await getCookAttendancesForMonth(month, year);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let overtimeCount = 0;
  let totalDeduction = 0;

  const perDayRate = baseSalary / totalDaysInMonth;

  for (const r of records) {
    if (r.status === "PRESENT") presentCount++;
    else if (r.status === "ABSENT") {
      absentCount++;
      totalDeduction += r.deduction || perDayRate;
    } else if (r.status === "LEAVE") leaveCount++;
    else if (r.status === "OVERTIME") overtimeCount++;
  }

  const netPayable = Math.max(0, Math.round(baseSalary - totalDeduction));

  return {
    month,
    year,
    totalDaysInMonth,
    presentCount,
    absentCount,
    leaveCount,
    overtimeCount,
    baseSalary,
    totalDeduction: Math.round(totalDeduction),
    netPayable,
    records,
  };
}
