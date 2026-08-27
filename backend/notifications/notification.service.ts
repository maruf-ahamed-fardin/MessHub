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
    const nowIso = new Date().toISOString();

    for (const u of users) {
      if (data.excludeUserId && u.id === data.excludeUserId) continue;
      const notifId = "notif-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      await db.$executeRawUnsafe(
        `INSERT INTO "notifications" ("id", "userId", "title", "message", "type", "relatedType", "relatedId", "isRead", "createdAt")
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        notifId,
        u.id,
        data.title,
        data.message,
        notifType,
        relatedType,
        data.relatedId || null,
        nowIso
      );
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
 * Get live notifications for user, combining DB notification records with recent mess events.
 */
export async function getLiveNotifications(userId?: string, currentMemberId?: string): Promise<LiveNotificationItem[]> {
  const db = getPrisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    dbNotifications,
    notices,
    bazars,
    payments,
    expenses,
    cleaningTasks,
    householdTasks,
    guestMeals,
    posts,
  ] = await Promise.all([
    userId
      ? db.notification.findMany({
          where: { userId },
          take: 30,
          orderBy: { createdAt: "desc" },
        })
      : db.notification.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
        }),
    db.notice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    db.bazar.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { buyerMember: { include: { user: { select: { name: true } } } } },
    }),
    db.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { member: { include: { user: { select: { name: true } } } } },
    }),
    db.expense.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { paidBy: { include: { user: { select: { name: true } } } } },
    }),
    db.cleaningTask.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { assignedMember: { include: { user: { select: { name: true } } } } },
    }),
    db.householdTask.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { assignedMember: { include: { user: { select: { name: true } } } } },
    }),
    db.guestMeal.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { addedBy: { include: { user: { select: { name: true } } } } },
    }),
    db.communityPost.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
  ]);

  const items: LiveNotificationItem[] = [];
  const seenKeys = new Set<string>();

  // 1. First add real DB notifications (these carry true isRead state for the user)
  for (const n of dbNotifications) {
    const { category, href } = getCategoryAndHref(n.relatedType);
    const key = `${n.title}-${n.message}`;
    seenKeys.add(key);

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

  // 2. Notices
  for (const n of notices) {
    const title = `${n.priority === "URGENT" ? "🚨 জরুরি নোটিশ: " : "📢 নোটিশ: "}${n.title}`;
    const desc = n.description;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `notice-${n.id}`,
        category: "notice",
        title,
        desc,
        time: formatRelativeDate(n.createdAt),
        createdAt: n.createdAt,
        href: "/notices",
        type: "NEW_NOTICE",
        read: false,
      });
    }
  }

  // 3. Bazar Entries
  for (const b of bazars) {
    const buyer = b.buyerMember?.user?.name ?? "মেম্বার";
    const title = `🛒 ${buyer} ${formatCurrency(b.totalAmount)} টাকার বাজার করেছেন`;
    const desc = `তারিখ: ${formatShortDate(b.date)} • আইটেম: ${b.note || "দৈনিক বাজার খরচ"}`;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `bazar-${b.id}`,
        category: "bazar",
        title,
        desc,
        time: formatRelativeDate(b.createdAt),
        createdAt: b.createdAt,
        href: "/bazar",
        type: "BAZAR",
        read: false,
      });
    }
  }

  // 4. Payments
  for (const p of payments) {
    const memberName = p.member?.user?.name ?? "মেম্বার";
    const title = `💰 ${memberName} ${formatCurrency(p.amount)} টাকা জমা দিয়েছেন`;
    const desc = `পেমেন্ট মেথড: ${p.method}${p.note ? ` • নোট: ${p.note}` : ""}`;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `pay-${p.id}`,
        category: "payment",
        title,
        desc,
        time: formatRelativeDate(p.createdAt),
        createdAt: p.createdAt,
        href: "/payments",
        type: "PAYMENT_RECORDED",
        read: false,
      });
    }
  }

  // 5. Shared Expenses
  for (const e of expenses) {
    const payer = e.paidBy?.user?.name ?? "মেম্বার";
    const title = `📑 নতুন বিল / খরচ: ${e.title} (${formatCurrency(e.amount)})`;
    const desc = `পরিশোধ করেছেন: ${payer} • ক্যাটাগরি: ${e.category}`;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `exp-${e.id}`,
        category: "bazar",
        title,
        desc,
        time: formatRelativeDate(e.createdAt),
        createdAt: e.createdAt,
        href: "/expenses",
        type: "EXPENSE",
        read: false,
      });
    }
  }

  // 6. Cleaning Tasks
  for (const ct of cleaningTasks) {
    const assignee = ct.assignedMember?.user?.name ?? "মেম্বার";
    const title = `🧹 ক্লিনিং ডিউটি: ${ct.title}`;
    const desc = `দায়িত্বে: ${assignee} • স্ট্যাটাস: ${ct.status === "DONE" ? "সম্পন্ন ✓" : "পেন্ডিং"}`;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `clean-${ct.id}`,
        category: "duty",
        title,
        desc,
        time: formatRelativeDate(ct.createdAt),
        createdAt: ct.createdAt,
        href: "/house",
        type: "CLEANING_ASSIGNED",
        read: false,
      });
    }
  }

  // 7. Household Tasks
  for (const ht of householdTasks) {
    const assignee = ht.assignedMember?.user?.name ?? "মেম্বার";
    const title = `🔧 হাউস টাস্ক: ${ht.title}`;
    const desc = `ক্যাটাগরি: ${ht.category} • দায়িত্বে: ${assignee}`;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `house-${ht.id}`,
        category: "house",
        title,
        desc,
        time: formatRelativeDate(ht.createdAt),
        createdAt: ht.createdAt,
        href: "/house",
        type: "MAINTENANCE_UPDATED",
        read: false,
      });
    }
  }

  // 8. Guest Meals
  for (const gm of guestMeals) {
    const adder = gm.addedBy?.user?.name ?? "মেম্বার";
    const title = `🍽️ গেস্ট মিল বুকিং: ${gm.quantity} টি (${gm.mealType})`;
    const desc = `বুক করেছেন: ${adder} • গেস্টের নাম: ${gm.guestName}`;
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `gm-${gm.id}`,
        category: "meal",
        title,
        desc,
        time: formatRelativeDate(gm.createdAt),
        createdAt: gm.createdAt,
        href: "/meals",
        type: "GUEST_MEAL_ADDED",
        read: false,
      });
    }
  }

  // 9. Community Posts
  for (const po of posts) {
    const author = po.author?.name ?? "মেম্বার";
    const title = `💬 ${author} কমিউনিটি ফিডে পোস্ট করেছেন`;
    const desc = po.content.slice(0, 80) + (po.content.length > 80 ? "..." : "");
    const key = `${title}-${desc}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      items.push({
        id: `post-${po.id}`,
        category: "community",
        title,
        desc,
        time: formatRelativeDate(po.createdAt),
        createdAt: po.createdAt,
        href: "/community",
        type: "POST",
        read: false,
      });
    }
  }

  // Sort by most recent createdAt date descending
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

