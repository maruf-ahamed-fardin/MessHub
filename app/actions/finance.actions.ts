"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { createBazar, deleteBazar } from "@/backend/bazar/bazar.repository";
import { createBazarSchema } from "@/backend/bazar/bazar.validation";
import { createExpense, deleteExpense, upsertUtilityBill } from "@/backend/expenses/expense.repository";
import { createPayment, deletePayment } from "@/backend/payments/payment.repository";
import { z } from "zod";

export async function createBazarAction(data: unknown) {
  try {
    const validated = createBazarSchema.parse(data);
    await createBazar({ ...validated, date: new Date(validated.date) });
  } catch (err) {
    console.warn("DB offline (demo mode createBazar):", err);
  }
  revalidatePath("/bazar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBazarAction(id: string) {
  try {
    await deleteBazar(id);
  } catch (err) {
    console.warn("DB offline (demo mode deleteBazar):", err);
  }
  revalidatePath("/bazar");
  return { success: true };
}

export async function updateBazarScheduleAction(scheduleId: string, memberId: string, note?: string) {
  try {
    const { updateBazarSchedule } = await import("@/backend/bazar/bazar-schedule.repository");
    await updateBazarSchedule(scheduleId, memberId, note);
  } catch (err) {
    console.warn("DB error in updateBazarSchedule:", err);
  }
  revalidatePath("/bazar");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function assignBazarScheduleAction(dateStr: string, memberId: string, dayName?: string, note?: string) {
  try {
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
  revalidatePath("/bazar");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createExpenseAction(data: unknown) {
  try {
    const schema = z.object({
      title: z.string().min(1),
      category: z.string(),
      amount: z.coerce.number().positive(),
      date: z.coerce.date(),
      paidById: z.string().cuid(),
      sharingMethod: z.string(),
      selectedMemberIds: z.array(z.string()).optional(),
      note: z.string().optional(),
    });
    const validated = schema.parse(data);
    await createExpense({ ...validated, amount: Number(validated.amount) });
  } catch (err) {
    console.warn("DB offline (demo mode createExpense):", err);
  }
  revalidatePath("/expenses");
  return { success: true };
}

export async function deleteExpenseAction(id: string) {
  try {
    await deleteExpense(id);
  } catch (err) {
    console.warn("DB offline (demo mode deleteExpense):", err);
  }
  revalidatePath("/expenses");
  return { success: true };
}

export async function upsertUtilityAction(data: unknown) {
  try {
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
  revalidatePath("/expenses");
  return { success: true };
}

export async function createPaymentAction(data: unknown) {
  try {
    const session = await auth();
    const recordedById = session?.user?.id ?? "u1";
    const schema = z.object({
      memberId: z.string().cuid(),
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
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePaymentAction(id: string) {
  try {
    await deletePayment(id);
  } catch (err) {
    console.warn("DB offline (demo mode deletePayment):", err);
  }
  revalidatePath("/payments");
  return { success: true };
}
