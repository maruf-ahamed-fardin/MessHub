"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, assertCanModifyMember } from "@/backend/permissions/permission.service";
import { upsertMeal } from "@/backend/meals/meal.repository";
import { createGuestMeal, deleteGuestMeal } from "@/backend/guest-meals/guest-meal.repository";
import { prisma } from "@/lib/db/prisma";

function revalidateAllMealRoutes() {
  revalidatePath("/meals");
  revalidatePath("/dashboard");
  revalidatePath("/settlement");
  revalidatePath("/members");
  revalidatePath("/calendar");
}

export async function updateMealAction(formData: {
  memberId: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}) {
  try {
    const session = await requireAuth();
    assertCanModifyMember(session, formData.memberId);

    const [y, m, d] = formData.date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setUTCHours(0, 0, 0, 0);

    if (targetDate < today && session.user.role !== "ADMIN") {
      throw new Error("Past meals can only be edited by an Admin.");
    }

    await upsertMeal({
      memberId: formData.memberId,
      date: dateObj,
      breakfast: Boolean(formData.breakfast),
      lunch: Boolean(formData.lunch),
      dinner: Boolean(formData.dinner),
    });
  } catch (err) {
    console.error("Error in updateMealAction:", err);
  }
  revalidateAllMealRoutes();
  return { success: true };
}

export async function toggleMealAction(
  memberId: string,
  date: Date,
  type: "breakfast" | "lunch" | "dinner",
  value: boolean
) {
  try {
    const session = await requireAuth();
    assertCanModifyMember(session, memberId);

    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(d);
    targetDate.setUTCHours(0, 0, 0, 0);

    if (targetDate < today && session.user.role !== "ADMIN") {
      throw new Error("Past meals can only be edited by an Admin.");
    }

    const existing = await prisma.meal.findUnique({
      where: { memberId_date: { memberId, date: d } },
    });

    const breakfast = type === "breakfast" ? value : (existing?.breakfast ?? true);
    const lunch = type === "lunch" ? value : (existing?.lunch ?? true);
    const dinner = type === "dinner" ? value : (existing?.dinner ?? true);

    await upsertMeal({
      memberId,
      date: d,
      breakfast,
      lunch,
      dinner,
    });
  } catch (err) {
    console.error("Error in toggleMealAction:", err);
  }
  revalidateAllMealRoutes();
  return { success: true };
}

export async function createGuestMealAction(data: {
  memberId: string;
  guestName: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  quantity: number;
  note?: string;
}) {
  try {
    const session = await requireAuth();
    assertCanModifyMember(session, data.memberId);
    const memberId = session.user.memberId ?? data.memberId;

    const [y, m, d] = data.date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    await createGuestMeal({
      ...data,
      date: dateObj,
      addedById: memberId,
    });
  } catch (err) {
    console.error("Error in createGuestMealAction:", err);
  }
  revalidateAllMealRoutes();
  return { success: true };
}

export async function deleteGuestMealAction(id: string) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      const gm = await prisma.guestMeal.findUnique({ where: { id } });
      if (gm && gm.memberId !== session.user.memberId && gm.addedById !== session.user.memberId) {
        throw new Error("Unauthorized to delete this guest meal.");
      }
    }
    await deleteGuestMeal(id);
  } catch (err) {
    console.error("Error in deleteGuestMealAction:", err);
  }
  revalidateAllMealRoutes();
  return { success: true };
}
