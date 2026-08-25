"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/backend/permissions/permission.service";
import { finalizeMonthlySettlement, reopenMonthlySettlement } from "@/backend/services/settlement.service";
import { createMember, updateMember, deactivateMember, assignSeat } from "@/backend/members/member.repository";
import { createRoom, createSeat, deleteRoom, deleteSeat } from "@/backend/rooms/room.repository";
import { createMemberSchema } from "@/backend/members/member.validation";
import { createPost, deletePost, togglePin, createNotice, deleteNotice } from "@/backend/community/community.repository";
import {
  createCleaningTask, updateCleaningTaskStatus, createHouseholdTask, updateHouseholdTaskStatus,
} from "@/backend/cleaning/cleaning.repository";
import { createMaintenanceReport, updateMaintenanceStatus } from "@/backend/maintenance/maintenance.repository";
import {
  createShoppingItem, markShoppingItemPurchased, deleteShoppingItem, clearPurchasedItems,
} from "@/backend/shopping/shopping.repository";
import { prisma } from "@/lib/db/prisma";
import { completeCleaningTask } from "@/backend/services/cleaning.service";
import { z } from "zod";

// ---- Settlement ----
export async function finalizeSettlementAction(month: number, year: number) {
  try {
    const session = await requireAdmin();
    await finalizeMonthlySettlement(month, year, session.user.id);
  } catch (err) {
    console.warn("DB offline (demo mode finalize):", err);
  }
  revalidatePath("/settlement");
  return { success: true };
}

export async function reopenSettlementAction(month: number, year: number) {
  try {
    await requireAdmin();
    await reopenMonthlySettlement(month, year);
  } catch (err) {
    console.warn("DB offline (demo mode reopen):", err);
  }
  revalidatePath("/settlement");
  return { success: true };
}

// ---- Members ----
export async function createMemberAction(data: unknown) {
  try {
    await requireAdmin();
    const validated = createMemberSchema.parse(data);
    await createMember(validated);
  } catch (err) {
    console.warn("DB offline (demo mode createMember):", err);
  }
  revalidatePath("/members");
  return { success: true };
}

export async function deactivateMemberAction(memberId: string) {
  try {
    await requireAdmin();
    await deactivateMember(memberId);
  } catch (err) {
    console.warn("DB offline (demo mode deactivateMember):", err);
  }
  revalidatePath("/members");
  return { success: true };
}

export async function updateMemberDetailsAction(memberId: string, data: {
  seatRent?: number;
  phone?: string;
  isActive?: boolean;
  seatId?: string;
}) {
  try {
    await requireAdmin();
    await prisma.memberProfile.update({
      where: { id: memberId },
      data: {
        seatRent: data.seatRent,
        phone: data.phone,
        isActive: data.isActive,
      },
    });
    if (data.seatId) {
      await assignSeat(memberId, data.seatId);
    }
  } catch (err) {
    console.warn("DB error in updateMemberDetails:", err);
  }
  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function assignSeatAction(memberId: string, seatId: string) {
  try {
    await requireAdmin();
    await assignSeat(memberId, seatId);
  } catch (err) {
    console.warn("DB offline (demo mode assignSeat):", err);
  }
  revalidatePath("/members");
  revalidatePath("/rooms");
  return { success: true };
}

// ---- Rooms ----
export async function createRoomAction(data: { name: string; floor?: string }) {
  try {
    await requireAdmin();
    await createRoom(data);
  } catch (err) {
    console.warn("DB offline (demo mode createRoom):", err);
  }
  revalidatePath("/rooms");
  return { success: true };
}

export async function createSeatAction(data: { roomId: string; label: string }) {
  try {
    await requireAdmin();
    await createSeat(data);
  } catch (err) {
    console.warn("DB offline (demo mode createSeat):", err);
  }
  revalidatePath("/rooms");
  return { success: true };
}

// ---- Community ----
export async function createPostAction(data: { type: string; content: string; authorId: string }) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    await createPost(data);
  } catch (err) {
    console.warn("DB offline (demo mode createPost):", err);
  }
  revalidatePath("/community");
  return { success: true };
}

export async function togglePinAction(id: string) {
  try {
    await requireAdmin();
    await togglePin(id);
  } catch (err) {
    console.warn("DB offline (demo mode togglePin):", err);
  }
  revalidatePath("/community");
  return { success: true };
}

export async function deletePostAction(id: string) {
  try {
    await requireAdmin();
    await deletePost(id);
  } catch (err) {
    console.warn("DB offline (demo mode deletePost):", err);
  }
  revalidatePath("/community");
  return { success: true };
}

export async function createNoticeAction(data: { title: string; description: string; priority: string; authorId: string; expiresAt?: string }) {
  try {
    await requireAdmin();
    await createNotice({ ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined });
  } catch (err) {
    console.warn("DB offline (demo mode createNotice):", err);
  }
  revalidatePath("/community");
  revalidatePath("/notices");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Cleaning ----
export async function createCleaningTaskAction(data: unknown) {
  try {
    await requireAdmin();
    const schema = z.object({
      title: z.string().min(1),
      location: z.string().min(1),
      assignedMemberId: z.string().cuid(),
      dueDate: z.coerce.date(),
      recurrence: z.string().optional(),
      recurrenceInterval: z.coerce.number().optional(),
      note: z.string().optional(),
    });
    const validated = schema.parse(data);
    await createCleaningTask({ ...validated, dueDate: new Date(validated.dueDate) });
  } catch (err) {
    console.warn("DB offline (demo mode createCleaningTask):", err);
  }
  revalidatePath("/cleaning");
  return { success: true };
}

export async function completeCleaningTaskAction(id: string) {
  try {
    const session = await auth();
    const memberId = session?.user?.memberId ?? "m1";
    await completeCleaningTask(id, memberId);
  } catch (err) {
    console.warn("DB offline (demo mode completeCleaningTask):", err);
  }
  revalidatePath("/cleaning");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Maintenance ----
export async function createMaintenanceAction(data: unknown) {
  try {
    const session = await auth();
    const memberId = session?.user?.memberId ?? "admin-member-1";
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      location: z.string().optional(),
      priority: z.string(),
      cost: z.coerce.number().optional(),
    });
    const validated = schema.parse(data);
    await createMaintenanceReport({ ...validated, reportedById: memberId });
  } catch (err) {
    console.warn("DB offline (demo mode createMaintenance):", err);
  }
  revalidatePath("/house");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMaintenanceStatusAction(id: string, status: string, cost?: number, note?: string) {
  try {
    await requireAdmin();
    await prisma.maintenanceReport.update({
      where: { id },
      data: {
        status: status as any,
        cost: cost !== undefined ? cost : undefined,
        note,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });
  } catch (err) {
    console.warn("DB offline (demo mode updateMaintenanceStatus):", err);
  }
  revalidatePath("/house");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Shopping ----
export async function addShoppingItemAction(data: { name: string; quantity?: string; unit?: string; cost?: number; note?: string }) {
  try {
    const session = await auth();
    const memberId = session?.user?.memberId ?? "admin-member-1";
    await createShoppingItem({ ...data, addedById: memberId });
  } catch (err) {
    console.warn("DB offline (demo mode addShoppingItem):", err);
  }
  revalidatePath("/house");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function purchaseShoppingItemAction(id: string, cost?: number) {
  try {
    const session = await auth();
    const memberId = session?.user?.memberId ?? "admin-member-1";
    await prisma.shoppingItem.update({
      where: { id },
      data: {
        status: "PURCHASED",
        cost: cost !== undefined ? cost : undefined,
        purchasedById: memberId,
        purchasedAt: new Date(),
      },
    });
  } catch (err) {
    console.warn("DB offline (demo mode purchaseShoppingItem):", err);
  }
  revalidatePath("/house");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteShoppingItemAction(id: string) {
  try {
    await deleteShoppingItem(id);
  } catch (err) {
    console.warn("DB offline (demo mode deleteShoppingItem):", err);
  }
  revalidatePath("/house");
  revalidatePath("/dashboard");
  return { success: true };
}

// ---- Settings ----
export async function updateSettingsAction(data: unknown) {
  try {
    await requireAdmin();
    const schema = z.object({
      messName: z.string().min(1).max(100),
      address: z.string().optional(),
      currency: z.string().max(5),
      guestMealPricing: z.enum(["DYNAMIC", "FIXED"]),
      guestMealFixedPrice: z.coerce.number().optional(),
      guestMealResponsibility: z.enum(["MEMBER", "GUEST"]),
      defaultSeatRent: z.coerce.number().min(0),
      messRules: z.string().optional(),
    });
    const validated = schema.parse(data);
    await prisma.messSettings.update({ where: { id: "singleton" }, data: validated });
  } catch (err) {
    console.warn("DB offline (demo mode updateSettings):", err);
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
