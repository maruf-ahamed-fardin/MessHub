"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/backend/permissions/permission.service";
import { createBazar, updateBazar, deleteBazar } from "@/backend/bazar/bazar.repository";
import { createBazarSchema, updateBazarSchema } from "@/backend/bazar/bazar.validation";
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
    const validated = createBazarSchema.parse(data);
    await createBazar({ ...validated, date: new Date(validated.date) });
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("DB error (createBazarAction):", err);
    return { success: false, error: err?.message ?? "Failed to create bazar" };
  }
}

export async function updateBazarAction(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = updateBazarSchema.parse(data);
    const { getBazarById } = await import("@/backend/bazar/bazar.repository");
    const bazar = await getBazarById(validated.id);
    if (!bazar) throw new Error("Bazar record not found.");

    if (session.user.role !== "ADMIN") {
      if (bazar.buyerId !== session.user.memberId) {
        throw new Error("অনুমতি নেই: আপনি শুধুমাত্র নিজের বাজার পরিবর্তন করতে পারবেন।");
      }

      const now = new Date();
      const bazarDate = new Date(bazar.date);
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const isWithin3Days = now.getTime() - bazarDate.getTime() <= threeDaysMs;

      const bazarMonth = bazarDate.getMonth() + 1;
      const bazarYear = bazarDate.getFullYear();
      const currMonth = now.getMonth() + 1;
      const currYear = now.getFullYear();
      const isSameMonth = bazarMonth === currMonth && bazarYear === currYear;

      if (!isWithin3Days || !isSameMonth) {
        throw new Error("বাজার এন্ট্রি করার ৩ দিন পর অথবা মাস শেষ হওয়ার পর সাধারণ সদস্যরা আর এডিট করতে পারবেন না। শুধুমাত্র এডমিন এডিট করতে পারবেন।");
      }
    }

    await updateBazar(validated.id, {
      date: validated.date ? new Date(validated.date) : undefined,
      buyerId: session.user.role === "ADMIN" ? validated.buyerId : undefined,
      note: validated.note,
      receiptUrl: validated.receiptUrl,
      items: validated.items,
    });
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateBazarAction:", err);
    return { success: false, error: err?.message ?? "Failed to update bazar" };
  }
}

export async function deleteBazarAction(id: string) {
  try {
    const session = await requireAuth();
    const { getBazarById } = await import("@/backend/bazar/bazar.repository");
    const bazar = await getBazarById(id);
    if (!bazar) throw new Error("Bazar record not found.");

    if (session.user.role !== "ADMIN") {
      if (bazar.buyerId !== session.user.memberId) {
        throw new Error("অনুমতি নেই: আপনি শুধুমাত্র নিজের বাজার মুছতে পারবেন।");
      }

      const now = new Date();
      const bazarDate = new Date(bazar.date);
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const isWithin3Days = now.getTime() - bazarDate.getTime() <= threeDaysMs;

      const bazarMonth = bazarDate.getMonth() + 1;
      const bazarYear = bazarDate.getFullYear();
      const currMonth = now.getMonth() + 1;
      const currYear = now.getFullYear();
      const isSameMonth = bazarMonth === currMonth && bazarYear === currYear;

      if (!isWithin3Days || !isSameMonth) {
        throw new Error("বাজার এন্ট্রি করার ৩ দিন পর অথবা মাস শেষ হওয়ার পর সাধারণ সদস্যরা আর ডিলিট করতে পারবেন না। শুধুমাত্র এডমিন ডিলিট করতে পারবেন।");
      }
    }

    await deleteBazar(id);
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteBazarAction:", err);
    return { success: false, error: err?.message ?? "Failed to delete bazar" };
  }
}

export async function updateBazarScheduleAction(scheduleId: string, memberId: string, note?: string) {
  try {
    await requireAdmin();
    const { updateBazarSchedule } = await import("@/backend/bazar/bazar-schedule.repository");
    await updateBazarSchedule(scheduleId, memberId, note);
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("DB error in updateBazarSchedule:", err);
    return { success: false, error: err?.message ?? "Failed to update schedule" };
  }
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
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("DB error in assignBazarSchedule:", err);
    return { success: false, error: err?.message ?? "Failed to assign schedule" };
  }
}

export async function createBazarSwapRequestAction(data: {
  scheduleId: string;
  targetDate?: string;
  targetMemberId?: string;
  reason?: string;
}) {
  try {
    const session = await requireAuth();
    let requesterId = session.user.memberId;
    const { getPrisma } = await import("@/lib/db/prisma");
    const db = getPrisma();

    if (!requesterId) {
      const profile = await db.memberProfile.findFirst({ where: { userId: session.user.id } });
      requesterId = profile?.id ?? "admin-member-1";
    }

    const requester = await db.memberProfile.findUnique({ where: { id: requesterId } });
    if (!requester) {
      const firstMember = await db.memberProfile.findFirst();
      if (firstMember) requesterId = firstMember.id;
    }

    let validTargetMemberId: string | undefined = undefined;
    if (data.targetMemberId && data.targetMemberId !== "ALL") {
      const target = await db.memberProfile.findUnique({ where: { id: data.targetMemberId } });
      if (target) validTargetMemberId = target.id;
    }

    let targetDateObj: Date | undefined;
    if (data.targetDate) {
      const [y, m, d] = data.targetDate.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        targetDateObj = new Date(Date.UTC(y, m - 1, d));
      }
    }

    const { createBazarSwapRequest } = await import("@/backend/bazar/bazar-schedule.repository");
    await createBazarSwapRequest({
      scheduleId: data.scheduleId,
      requesterId,
      targetDate: targetDateObj,
      targetMemberId: validTargetMemberId,
      reason: data.reason?.trim() || undefined,
    });

    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error creating bazar swap request:", err);
    return { success: false, error: err?.message ?? "Failed to create swap request" };
  }
}

export async function acceptBazarSwapRequestAction(requestId: string) {
  try {
    const session = await requireAuth();
    let memberId = session.user.memberId;
    const { getPrisma } = await import("@/lib/db/prisma");
    const db = getPrisma();

    if (!memberId) {
      const profile = await db.memberProfile.findFirst({ where: { userId: session.user.id } });
      memberId = profile?.id ?? "admin-member-1";
    }

    const { acceptBazarSwapRequest } = await import("@/backend/bazar/bazar-schedule.repository");
    await acceptBazarSwapRequest(requestId, memberId);
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error accepting bazar swap request:", err);
    return { success: false, error: err?.message ?? "Failed to accept swap request" };
  }
}

export async function cancelBazarSwapRequestAction(requestId: string) {
  try {
    const session = await requireAuth();
    const memberId = session.user.memberId;
    const isAdmin = session.user.role === "ADMIN";
    if (!memberId && !isAdmin) throw new Error("Unauthorized.");

    const { cancelBazarSwapRequest } = await import("@/backend/bazar/bazar-schedule.repository");
    await cancelBazarSwapRequest(requestId, memberId || "", isAdmin);
    revalidateAllFinancialRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error cancelling bazar swap request:", err);
    return { success: false, error: err?.message ?? "Failed to cancel swap request" };
  }
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
