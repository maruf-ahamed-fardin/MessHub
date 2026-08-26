import { getPrisma } from "@/lib/db/prisma";

export async function getWeeklyBazarSchedule() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const next7Days = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 14));
  const db = getPrisma();

  try {
    return await db.bazarSchedule.findMany({
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
      },
      orderBy: { date: "asc" },
    });
  } catch (err) {
    console.error("Error fetching weekly bazar schedule:", err);
    return [];
  }
}

export async function getPendingBazarSwapRequests() {
  const db = getPrisma();
  if (db.bazarSwapRequest) {
    try {
      return await db.bazarSwapRequest.findMany({
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
    } catch (err) {
      console.warn("bazarSwapRequest findMany failed, falling back to raw query:", err);
    }
  }

  try {
    const rows: any[] = await db.$queryRawUnsafe(
      `SELECT r.*,
              m.id as "requester_member_id", u.name as "requester_user_name",
              tm.id as "target_member_id", tu.name as "target_user_name",
              s.date as "schedule_date"
       FROM "bazar_swap_requests" r
       LEFT JOIN "member_profiles" m ON r."requesterId" = m."id"
       LEFT JOIN "users" u ON m."userId" = u."id"
       LEFT JOIN "member_profiles" tm ON r."targetMemberId" = tm."id"
       LEFT JOIN "users" tu ON tm."userId" = tu."id"
       LEFT JOIN "bazar_schedules" s ON r."scheduleId" = s."id"
       WHERE r."status" = 'PENDING'
       ORDER BY r."createdAt" DESC`
    );

    return rows.map((row) => ({
      id: row.id,
      scheduleId: row.scheduleId,
      requesterId: row.requesterId,
      targetDate: row.targetDate ? new Date(row.targetDate) : null,
      targetMemberId: row.targetMemberId,
      reason: row.reason,
      status: row.status,
      createdAt: new Date(row.createdAt),
      schedule: {
        id: row.scheduleId,
        date: row.schedule_date ? new Date(row.schedule_date) : new Date(),
      },
      requester: {
        id: row.requesterId,
        user: { name: row.requester_user_name ?? "Member" },
      },
      targetMember: row.target_user_name
        ? { id: row.targetMemberId, user: { name: row.target_user_name } }
        : null,
    }));
  } catch (err) {
    console.error("Error fetching pending bazar swap requests via raw query:", err);
    return [];
  }
}

export async function createBazarSwapRequest(data: {
  scheduleId: string;
  requesterId: string;
  targetDate?: Date;
  targetMemberId?: string;
  reason?: string;
}) {
  const db = getPrisma();
  if (db.bazarSwapRequest) {
    try {
      return await db.bazarSwapRequest.create({
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
    } catch (err) {
      console.warn("db.bazarSwapRequest.create failed, falling back to raw insert:", err);
    }
  }

  const id = "swap-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
  const now = new Date().toISOString();
  const targetDateIso = data.targetDate ? data.targetDate.toISOString() : null;

  await db.$executeRawUnsafe(
    `INSERT INTO "bazar_swap_requests" ("id", "scheduleId", "requesterId", "targetDate", "targetMemberId", "reason", "status", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
    id,
    data.scheduleId,
    data.requesterId,
    targetDateIso,
    data.targetMemberId ?? null,
    data.reason ?? null,
    now,
    now
  );

  return { id, scheduleId: data.scheduleId, requesterId: data.requesterId, status: "PENDING" };
}

export async function acceptBazarSwapRequest(requestId: string, acceptedById: string) {
  const db = getPrisma();
  let swapRequest: any = null;
  if (db.bazarSwapRequest) {
    try {
      swapRequest = await db.bazarSwapRequest.findUnique({
        where: { id: requestId },
        include: { schedule: true },
      });
    } catch {}
  }

  if (!swapRequest) {
    const rows: any[] = await db.$queryRawUnsafe(
      `SELECT * FROM "bazar_swap_requests" WHERE "id" = ?`,
      requestId
    );
    swapRequest = rows[0];
  }

  if (!swapRequest || swapRequest.status !== "PENDING") {
    throw new Error("Swap request is not pending or does not exist.");
  }

  // If the requester is accepting (e.g. Admin approving their own request targeted to Tanvir),
  // assign to the target member! Otherwise assign to the accepting member.
  let newAssigneeId = acceptedById;
  if (swapRequest.requesterId === acceptedById && swapRequest.targetMemberId) {
    newAssigneeId = swapRequest.targetMemberId;
  }

  // Resolve valid memberId in MemberProfile table
  let validAcceptedMemberId = newAssigneeId;
  const member = await db.memberProfile.findUnique({ where: { id: newAssigneeId } });
  if (!member) {
    const fallbackMember = await db.memberProfile.findFirst();
    if (fallbackMember) validAcceptedMemberId = fallbackMember.id;
  }

  // 1. Reassign the schedule to accepting member
  await db.bazarSchedule.update({
    where: { id: swapRequest.scheduleId },
    data: {
      memberId: validAcceptedMemberId,
      status: "SWAPPED",
      note: swapRequest.reason ? `Swapped (Note: ${swapRequest.reason})` : `Swapped with member`,
    },
  });

  // 2. If targetDate was specified and has a schedule, swap requester into that target date schedule
  if (swapRequest.targetDate) {
    const targetDateObj = new Date(swapRequest.targetDate);
    const targetSchedule = await db.bazarSchedule.findUnique({
      where: { date: targetDateObj },
    });

    if (targetSchedule) {
      let validRequesterId = swapRequest.requesterId;
      const reqMember = await db.memberProfile.findUnique({ where: { id: swapRequest.requesterId } });
      if (!reqMember) {
        validRequesterId = validAcceptedMemberId;
      }

      await db.bazarSchedule.update({
        where: { id: targetSchedule.id },
        data: {
          memberId: validRequesterId,
          status: "SWAPPED",
        },
      });
    }
  }

  // 3. Mark swap request as accepted
  if (db.bazarSwapRequest) {
    try {
      await db.bazarSwapRequest.update({
        where: { id: requestId },
        data: {
          status: "ACCEPTED",
          acceptedById: validAcceptedMemberId,
        },
      });
    } catch {}
  }

  const now = new Date().toISOString();
  await db.$executeRawUnsafe(
    `UPDATE "bazar_swap_requests" SET "status" = 'ACCEPTED', "acceptedById" = ?, "updatedAt" = ? WHERE "id" = ?`,
    validAcceptedMemberId,
    now,
    requestId
  );

  // 4. Broadcast notification to all mess users
  try {
    const { notifyAllUsersAboutBazarSwap } = await import("@/backend/notifications/notification.service");
    const originalSchedule = await db.bazarSchedule.findUnique({ where: { id: swapRequest.scheduleId } });
    const newMember = await db.memberProfile.findUnique({ where: { id: validAcceptedMemberId }, include: { user: true } });
    const reqMember = await db.memberProfile.findUnique({ where: { id: swapRequest.requesterId }, include: { user: true } });

    if (originalSchedule && newMember) {
      await notifyAllUsersAboutBazarSwap({
        swappedDate: originalSchedule.date,
        newAssigneeName: newMember.user?.name ?? "মেম্বার",
        previousAssigneeName: reqMember?.user?.name ?? undefined,
        reason: swapRequest.reason ?? undefined,
      });
    }
  } catch (err) {
    console.warn("Failed to broadcast swap notification:", err);
  }

  return { success: true };
}

export async function cancelBazarSwapRequest(requestId: string, memberId: string, isAdmin: boolean) {
  const db = getPrisma();
  let swapRequest: any = null;
  if (db.bazarSwapRequest) {
    try {
      swapRequest = await db.bazarSwapRequest.findUnique({ where: { id: requestId } });
    } catch {}
  }

  if (!swapRequest) {
    const rows: any[] = await db.$queryRawUnsafe(
      `SELECT * FROM "bazar_swap_requests" WHERE "id" = ?`,
      requestId
    );
    swapRequest = rows[0];
  }

  if (!swapRequest) throw new Error("Swap request not found.");
  if (!isAdmin && swapRequest.requesterId !== memberId) {
    throw new Error("Unauthorized to cancel this swap request.");
  }

  if (db.bazarSwapRequest) {
    try {
      return await db.bazarSwapRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });
    } catch {}
  }

  const now = new Date().toISOString();
  await db.$executeRawUnsafe(
    `UPDATE "bazar_swap_requests" SET "status" = 'CANCELLED', "updatedAt" = ? WHERE "id" = ?`,
    now,
    requestId
  );

  return { success: true };
}

export async function updateBazarSchedule(id: string, memberId: string, note?: string) {
  const db = getPrisma();
  const updated = await db.bazarSchedule.update({
    where: { id },
    data: {
      memberId,
      note,
      status: "SWAPPED",
    },
    include: {
      member: { include: { user: true } },
    },
  });

  try {
    const { notifyAllUsersAboutBazarSwap } = await import("@/backend/notifications/notification.service");
    if (updated && updated.member) {
      await notifyAllUsersAboutBazarSwap({
        swappedDate: updated.date,
        newAssigneeName: updated.member.user?.name ?? "মেম্বার",
        reason: note,
      });
    }
  } catch (err) {
    console.warn("Failed to broadcast schedule update notification:", err);
  }

  return updated;
}

export async function assignBazarSchedule(data: {
  date: Date;
  memberId: string;
  dayName?: string;
  note?: string;
}) {
  const db = getPrisma();
  return db.bazarSchedule.upsert({
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
