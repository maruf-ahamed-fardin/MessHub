import { getPrisma } from "@/lib/db/prisma";
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

export async function notifyAllUsersAboutBazarSwap(data: {
  swappedDate: Date;
  newAssigneeName: string;
  previousAssigneeName?: string;
  reason?: string;
}) {
  try {
    const db = getPrisma();
    const users = await db.user.findMany({ select: { id: true } });
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

    for (const u of users) {
      const notifId = "notif-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      await db.$executeRawUnsafe(
        `INSERT INTO "notifications" ("id", "userId", "title", "message", "type", "relatedType", "isRead", "createdAt")
         VALUES (?, ?, ?, ?, 'GENERAL', 'bazar_schedule', 0, ?)`,
        notifId,
        u.id,
        title,
        fullDesc,
        new Date().toISOString()
      );
    }
  } catch (err) {
    console.warn("Failed to create broadcast notification:", err);
  }
}

/**
 * Dynamically aggregates live notifications from all actions in the mess:
 * - Bazar entries & Swaps
 * - Member payments
 * - Shared expenses & bills
 * - Cleaning & household tasks
 * - Guest meals
 * - Notices & Community posts
 * - Daily Bazar schedule
 */
export async function getLiveNotifications(currentMemberId?: string): Promise<LiveNotificationItem[]> {
  const db = getPrisma();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    notices,
    bazars,
    payments,
    expenses,
    cleaningTasks,
    householdTasks,
    guestMeals,
    posts,
    bazarSchedules,
    dbNotifications,
  ] = await Promise.all([
    db.notice.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    db.bazar.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { buyerMember: { include: { user: { select: { name: true } } } } },
    }),
    db.payment.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { member: { include: { user: { select: { name: true } } } } },
    }),
    db.expense.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { paidBy: { include: { user: { select: { name: true } } } } },
    }),
    db.cleaningTask.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { assignedMember: { include: { user: { select: { name: true } } } } },
    }),
    db.householdTask.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { assignedMember: { include: { user: { select: { name: true } } } } },
    }),
    db.guestMeal.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { addedBy: { include: { user: { select: { name: true } } } } },
    }),
    db.communityPost.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    db.bazarSchedule.findMany({
      where: { date: { gte: today } },
      take: 3,
      orderBy: { date: "asc" },
      include: { member: { include: { user: { select: { name: true } } } } },
    }),
    db.notification.findMany({
      where: { relatedType: "bazar_schedule" },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: LiveNotificationItem[] = [];

  // 1. Swap & System Notifications
  for (const n of dbNotifications) {
    items.push({
      id: `notif-${n.id}`,
      category: "bazar",
      title: n.title,
      desc: n.message,
      time: formatRelativeDate(n.createdAt),
      createdAt: n.createdAt,
      href: "/bazar",
      type: "BAZAR_SWAP",
      read: n.isRead,
    });
  }

  // 2. Notices
  for (const n of notices) {
    items.push({
      id: `notice-${n.id}`,
      category: "notice",
      title: `${n.priority === "URGENT" ? "🚨 জরুরি নোটিশ: " : "📢 নোটিশ: "}${n.title}`,
      desc: n.description,
      time: formatRelativeDate(n.createdAt),
      createdAt: n.createdAt,
      href: "/notices",
      type: "NOTICE",
      read: false,
    });
  }

  // 3. Bazar Entries
  for (const b of bazars) {
    const buyer = b.buyerMember?.user?.name ?? "মেম্বার";
    items.push({
      id: `bazar-${b.id}`,
      category: "bazar",
      title: `🛒 ${buyer} ${formatCurrency(b.totalAmount)} টাকার বাজার করেছেন`,
      desc: `তারিখ: ${formatShortDate(b.date)} • আইটেম: ${b.note || "দৈনিক বাজার খরচ"}`,
      time: formatRelativeDate(b.createdAt),
      createdAt: b.createdAt,
      href: "/bazar",
      type: "BAZAR",
      read: false,
    });
  }

  // 4. Payments
  for (const p of payments) {
    const memberName = p.member?.user?.name ?? "মেম্বার";
    items.push({
      id: `pay-${p.id}`,
      category: "payment",
      title: `💰 ${memberName} ${formatCurrency(p.amount)} টাকা জমা দিয়েছেন`,
      desc: `পেমেন্ট মেথড: ${p.method}${p.note ? ` • নোট: ${p.note}` : ""}`,
      time: formatRelativeDate(p.createdAt),
      createdAt: p.createdAt,
      href: "/deposits",
      type: "PAYMENT",
      read: false,
    });
  }

  // 5. Shared Expenses
  for (const e of expenses) {
    const payer = e.paidBy?.user?.name ?? "মেম্বার";
    items.push({
      id: `exp-${e.id}`,
      category: "bazar",
      title: `📑 নতুন বিল / খরচ: ${e.title} (${formatCurrency(e.amount)})`,
      desc: `পরিশোধ করেছেন: ${payer} • ক্যাটাগরি: ${e.category}`,
      time: formatRelativeDate(e.createdAt),
      createdAt: e.createdAt,
      href: "/expenses",
      type: "EXPENSE",
      read: false,
    });
  }

  // 6. Cleaning Tasks
  for (const ct of cleaningTasks) {
    const assignee = ct.assignedMember?.user?.name ?? "মেম্বার";
    items.push({
      id: `clean-${ct.id}`,
      category: "house",
      title: `🧹 ক্লিনিং ডিউটি: ${ct.title}`,
      desc: `দায়িত্বে: ${assignee} • স্ট্যাটাস: ${ct.status === "DONE" ? "সম্পন্ন ✓" : "পেন্ডিং"}`,
      time: formatRelativeDate(ct.createdAt),
      createdAt: ct.createdAt,
      href: "/house",
      type: "CLEANING",
      read: false,
    });
  }

  // 7. Household / Maintenance Tasks
  for (const ht of householdTasks) {
    const assignee = ht.assignedMember?.user?.name ?? "মেম্বার";
    items.push({
      id: `house-${ht.id}`,
      category: "house",
      title: `🔧 হাউস টাস্ক: ${ht.title}`,
      desc: `ক্যাটাগরি: ${ht.category} • দায়িত্বে: ${assignee}`,
      time: formatRelativeDate(ht.createdAt),
      createdAt: ht.createdAt,
      href: "/house",
      type: "TASK",
      read: false,
    });
  }

  // 8. Guest Meals
  for (const gm of guestMeals) {
    const adder = gm.addedBy?.user?.name ?? "মেম্বার";
    items.push({
      id: `gm-${gm.id}`,
      category: "meal",
      title: `🍽️ গেস্ট মিল বুকিং: ${gm.quantity} টি (${gm.mealType})`,
      desc: `বুক করেছেন: ${adder} • গেস্টের নাম: ${gm.guestName}`,
      time: formatRelativeDate(gm.createdAt),
      createdAt: gm.createdAt,
      href: "/meals",
      type: "GUEST_MEAL",
      read: false,
    });
  }

  // 9. Community Posts
  for (const po of posts) {
    const author = po.author?.name ?? "মেম্বার";
    items.push({
      id: `post-${po.id}`,
      category: "community",
      title: `💬 ${author} কমিউনিটি ফিডে পোস্ট করেছেন`,
      desc: po.content.slice(0, 80) + (po.content.length > 80 ? "..." : ""),
      time: formatRelativeDate(po.createdAt),
      createdAt: po.createdAt,
      href: "/community",
      type: "POST",
      read: false,
    });
  }

  // Sort by most recent createdAt date descending
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
