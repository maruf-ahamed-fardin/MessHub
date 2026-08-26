import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarView } from "@/components/community/CalendarView";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const { month, year } = getCurrentMonthYear();
  const isAdmin = session?.user.role === "ADMIN";

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const [bazars, meals, cleanings, payments, notices, events] = await Promise.all([
    prisma.bazar.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        buyerMember: { include: { user: { select: { name: true } } } },
        items: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.meal.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        member: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.cleaningTask.findMany({
      where: { dueDate: { gte: startDate, lte: endDate } },
      include: {
        assignedMember: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        member: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.notice.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: {
        author: { select: { name: true } },
      },
    }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={T.pages.calendar.title}
        description={T.pages.calendar.description}
      />
      <CalendarView
        month={month}
        year={year}
        isAdmin={isAdmin}
        bazars={bazars}
        meals={meals}
        cleanings={cleanings}
        payments={payments}
        notices={notices}
        events={events}
      />
    </div>
  );
}
