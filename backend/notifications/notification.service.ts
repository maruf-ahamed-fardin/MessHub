import { prisma } from "@/lib/db/prisma";
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
 * Dynamically aggregates live notifications from all actions in the mess:
 * - Bazar entries
 * - Member payments
 * - Shared expenses & bills
 * - Cleaning & household tasks
 * - Guest meals
 * - Notices & Community posts
 * - Daily Bazar schedule
 */
export async function getLiveNotifications(currentMemberId?: string): Promise<LiveNotificationItem[]> {
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
  ] = await Promise.all([
    prisma.notice.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.bazar.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { buyerMember: { include: { user: { select: { name: true } } } } },
    }),
    prisma.payment.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { member: { include: { user: { select: { name: true } } } } },
    }),
    prisma.expense.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { paidBy: { include: { user: { select: { name: true } } } } },
    }),
    prisma.cleaningTask.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { assignedMember: { include: { user: { select: { name: true } } } } },
    }),
    prisma.householdTask.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { assignedMember: { include: { user: { select: { name: true } } } } },
    }),
    prisma.guestMeal.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { addedBy: { include: { user: { select: { name: true } } } } },
    }),
    prisma.communityPost.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.bazarSchedule.findMany({
      where: { date: { gte: today } },
      take: 3,
      orderBy: { date: "asc" },
      include: { member: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  const items: LiveNotificationItem[] = [];

  // 1. Notices
  for (const n of notices) {
    items.push({
      id: `notice-${n.id}`,
      category: "notice",
      title: `${n.priority === "URGENT" ? "🚨 জরুরি নোটিশ: " : "📢 নোটিশ: "}${n.title}`,
      desc: n.description,
      time: formatRelativeDate(n.createdAt),
      createdAt: n.createdAt,
      href: "/notices",
      type: n.priority,
      read: false,
    });
  }

  // 2. Bazar Purchases
  for (const b of bazars) {
    const buyer = b.buyerMember?.user?.name ?? "মেম্বার";
    items.push({
      id: `bazar-${b.id}`,
      category: "bazar",
      title: `🛒 ${buyer} বাজার যুক্ত করেছেন: ${formatCurrency(Number(b.totalAmount))}`,
      desc: b.note || `মেসের জন্য কাঁচাবাজার ও খাদ্যসামগ্রী ক্রয় করা হয়েছে।`,
      time: formatRelativeDate(b.createdAt),
      createdAt: b.createdAt,
      href: "/bazar",
      type: "BAZAR",
      read: false,
    });
  }

  // 3. Payments
  for (const p of payments) {
    const payer = p.member?.user?.name ?? "মেম্বার";
    items.push({
      id: `pay-${p.id}`,
      category: "payment",
      title: `💳 ${payer} টাকা জমা দিয়েছেন: ${formatCurrency(Number(p.amount))}`,
      desc: p.note || `মেথড: ${p.method} • মেস ফান্ডে জমা হয়েছে।`,
      time: formatRelativeDate(p.createdAt),
      createdAt: p.createdAt,
      href: "/payments",
      type: "PAYMENT",
      read: false,
    });
  }

  // 4. Shared Expenses & Bills
  for (const e of expenses) {
    const payer = e.paidBy?.user?.name ?? "মেম্বার";
    items.push({
      id: `exp-${e.id}`,
      category: "payment",
      title: `🧾 ${e.title} বিল যুক্ত হয়েছে: ${formatCurrency(Number(e.amount))}`,
      desc: `পরিশোধকারী: ${payer} • ক্যাটাগরি: ${e.category}`,
      time: formatRelativeDate(e.createdAt),
      createdAt: e.createdAt,
      href: "/expenses",
      type: "EXPENSE",
      read: false,
    });
  }

  // 5. Today & Upcoming Bazar Duties
  for (const bs of bazarSchedules) {
    const buyer = bs.member?.user?.name ?? "মেম্বার";
    const isToday = new Date(bs.date).toDateString() === today.toDateString();
    items.push({
      id: `duty-bazar-${bs.id}`,
      category: "bazar",
      title: isToday ? `🛒 আজকের বাজার দায়িত্ব: ${buyer}` : `🗓️ আগামী বাজার শিডিউল: ${buyer} (${bs.dayName})`,
      desc: bs.note || `সাপ্তাহিক রোটেশন অনুযায়ী বাজার করার দায়িত্ব।`,
      time: isToday ? "আজকের দায়িত্ব" : formatShortDate(bs.date),
      createdAt: bs.createdAt,
      href: "/bazar",
      type: "BAZAR_SCHEDULE",
      read: false,
    });
  }

  // 6. Cleaning Tasks
  for (const ct of cleaningTasks) {
    const assignee = ct.assignedMember?.user?.name ?? "মেম্বার";
    items.push({
      id: `clean-${ct.id}`,
      category: "duty",
      title: `🧹 ক্লিনিং ডিউটি: ${ct.title}`,
      desc: `দায়িত্বে: ${assignee} • স্থান: ${ct.location}`,
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
