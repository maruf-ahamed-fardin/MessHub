"use server";

import { upsertCookAttendance, getCookAttendanceStats } from "@/backend/house/cook-attendance.repository";
import { requireAdmin } from "@/backend/permissions/permission.service";
import { revalidatePath } from "next/cache";

export async function recordCookAttendanceAction(data: {
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "OVERTIME";
  note?: string;
  deduction?: number;
}) {
  try {
    await requireAdmin();
    const [y, m, d] = data.date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    await upsertCookAttendance(dateObj, data.status, data.note, data.deduction);
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error recording cook attendance:", err);
    return { success: false, error: err?.message || "Failed to record cook attendance" };
  }
}
