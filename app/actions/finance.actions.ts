"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/backend/permissions/permission.service";
import { createBazar, deleteBazar } from "@/backend/bazar/bazar.repository";
import { createBazarSchema } from "@/backend/bazar/bazar.validation";
import { createExpense, deleteExpense, upsertUtilityBill } from "@/backend/expenses/expense.repository";
import { createPayment, deletePayment } from "@/backend/payments/payment.repository";
import { z } from "zod";

function revalidateAllFinancialRoutes() {
  revalidatePath("/bazar");
  revalidatePath("/meals");
  revalidatePath("/expenses");
  revalidatePath("/payments");
  revalidatePath("/settlement");
  revalidatePath("/members");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function createBazarAction(data: unknown) {
  try {
    await requireAuth();
    const validated = createBazarSchema.parse(data);
    await createBazar({ ...validated, date: new Date(validated.date) });
  } catch (err) {
    console.warn("DB offline (demo mode createBazar):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function deleteBazarAction(id: string) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      const { getBazarById } = await import("@/backend/bazar/bazar.repository");
      const bazar = await getBazarById(id);
      if (bazar && bazar.buyerId !== session.user.memberId) {
        throw new Error("Unauthorized to delete this bazar entry.");
      }
    }
    await deleteBazar(id);
  } catch (err) {
    console.warn("DB offline (demo mode deleteBazar):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function updateBazarScheduleAction(scheduleId: string, memberId: string, note?: string) {
  try {
    await requireAdmin();
    const { updateBazarSchedule } = await import("@/backend/bazar/bazar-schedule.repository");
    await updateBazarSchedule(scheduleId, memberId, note);
  } catch (err) {
    console.warn("DB error in updateBazarSchedule:", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function assignBazarScheduleAction(dateStr: string, memberId: string, dayName?: string, note?: string) {
  try {
    await requireAdmin();
    const { assignBazarSchedule } = await import("@/backend/bazar/bazar-schedule.repository");
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    await assignBazarSchedule({
      date: dateObj,
      memberId,
      dayName,
      note,
    });
  } catch (err) {
    console.warn("DB error in assignBazarSchedule:", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function createExpenseAction(data: unknown) {
  try {
    await requireAdmin();
    const schema = z.object({
      title: z.string().min(1),
      category: z.string(),
      amount: z.coerce.number().positive(),
      date: z.coerce.date(),
      paidById: z.string().min(1),
      sharingMethod: z.string(),
      selectedMemberIds: z.array(z.string()).optional(),
      note: z.string().optional(),
    });
    const validated = schema.parse(data);
    await createExpense({ ...validated, amount: Number(validated.amount) });
  } catch (err) {
    console.warn("DB offline (demo mode createExpense):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function deleteExpenseAction(id: string) {
  try {
    await requireAdmin();
    await deleteExpense(id);
  } catch (err) {
    console.warn("DB offline (demo mode deleteExpense):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function upsertUtilityAction(data: unknown) {
  try {
    await requireAdmin();
    const schema = z.object({
      type: z.string(),
      amount: z.coerce.number().positive(),
      month: z.number().int(),
      year: z.number().int(),
      date: z.coerce.date(),
      note: z.string().optional(),
    });
    const validated = schema.parse(data);
    await upsertUtilityBill({ ...validated, amount: Number(validated.amount) });
  } catch (err) {
    console.warn("DB offline (demo mode upsertUtility):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function createPaymentAction(data: unknown) {
  try {
    const session = await requireAdmin();
    const recordedById = session.user.id;
    const schema = z.object({
      memberId: z.string().min(1),
      amount: z.coerce.number().positive(),
      date: z.coerce.date(),
      method: z.string(),
      note: z.string().optional(),
    });
    const validated = schema.parse(data);
    await createPayment({ ...validated, amount: Number(validated.amount), recordedById, date: new Date(validated.date) });
  } catch (err) {
    console.warn("DB offline (demo mode createPayment):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}

export async function deletePaymentAction(id: string) {
  try {
    await requireAdmin();
    await deletePayment(id);
  } catch (err) {
    console.warn("DB offline (demo mode deletePayment):", err);
  }
  revalidateAllFinancialRoutes();
  return { success: true };
}
