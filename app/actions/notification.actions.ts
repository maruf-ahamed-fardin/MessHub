"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getPrisma } from "@/lib/db/prisma";
import {
  getLiveNotifications,
  getUnreadNotificationCount,
  LiveNotificationItem,
} from "@/backend/notifications/notification.service";

export async function getNotificationSummaryAction(): Promise<{
  unreadCount: number;
  notifications: LiveNotificationItem[];
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { unreadCount: 0, notifications: [] };
    }

    const userId = session.user.id;
    const memberId = session.user.memberId ?? undefined;

    const [unreadCount, notifications] = await Promise.all([
      getUnreadNotificationCount(userId),
      getLiveNotifications(userId, memberId),
    ]);

    return {
      unreadCount,
      notifications: notifications.slice(0, 12),
    };
  } catch (err) {
    console.warn("Failed to get notification summary:", err);
    return { unreadCount: 0, notifications: [] };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const db = getPrisma();
    await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    console.warn("Failed to mark notification as read:", err);
    return { success: false };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const db = getPrisma();
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    console.warn("Failed to mark all notifications as read:", err);
    return { success: false };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const db = getPrisma();
    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    console.warn("Failed to delete notification:", err);
    return { success: false };
  }
}
