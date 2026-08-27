"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, assertCanModifyMember } from "@/backend/permissions/permission.service";
import { upsertMeal } from "@/backend/meals/meal.repository";
import { createGuestMeal, deleteGuestMeal } from "@/backend/guest-meals/guest-meal.repository";
import { notifyAllUsersAboutMealSave } from "@/backend/notifications/notification.service";
import { prisma } from "@/lib/db/prisma";

function revalidateAllMealRoutes() {
  revalidatePath("/meals");
  revalidatePath("/dashboard");
  revalidatePath("/settlement");
  revalidatePath("/members");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
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

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        throw new Error("Past meals can only be edited by an Admin.");
      }
      if (targetDate > maxFutureDate) {
        throw new Error("Meals can only be edited up to 7 days in advance.");
      }
    }

    await upsertMeal({
      memberId: formData.memberId,
      date: dateObj,
      breakfast: Boolean(formData.breakfast),
      lunch: Boolean(formData.lunch),
      dinner: Boolean(formData.dinner),
    });

    // Notify all users in the mess about the meal update
    const targetMember = await prisma.memberProfile.findUnique({
      where: { id: formData.memberId },
      include: { user: { select: { name: true } } },
    });
    const updaterName = session.user.name || (session.user.role === "ADMIN" ? "Admin" : "Member");
    const targetMemberName = targetMember?.user?.name || "Member";
    const isSelf = session.user.memberId === formData.memberId;
    const isAdmin = session.user.role === "ADMIN";

    await notifyAllUsersAboutMealSave({
      targetMemberName,
      updaterName,
      isSelf,
      isAdmin,
      date: dateObj,
      breakfast: formData.breakfast,
      lunch: formData.lunch,
      dinner: formData.dinner,
    });
  } catch (err) {
    console.error("Error in updateMealAction:", err);
    throw err;
  }
  revalidateAllMealRoutes();
  return { success: true };
}

export async function saveBulkDailyMealsAction(data: {
  date: string;
  updates: Array<{
    memberId: string;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  }>;
}) {
  try {
    const session = await requireAuth();
    if (!data.updates || data.updates.length === 0) {
      return { success: true };
    }

    const isSingleSelf = data.updates.length === 1 && data.updates[0].memberId === session.user.memberId;
    if (!isSingleSelf && session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only Admins can modify other members' meals.");
    }

    const [y, m, d] = data.date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setUTCHours(0, 0, 0, 0);

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        throw new Error("Past meals can only be edited by an Admin.");
      }
      if (targetDate > maxFutureDate) {
        throw new Error("Meals can only be edited up to 7 days in advance.");
      }
    }

    for (const update of data.updates) {
      await upsertMeal({
        memberId: update.memberId,
        date: dateObj,
        breakfast: Boolean(update.breakfast),
        lunch: Boolean(update.lunch),
        dinner: Boolean(update.dinner),
      });
    }

    const updaterName = session.user.name || (session.user.role === "ADMIN" ? "Admin" : "Member");
    if (data.updates.length === 1) {
      const single = data.updates[0];
      const targetMember = await prisma.memberProfile.findUnique({
        where: { id: single.memberId },
        include: { user: { select: { name: true } } },
      });
      const targetMemberName = targetMember?.user?.name || "Member";
      await notifyAllUsersAboutMealSave({
        targetMemberName,
        updaterName,
        isSelf: session.user.memberId === single.memberId,
        isAdmin: session.user.role === "ADMIN",
        date: dateObj,
        breakfast: single.breakfast,
        lunch: single.lunch,
        dinner: single.dinner,
      });
    } else {
      await notifyAllUsersAboutMealSave({
        targetMemberName: `${data.updates.length} Members`,
        updaterName,
        isSelf: false,
        isAdmin: session.user.role === "ADMIN",
        date: dateObj,
        count: data.updates.length,
      });
    }
  } catch (err) {
    console.error("Error in saveBulkDailyMealsAction:", err);
    throw err;
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

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        throw new Error("Past meals can only be edited by an Admin.");
      }
      if (targetDate > maxFutureDate) {
        throw new Error("Meals can only be edited up to 7 days in advance.");
      }
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
    throw err;
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

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setUTCHours(0, 0, 0, 0);

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        throw new Error("Past guest meals can only be edited by an Admin.");
      }
      if (targetDate > maxFutureDate) {
        throw new Error("Guest meals can only be added up to 7 days in advance.");
      }
    }

    await createGuestMeal({
      ...data,
      date: dateObj,
      addedById: memberId,
    });
  } catch (err) {
    console.error("Error in createGuestMealAction:", err);
    throw err;
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
