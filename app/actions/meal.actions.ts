"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, assertCanModifyMember } from "@/backend/permissions/permission.service";
import { upsertMeal } from "@/backend/meals/meal.repository";
import { createGuestMeal, deleteGuestMeal } from "@/backend/guest-meals/guest-meal.repository";
import { notifyAllUsersAboutMealSave, notifyAllUsersAboutGuestMeal } from "@/backend/notifications/notification.service";
import { prisma } from "@/lib/db/prisma";

function revalidateAllMealRoutes() {
  revalidatePath("/meals");
  revalidatePath("/dashboard");
  revalidatePath("/settlement");
  revalidatePath("/members");
  revalidatePath("/calendar");
  revalidatePath("/notifications");
}

function parseSafeUtcDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
  }
  const str = String(dateInput).split("T")[0];
  const parts = str.split("-").map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function updateMealAction(formData: {
  memberId: string;
  date: string | Date;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}) {
  try {
    const session = await requireAuth();
    assertCanModifyMember(session, formData.memberId);

    const dateObj = parseSafeUtcDate(formData.date);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setUTCHours(0, 0, 0, 0);

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        return { success: false, error: "Past meals can only be edited by an Admin." };
      }
      if (targetDate > maxFutureDate) {
        return { success: false, error: "Meals can only be edited up to 7 days in advance." };
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
    let targetMemberName = "Member";
    try {
      const targetMember = await prisma.memberProfile.findUnique({
        where: { id: formData.memberId },
        include: { user: { select: { name: true } } },
      });
      if (targetMember?.user?.name) {
        targetMemberName = targetMember.user.name;
      }
    } catch {
      // Ignore
    }

    const updaterName = session.user.name || (session.user.role === "ADMIN" ? "Admin" : "Member");
    const isSelf = session.user.memberId === formData.memberId || session.user.id === formData.memberId;
    const isAdmin = session.user.role === "ADMIN";

    try {
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
    } catch {
      // Notification non-blocking
    }

    revalidateAllMealRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateMealAction:", err);
    return { success: false, error: err?.message || "Failed to update meal" };
  }
}

export async function saveBulkDailyMealsAction(data: {
  date: string | Date;
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

    const isSingleSelf = data.updates.length === 1 && (data.updates[0].memberId === session.user.memberId || data.updates[0].memberId === session.user.id);
    if (!isSingleSelf && session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized: Only Admins can modify other members' meals." };
    }

    const dateObj = parseSafeUtcDate(data.date);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setUTCHours(0, 0, 0, 0);

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        return { success: false, error: "Past meals can only be edited by an Admin." };
      }
      if (targetDate > maxFutureDate) {
        return { success: false, error: "Meals can only be edited up to 7 days in advance." };
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
    try {
      if (data.updates.length === 1) {
        const single = data.updates[0];
        let targetMemberName = "Member";
        const targetMember = await prisma.memberProfile.findUnique({
          where: { id: single.memberId },
          include: { user: { select: { name: true } } },
        });
        if (targetMember?.user?.name) {
          targetMemberName = targetMember.user.name;
        }

        await notifyAllUsersAboutMealSave({
          targetMemberName,
          updaterName,
          isSelf: session.user.memberId === single.memberId || session.user.id === single.memberId,
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
    } catch {
      // Notification non-blocking
    }

    revalidateAllMealRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in saveBulkDailyMealsAction:", err);
    return { success: false, error: err?.message || "Failed to save meals" };
  }
}

export async function toggleMealAction(
  memberId: string,
  date: Date | string,
  type: "breakfast" | "lunch" | "dinner",
  value: boolean
) {
  try {
    const session = await requireAuth();
    assertCanModifyMember(session, memberId);

    const d = parseSafeUtcDate(date);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(d);
    targetDate.setUTCHours(0, 0, 0, 0);

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        return { success: false, error: "Past meals can only be edited by an Admin." };
      }
      if (targetDate > maxFutureDate) {
        return { success: false, error: "Meals can only be edited up to 7 days in advance." };
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

    revalidateAllMealRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in toggleMealAction:", err);
    return { success: false, error: err?.message || "Failed to toggle meal" };
  }
}

export async function createGuestMealAction(data: {
  memberId: string;
  guestName: string;
  date: string | Date;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  quantity: number;
  note?: string;
}) {
  try {
    const session = await requireAuth();
    assertCanModifyMember(session, data.memberId);
    const memberId = session.user.memberId ?? data.memberId;

    const dateObj = parseSafeUtcDate(data.date);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(dateObj);
    targetDate.setUTCHours(0, 0, 0, 0);

    const maxFutureDate = new Date(today);
    maxFutureDate.setUTCDate(maxFutureDate.getUTCDate() + 7);

    if (session.user.role !== "ADMIN") {
      if (targetDate < today) {
        return { success: false, error: "Past guest meals can only be edited by an Admin." };
      }
      if (targetDate > maxFutureDate) {
        return { success: false, error: "Guest meals can only be added up to 7 days in advance." };
      }
    }

    await createGuestMeal({
      ...data,
      date: dateObj,
      addedById: memberId,
    });

    let hostName = session.user.name || "মেম্বার";
    try {
      const host = await prisma.memberProfile.findUnique({
        where: { id: memberId },
        include: { user: { select: { name: true } } },
      });
      if (host?.user?.name) {
        hostName = host.user.name;
      }
      await notifyAllUsersAboutGuestMeal({
        hostName,
        guestName: data.guestName,
        mealType: data.mealType,
        quantity: data.quantity,
        date: dateObj,
      });
    } catch {
      // Ignore
    }

    revalidateAllMealRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in createGuestMealAction:", err);
    return { success: false, error: err?.message || "Failed to add guest meal" };
  }
}

export async function deleteGuestMealAction(id: string) {
  try {
    const session = await requireAuth();
    if (session.user.role !== "ADMIN") {
      const gm = await prisma.guestMeal.findUnique({ where: { id } });
      if (gm && gm.memberId !== session.user.memberId && gm.addedById !== session.user.memberId) {
        return { success: false, error: "Unauthorized to delete this guest meal." };
      }
    }
    await deleteGuestMeal(id);
    revalidateAllMealRoutes();
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteGuestMealAction:", err);
    return { success: false, error: err?.message || "Failed to delete guest meal" };
  }
}
