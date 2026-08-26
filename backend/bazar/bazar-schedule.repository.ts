import { prisma } from "@/lib/db/prisma";

export async function getWeeklyBazarSchedule() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const next7Days = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 14));

  return prisma.bazarSchedule.findMany({
    where: {
      date: { gte: today, lte: next7Days },
    },
    include: {
      member: {
        include: {
          user: { select: { name: true, image: true } },
          seat: { include: { room: true } },
        },
      },
      swapRequests: {
        where: { status: "PENDING" },
        include: {
          requester: { include: { user: { select: { name: true, image: true } } } },
          targetMember: { include: { user: { select: { name: true, image: true } } } },
        },
      },
    },
    orderBy: { date: "asc" },
  });
}

export async function getPendingBazarSwapRequests() {
  return prisma.bazarSwapRequest.findMany({
    where: { status: "PENDING" },
    include: {
      schedule: true,
      requester: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
      targetMember: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBazarSwapRequest(data: {
  scheduleId: string;
  requesterId: string;
  targetDate?: Date;
  targetMemberId?: string;
  reason?: string;
}) {
  return prisma.bazarSwapRequest.create({
    data: {
      scheduleId: data.scheduleId,
      requesterId: data.requesterId,
      targetDate: data.targetDate,
      targetMemberId: data.targetMemberId,
      reason: data.reason,
      status: "PENDING",
    },
    include: {
      schedule: true,
      requester: { include: { user: true } },
      targetMember: { include: { user: true } },
    },
  });
}

export async function acceptBazarSwapRequest(requestId: string, acceptedById: string) {
  const swapRequest = await prisma.bazarSwapRequest.findUnique({
    where: { id: requestId },
    include: { schedule: true },
  });

  if (!swapRequest || swapRequest.status !== "PENDING") {
    throw new Error("Swap request is not pending or does not exist.");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Reassign the original schedule to the accepting member
    await tx.bazarSchedule.update({
      where: { id: swapRequest.scheduleId },
      data: {
        memberId: acceptedById,
        status: "SWAPPED",
        note: swapRequest.reason ? `Swapped with ${acceptedById} (Note: ${swapRequest.reason})` : `Swapped with ${acceptedById}`,
      },
    });

    // 2. If targetDate was specified and has a schedule, swap requester into that target date schedule
    if (swapRequest.targetDate) {
      const targetSchedule = await tx.bazarSchedule.findUnique({
        where: { date: swapRequest.targetDate },
      });

      if (targetSchedule) {
        await tx.bazarSchedule.update({
          where: { id: targetSchedule.id },
          data: {
            memberId: swapRequest.requesterId,
            status: "SWAPPED",
          },
        });
      }
    }

    // 3. Mark swap request as accepted
    return tx.bazarSwapRequest.update({
      where: { id: requestId },
      data: {
        status: "ACCEPTED",
        acceptedById,
      },
      include: {
        schedule: true,
        requester: { include: { user: true } },
      },
    });
  });
}

export async function cancelBazarSwapRequest(requestId: string, memberId: string, isAdmin: boolean) {
  const swapRequest = await prisma.bazarSwapRequest.findUnique({ where: { id: requestId } });
  if (!swapRequest) throw new Error("Swap request not found.");
  if (!isAdmin && swapRequest.requesterId !== memberId) {
    throw new Error("Unauthorized to cancel this swap request.");
  }

  return prisma.bazarSwapRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

export async function updateBazarSchedule(id: string, memberId: string, note?: string) {
  return prisma.bazarSchedule.update({
    where: { id },
    data: {
      memberId,
      note,
      status: "SWAPPED",
    },
  });
}

export async function assignBazarSchedule(data: {
  date: Date;
  memberId: string;
  dayName?: string;
  note?: string;
}) {
  return prisma.bazarSchedule.upsert({
    where: { date: data.date },
    create: {
      date: data.date,
      memberId: data.memberId,
      dayName: data.dayName,
      note: data.note,
      status: "PENDING",
    },
    update: {
      memberId: data.memberId,
      dayName: data.dayName,
      note: data.note,
    },
  });
}
