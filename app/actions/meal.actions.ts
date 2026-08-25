"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { upsertMeal } from "@/backend/meals/meal.repository";
import { createGuestMeal, deleteGuestMeal } from "@/backend/guest-meals/guest-meal.repository";
import { prisma } from "@/lib/db/prisma";

export async function updateMealAction(formData: {
  memberId: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}) {
  try {
    const [y, m, d] = formData.date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

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
  revalidatePath("/meals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleMealAction(
  memberId: string,
  date: Date,
  type: "breakfast" | "lunch" | "dinner",
  value: boolean
) {
  try {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
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
  revalidatePath("/meals");
  revalidatePath("/dashboard");
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
    const session = await auth();
    const memberId = session?.user?.memberId ?? "admin-member-1";
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
  revalidatePath("/guest-meals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGuestMealAction(id: string) {
  try {
    await deleteGuestMeal(id);
  } catch (err) {
    console.error("Error in deleteGuestMealAction:", err);
  }
  revalidatePath("/guest-meals");
  return { success: true };
}
