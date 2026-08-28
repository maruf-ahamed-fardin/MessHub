import { getPrisma, prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils/currency";
import { formatRelativeDate, formatShortDate } from "@/lib/utils/date";

export interface LiveNotificationItem {
  id: string;
  category: "notice" | "bazar" | "payment" | "duty" | "meal" | "house" | "community";
  title: string;
  desc: string;
  time: string;
  createdAt: Date;
  href: string;
  type: string;
  read: boolean;
}

/**
 * Generic broadcaster to create a Notification record for all users in the mess.
 */
export async function broadcastNotification(data: {
  title: string;
  message: string;
  type?: "GENERAL" | "BALANCE_REMINDER" | "NEW_NOTICE" | "CLEANING_ASSIGNED" | "GUEST_MEAL_ADDED" | "MAINTENANCE_UPDATED" | "PAYMENT_RECORDED" | "SETTLEMENT_FINALIZED";
  relatedType?: string;
  relatedId?: string;
  excludeUserId?: string;
}) {
  try {
    const db = getPrisma();
    const users = await db.user.findMany({ select: { id: true } });
    const notifType = data.type || "GENERAL";
    const relatedType = data.relatedType || "system";

    for (const u of users) {
      if (data.excludeUserId && u.id === data.excludeUserId) continue;
      try {
        await db.notification.create({
          data: {
            userId: u.id,
            title: data.title,
            message: data.message,
            type: notifType as any,
            relatedType,
            relatedId: data.relatedId || null,
            isRead: false,
          },
        });
      } catch (innerErr) {
        console.warn("Failed to create single notification:", innerErr);
      }
    }
  } catch (err) {
    console.warn("Failed to broadcast notification:", err);
  }
}

/**
 * Broadcast Bazar Swap notification
 */
export async function notifyAllUsersAboutBazarSwap(data: {
  swappedDate: Date;
  newAssigneeName: string;
  previousAssigneeName?: string;
  reason?: string;
}) {
  const formattedDate = data.swappedDate.toLocaleDateString("bn-BD", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  const title = `🔄 বাজার শিডিউল সোয়াপ: ${data.newAssigneeName}`;
  const desc = data.previousAssigneeName
    ? `${formattedDate} তারিখের বাজার দায়িত্ব ${data.previousAssigneeName} থেকে পরিবর্তন হয়ে ${data.newAssigneeName}-এর নামে নির্ধারিত হয়েছে।`
    : `${formattedDate} তারিখের বাজার দায়িত্ব ${data.newAssigneeName}-এর নামে নির্ধারিত হয়েছে।`;

  const fullDesc = data.reason ? `${desc} (কারণ: ${data.reason})` : desc;

  await broadcastNotification({
    title,
    message: fullDesc,
    type: "GENERAL",
    relatedType: "bazar_schedule",
  });
}

/**
 * Broadcast Meal Save notification
 */
export async function notifyAllUsersAboutMealSave(data: {
  targetMemberName: string;
  updaterName: string;
  isSelf: boolean;
  isAdmin: boolean;
  date: Date;
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  count?: number;
}) {
  const formattedDate = data.date.toLocaleDateString("bn-BD", {
    month: "short",
    day: "numeric",
    weekday: "short",
    year: "numeric",
  });

  let title: string;
  let desc: string;

  if (data.count && data.count > 1) {
    title = `🍽️ মিল আপডেট: ${data.count} জন মেম্বারের মিল সেভ হয়েছে`;
    desc = `${data.updaterName}, ${formattedDate} তারিখের ${data.count} জন মেম্বারের মিল তালিকা সেভ ও আপডেট করেছেন।`;
  } else {
    const bStr = data.breakfast !== undefined ? (data.breakfast ? "সকাল: চালু ✓" : "সকাল: বন্ধ ✕") : "";
    const lStr = data.lunch !== undefined ? (data.lunch ? "দুপুর: চালু ✓" : "দুপুর: বন্ধ ✕") : "";
    const dStr = data.dinner !== undefined ? (data.dinner ? "রাত: চালু ✓" : "রাত: বন্ধ ✕") : "";
    const mealStatusParts = [bStr, lStr, dStr].filter(Boolean).join(", ");

    if (data.isSelf) {
      title = `🍽️ মিল সেভ: ${data.targetMemberName}`;
      desc = `${data.targetMemberName} নিজের ${formattedDate} তারিখের মিল সেভ করেছেন (${mealStatusParts})।`;
    } else {
      title = `🍽️ মিল সেভ: ${data.targetMemberName}`;
      desc = `${data.updaterName}, ${data.targetMemberName}-এর ${formattedDate} তারিখের মিল পরিবর্তন ও সেভ করেছেন (${mealStatusParts})।`;
    }
  }

  await broadcastNotification({
    title,
    message: desc,
    type: "GENERAL",
    relatedType: "meal_update",
  });
}

/**
 * Broadcast Notice notification
 */
export async function notifyAllUsersAboutNotice(data: {
  title: string;
  description: string;
  priority: string;
  authorName: string;
}) {
  const prefix = data.priority === "URGENT" ? "🚨 জরুরি নোটিশ: " : "📢 নোটিশ: ";
  await broadcastNotification({
    title: `${prefix}${data.title}`,
    message: `${data.description} (প্রকাশক: ${data.authorName})`,
    type: "NEW_NOTICE",
    relatedType: "notice",
  });
}

/**
 * Broadcast Payment notification
 */
export async function notifyAllUsersAboutPayment(data: {
  memberName: string;
  amount: number;
  method: string;
  note?: string;
}) {
  const title = `💰 টাকা জমা: ${data.memberName} (${formatCurrency(data.amount)})`;
  const desc = `${data.memberName} ${formatCurrency(data.amount)} টাকা জমা দিয়েছেন (${data.method}${data.note ? ` • ${data.note}` : ""})।`;

  await broadcastNotification({
    title,
    message: desc,
    type: "PAYMENT_RECORDED",
    relatedType: "payment",
  });
}

/**
 * Broadcast Bazar entry notification
 */
export async function notifyAllUsersAboutBazar(data: {
  buyerName: string;
  totalAmount: number;
  date: Date;
  note?: string;
}) {
  const formattedDate = formatShortDate(data.date);
  const title = `🛒 বাজার খরচ: ${data.buyerName} (${formatCurrency(data.totalAmount)})`;
  const desc = `${data.buyerName}, ${formattedDate} তারিখে ${formatCurrency(data.totalAmount)} টাকার বাজার করেছেন${data.note ? ` (${data.note})` : ""}।`;

  await broadcastNotification({
    title,
    message: desc,
    type: "GENERAL",
    relatedType: "bazar",
  });
}

/**
 * Broadcast Guest Meal notification
 */
export async function notifyAllUsersAboutGuestMeal(data: {
  hostName: string;
  guestName: string;
  mealType: string;
  quantity: number;
  date: Date;
}) {
  const formattedDate = formatShortDate(data.date);
  const mealName = data.mealType === "BREAKFAST" ? "সকাল" : data.mealType === "LUNCH" ? "দুপুর" : "রাত";
  const title = `🍽️ গেস্ট মিল: ${data.guestName} (${data.quantity}টি)`;
  const desc = `${data.hostName}, ${formattedDate} তারিখের ${mealName}ের মিলের জন্য ${data.quantity}টি গেস্ট মিল যোগ করেছেন।`;

  await broadcastNotification({
    title,
    message: desc,
    type: "GUEST_MEAL_ADDED",
    relatedType: "guest_meal",
  });
}

/**
 * Get unread notification count for a specific user
 */
export async function getUnreadNotificationCount(userId?: string): Promise<number> {
  if (!userId) return 0;
  try {
    const db = getPrisma();
    const count = await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return count;
  } catch (err) {
    console.warn("Failed to get unread notification count:", err);
    return 0;
  }
}

/**
 * Maps relatedType or category to category key and href
 */
function getCategoryAndHref(relatedType?: string | null): { category: LiveNotificationItem["category"]; href: string } {
  switch (relatedType) {
    case "meal_update":
    case "guest_meal":
    case "meal":
      return { category: "meal", href: "/meals" };
    case "bazar":
    case "bazar_schedule":
      return { category: "bazar", href: "/bazar" };
    case "payment":
      return { category: "payment", href: "/payments" };
    case "expense":
      return { category: "bazar", href: "/expenses" };
    case "notice":
      return { category: "notice", href: "/notices" };
    case "cleaning":
    case "house":
    case "task":
      return { category: "duty", href: "/house" };
    case "post":
    case "community":
      return { category: "community", href: "/community" };
    default:
      return { category: "notice", href: "/notifications" };
  }
}

/**
 * Get live notifications for user from persistent DB records (respecting isRead status).
 */
export async function getLiveNotifications(userId?: string, currentMemberId?: string): Promise<LiveNotificationItem[]> {
  const db = getPrisma();

  try {
    const dbNotifications = await db.notification.findMany({
      where: userId ? { userId } : undefined,
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    const items: LiveNotificationItem[] = [];

    for (const n of dbNotifications) {
      const { category, href } = getCategoryAndHref(n.relatedType);
      items.push({
        id: n.id,
        category,
        title: n.title,
        desc: n.message,
        time: formatRelativeDate(n.createdAt),
        createdAt: n.createdAt,
        href,
        type: n.type || "GENERAL",
        read: n.isRead,
      });
    }

    return items;
  } catch (err) {
    console.warn("Failed to fetch live notifications from DB:", err);
    return [];
  }
}

