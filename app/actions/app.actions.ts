"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/backend/permissions/permission.service";
import { finalizeMonthlySettlement, reopenMonthlySettlement } from "@/backend/services/settlement.service";
import { createMember, updateMember, deactivateMember, assignSeat } from "@/backend/members/member.repository";
import { createRoom, createSeat, deleteRoom, deleteSeat } from "@/backend/rooms/room.repository";
import { createMemberSchema } from "@/backend/members/member.validation";
import { createPost, deletePost, togglePin, createNotice, deleteNotice, createCalendarEvent, deleteCalendarEvent } from "@/backend/community/community.repository";
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
    revalidatePath("/settlement");
    return { success: true };
  } catch (err: any) {
    console.error("Error in finalizeSettlementAction:", err);
    return { success: false, error: err?.message ?? "Failed to finalize settlement" };
  }
}

export async function reopenSettlementAction(month: number, year: number) {
  try {
    await requireAdmin();
    await reopenMonthlySettlement(month, year);
    revalidatePath("/settlement");
    return { success: true };
  } catch (err: any) {
    console.error("Error in reopenSettlementAction:", err);
    return { success: false, error: err?.message ?? "Failed to reopen settlement" };
  }
}

// ---- Members ----
export async function createMemberAction(data: unknown) {
  try {
    await requireAdmin();
    const validated = createMemberSchema.parse(data);
    await createMember(validated);
    revalidatePath("/members");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createMemberAction:", err);
    return { success: false, error: err?.message ?? "Failed to create member" };
  }
}

export async function deactivateMemberAction(memberId: string) {
  try {
    await requireAdmin();
    await deactivateMember(memberId);
    revalidatePath("/members");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deactivateMemberAction:", err);
    return { success: false, error: err?.message ?? "Failed to deactivate member" };
  }
}

export async function updateMemberDetailsAction(memberId: string, data: {
  seatRent?: number;
  phone?: string;
  isActive?: boolean;
  seatId?: string;
  securityDeposit?: number;
  advanceFund?: number;
}) {
  try {
    await requireAdmin();
    await prisma.memberProfile.update({
      where: { id: memberId },
      data: {
        seatRent: data.seatRent,
        phone: data.phone,
        isActive: data.isActive,
        securityDeposit: data.securityDeposit,
        advanceFund: data.advanceFund,
      },
    });
    if (data.seatId) {
      await assignSeat(memberId, data.seatId);
    }
    revalidatePath("/members");
    revalidatePath(`/members/${memberId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateMemberDetails:", err);
    return { success: false, error: err?.message ?? "Failed to update member" };
  }
}

export async function assignSeatAction(memberId: string, seatId: string) {
  try {
    await requireAdmin();
    await assignSeat(memberId, seatId);
    revalidatePath("/members");
    revalidatePath("/rooms");
    return { success: true };
  } catch (err: any) {
    console.error("Error in assignSeatAction:", err);
    return { success: false, error: err?.message ?? "Failed to assign seat" };
  }
}

// ---- Rooms ----
export async function createRoomAction(data: { name: string; floor?: string }) {
  try {
    await requireAdmin();
    await createRoom(data);
    revalidatePath("/rooms");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createRoomAction:", err);
    return { success: false, error: err?.message ?? "Failed to create room" };
  }
}

export async function createSeatAction(data: { roomId: string; label: string }) {
  try {
    await requireAdmin();
    await createSeat(data);
    revalidatePath("/rooms");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createSeatAction:", err);
    return { success: false, error: err?.message ?? "Failed to create seat" };
  }
}

// ---- Community ----
export async function createPostAction(data: {
  type: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  authorId: string;
}) {
  try {
    const session = await auth();
    let authorId = session?.user?.id || data.authorId;
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: authorId }, { email: session?.user?.email || "admin@messhub.local" }] },
    });
    if (user) authorId = user.id;

    await createPost({ ...data, authorId });
    revalidatePath("/community");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createPostAction:", err);
    return { success: false, error: err?.message ?? "Failed to create post" };
  }
}

export async function togglePinAction(id: string) {
  try {
    await requireAdmin();
    await togglePin(id);
    revalidatePath("/community");
    return { success: true };
  } catch (err: any) {
    console.error("Error in togglePinAction:", err);
    return { success: false, error: err?.message ?? "Failed to toggle pin" };
  }
}

export async function updatePostAction(data: {
  id: string;
  content: string;
  type?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const { updatePost } = await import("@/backend/community/community.repository");
    const post = await prisma.communityPost.findUnique({ where: { id: data.id } });
    if (post && session.user.role !== "ADMIN" && post.authorId !== session.user.id) {
      throw new Error("Unauthorized to edit this post.");
    }
    await updatePost(data.id, data);
    revalidatePath("/community");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updatePostAction:", err);
    return { success: false, error: err?.message ?? "Failed to update post" };
  }
}

export async function deletePostAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "ADMIN") {
      const post = await prisma.communityPost.findUnique({ where: { id } });
      if (post && post.authorId !== session.user.id) {
        throw new Error("Unauthorized to delete this post.");
      }
    }
    await deletePost(id);
    revalidatePath("/community");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deletePostAction:", err);
    return { success: false, error: err?.message ?? "Failed to delete post" };
  }
}

export async function addPostCommentAction(data: {
  postId: string;
  authorId: string;
  parentId?: string;
  content: string;
}) {
  try {
    const session = await auth();
    let authorId = session?.user?.id || data.authorId;
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: authorId }, { email: session?.user?.email || "admin@messhub.local" }] },
    });
    if (user) authorId = user.id;

    const { addPostComment } = await import("@/backend/community/community.repository");
    await addPostComment({ ...data, authorId });
    revalidatePath("/community");
    return { success: true };
  } catch (err: any) {
    console.error("Error in addPostCommentAction:", err);
    return { success: false, error: err?.message ?? "Failed to add comment" };
  }
}

export async function togglePostReactionAction(data: { postId: string; userId: string; emoji: string }) {
  try {
    const session = await auth();
    let userId = session?.user?.id || data.userId;
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: userId }, { email: session?.user?.email || "admin@messhub.local" }] },
    });
    if (user) userId = user.id;

    const { togglePostReaction } = await import("@/backend/community/community.repository");
    await togglePostReaction({ ...data, userId });
    revalidatePath("/community");
    return { success: true };
  } catch (err: any) {
    console.error("Error in togglePostReactionAction:", err);
    return { success: false, error: err?.message ?? "Failed to react" };
  }
}

import { notifyAllUsersAboutNotice } from "@/backend/notifications/notification.service";

export async function createNoticeAction(data: { title: string; description: string; priority: string; authorId: string; expiresAt?: string }) {
  try {
    const session = await requireAdmin();
    await createNotice({ ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined });
    try {
      await notifyAllUsersAboutNotice({
        title: data.title,
        description: data.description,
        priority: data.priority,
        authorName: session.user.name || "Admin",
      });
    } catch {
      // Non-blocking
    }
    revalidatePath("/community");
    revalidatePath("/notices");
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createNoticeAction:", err);
    return { success: false, error: err?.message ?? "Failed to create notice" };
  }
}

// ---- Cleaning ----
export async function createCleaningTaskAction(data: unknown) {
  try {
    await requireAdmin();
    const schema = z.object({
      title: z.string().min(1, "Title is required"),
      location: z.string().min(1, "Location is required"),
      assignedMemberId: z.string().min(1, "Assigned member is required"),
      dueDate: z.coerce.date(),
      recurrence: z.string().optional(),
      recurrenceInterval: z.coerce.number().optional(),
      note: z.string().optional(),
    });
    const validated = schema.parse(data);
    await createCleaningTask({ ...validated, dueDate: new Date(validated.dueDate) });
    revalidatePath("/cleaning");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createCleaningTaskAction:", err);
    return { success: false, error: err?.message ?? "Failed to create cleaning task" };
  }
}

async function getActiveMemberId(session: any): Promise<string> {
  if (session?.user?.memberId) {
    const exists = await prisma.memberProfile.findUnique({ where: { id: session.user.memberId } });
    if (exists) return exists.id;
  }
  if (session?.user?.id) {
    const profile = await prisma.memberProfile.findUnique({ where: { userId: session.user.id } });
    if (profile) return profile.id;
  }
  const firstMember = await prisma.memberProfile.findFirst({ where: { isActive: true } });
  if (firstMember) return firstMember.id;
  if (session?.user?.id) {
    const created = await prisma.memberProfile.create({
      data: {
        userId: session.user.id,
        seatRent: 0,
        isActive: true,
      },
    });
    return created.id;
  }
  return "m1";
}

export async function completeCleaningTaskAction(id: string) {
  try {
    const session = await auth();
    const memberId = await getActiveMemberId(session);
    await completeCleaningTask(id, memberId);
    revalidatePath("/cleaning");
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in completeCleaningTaskAction:", err);
    return { success: false, error: err?.message ?? "Failed to complete cleaning task" };
  }
}

// ---- Maintenance ----
export async function createMaintenanceAction(data: unknown) {
  try {
    const session = await auth();
    const memberId = await getActiveMemberId(session);
    const schema = z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      location: z.string().optional(),
      priority: z.string().default("MEDIUM"),
      cost: z.coerce.number().optional(),
    });
    const validated = schema.parse(data);
    await createMaintenanceReport({ ...validated, reportedById: memberId });
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createMaintenanceAction:", err);
    return { success: false, error: err?.message ?? "Failed to create maintenance report" };
  }
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
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateMaintenanceStatusAction:", err);
    return { success: false, error: err?.message ?? "Failed to update maintenance report" };
  }
}

// ---- Shopping ----
export async function addShoppingItemAction(data: { name: string; quantity?: string; unit?: string; cost?: number; note?: string }) {
  try {
    const session = await auth();
    const memberId = await getActiveMemberId(session);
    await createShoppingItem({ ...data, addedById: memberId });
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in addShoppingItemAction:", err);
    return { success: false, error: err?.message ?? "Failed to add shopping item" };
  }
}

export async function purchaseShoppingItemAction(id: string, cost?: number) {
  try {
    const session = await auth();
    const memberId = await getActiveMemberId(session);
    await prisma.shoppingItem.update({
      where: { id },
      data: {
        status: "PURCHASED",
        cost: cost !== undefined ? cost : undefined,
        purchasedById: memberId,
        purchasedAt: new Date(),
      },
    });
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in purchaseShoppingItemAction:", err);
    return { success: false, error: err?.message ?? "Failed to mark item purchased" };
  }
}

export async function deleteShoppingItemAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "ADMIN") {
      const item = await prisma.shoppingItem.findUnique({ where: { id } });
      if (item && item.addedById !== session.user.memberId) {
        return { success: false, error: "Unauthorized to delete this shopping item." };
      }
    }
    await deleteShoppingItem(id);
    revalidatePath("/house");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteShoppingItemAction:", err);
    return { success: false, error: err?.message ?? "Failed to delete shopping item" };
  }
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
      guestMealResponsibility: z.enum(["MEMBER", "GUEST"]).default("MEMBER"),
      defaultSeatRent: z.coerce.number().min(0),
      adminBkashNumber: z.string().optional().nullable(),
      adminNagadNumber: z.string().optional().nullable(),
      adminRocketNumber: z.string().optional().nullable(),
      lunchCutoffTime: z.string().optional().default("09:00"),
      dinnerCutoffTime: z.string().optional().default("16:00"),
      messRules: z.string().optional(),
    });
    const validated = schema.parse(data);
    await prisma.messSettings.update({ where: { id: "singleton" }, data: validated as any });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateSettingsAction:", err);
    return { success: false, error: err?.message ?? "Failed to update settings" };
  }
}

// ---- Personal Calendar Schedules & Events ----
export async function createCalendarEventAction(data: {
  title: string;
  date: string;
  type?: string;
  description?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const userId = session.user.id;
    const [y, m, d] = data.date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    await createCalendarEvent({
      title: data.title,
      type: data.type || "PERSONAL",
      date: dateObj,
      description: data.description || undefined,
      createdById: userId,
    });
    revalidatePath("/calendar");
    return { success: true };
  } catch (err: any) {
    console.error("Error in createCalendarEventAction:", err);
    return { success: false, error: err?.message ?? "Failed to create event" };
  }
}

export async function deleteCalendarEventAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    const userId = session.user.id;
    await deleteCalendarEvent(id, userId);
    revalidatePath("/calendar");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteCalendarEventAction:", err);
    return { success: false, error: err?.message ?? "Failed to delete event" };
  }
}

