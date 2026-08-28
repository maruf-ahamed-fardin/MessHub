"use server";

import { getPrisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/backend/permissions/permission.service";
import { revalidatePath } from "next/cache";

export interface DatabaseBackupPayload {
  version: string;
  exportedAt: string;
  messSettings: any;
  users: any[];
  memberProfiles: any[];
  rooms: any[];
  seats: any[];
  meals: any[];
  guestMeals: any[];
  products: any[];
  bazars: any[];
  bazarItems: any[];
  bazarSchedules: any[];
  bazarSwapRequests: any[];
  expenses: any[];
  utilityBills: any[];
  payments: any[];
  monthlySettlements: any[];
  memberSettlements: any[];
  cleaningTasks: any[];
  householdTasks: any[];
  maintenanceReports: any[];
  shoppingItems: any[];
  communityPosts: any[];
  postComments: any[];
  postReactions: any[];
  notices: any[];
  calendarEvents: any[];
  contactEntries: any[];
  cookAttendances: any[];
}

export async function exportDatabaseBackupAction(): Promise<{ success: boolean; data?: DatabaseBackupPayload; error?: string }> {
  try {
    await requireAdmin();
    const db = getPrisma();

    const [
      messSettings,
      users,
      memberProfiles,
      rooms,
      seats,
      meals,
      guestMeals,
      products,
      bazars,
      bazarItems,
      bazarSchedules,
      bazarSwapRequests,
      expenses,
      utilityBills,
      payments,
      monthlySettlements,
      memberSettlements,
      cleaningTasks,
      householdTasks,
      maintenanceReports,
      shoppingItems,
      communityPosts,
      postComments,
      postReactions,
      notices,
      calendarEvents,
      contactEntries,
      cookAttendances,
    ] = await Promise.all([
      db.messSettings.findUnique({ where: { id: "singleton" } }),
      db.user.findMany(),
      db.memberProfile.findMany(),
      db.room.findMany(),
      db.seat.findMany(),
      db.meal.findMany(),
      db.guestMeal.findMany(),
      db.product.findMany(),
      db.bazar.findMany(),
      db.bazarItem.findMany(),
      db.bazarSchedule.findMany(),
      db.bazarSwapRequest.findMany(),
      db.expense.findMany(),
      db.utilityBill.findMany(),
      db.payment.findMany(),
      db.monthlySettlement.findMany(),
      db.memberSettlement.findMany(),
      db.cleaningTask.findMany(),
      db.householdTask.findMany(),
      db.maintenanceReport.findMany(),
      db.shoppingItem.findMany(),
      db.communityPost.findMany(),
      db.postComment.findMany(),
      db.postReaction.findMany(),
      db.notice.findMany(),
      db.calendarEvent.findMany(),
      db.contactEntry.findMany(),
      db.cookAttendance.findMany(),
    ]);

    const payload: DatabaseBackupPayload = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      messSettings,
      users,
      memberProfiles,
      rooms,
      seats,
      meals,
      guestMeals,
      products,
      bazars,
      bazarItems,
      bazarSchedules,
      bazarSwapRequests,
      expenses,
      utilityBills,
      payments,
      monthlySettlements,
      memberSettlements,
      cleaningTasks,
      householdTasks,
      maintenanceReports,
      shoppingItems,
      communityPosts,
      postComments,
      postReactions,
      notices,
      calendarEvents,
      contactEntries,
      cookAttendances,
    };

    return { success: true, data: payload };
  } catch (err: any) {
    console.error("Error exporting database backup:", err);
    return { success: false, error: err?.message || "Failed to export database backup" };
  }
}

export async function importDatabaseBackupAction(payload: DatabaseBackupPayload): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const db = getPrisma();

    if (!payload || !payload.users || !payload.memberProfiles) {
      return { success: false, error: "Invalid backup format or missing critical tables." };
    }

    // 1. Settings
    if (payload.messSettings) {
      await db.messSettings.upsert({
        where: { id: "singleton" },
        create: { ...payload.messSettings, id: "singleton" },
        update: { ...payload.messSettings, id: "singleton" },
      });
    }

    // 2. Rooms & Seats
    if (payload.rooms) {
      for (const r of payload.rooms) {
        await db.room.upsert({
          where: { id: r.id },
          create: { id: r.id, name: r.name, floor: r.floor, description: r.description },
          update: { name: r.name, floor: r.floor, description: r.description },
        });
      }
    }

    if (payload.seats) {
      for (const s of payload.seats) {
        await db.seat.upsert({
          where: { id: s.id },
          create: { id: s.id, roomId: s.roomId, label: s.label, isOccupied: Boolean(s.isOccupied), currentMemberId: s.currentMemberId },
          update: { roomId: s.roomId, label: s.label, isOccupied: Boolean(s.isOccupied), currentMemberId: s.currentMemberId },
        });
      }
    }

    // 3. Users & Profiles
    for (const u of payload.users) {
      await db.user.upsert({
        where: { id: u.id },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          password: u.password,
          role: u.role,
        },
        update: {
          name: u.name,
          email: u.email,
          image: u.image,
          role: u.role,
        },
      });
    }

    for (const m of payload.memberProfiles) {
      await db.memberProfile.upsert({
        where: { id: m.id },
        create: {
          id: m.id,
          userId: m.userId,
          phone: m.phone,
          avatar: m.avatar,
          isActive: Boolean(m.isActive),
          seatRent: Number(m.seatRent) || 0,
          securityDeposit: Number(m.securityDeposit) || 0,
          advanceFund: Number(m.advanceFund) || 0,
          roomId: m.roomId,
        },
        update: {
          phone: m.phone,
          avatar: m.avatar,
          isActive: Boolean(m.isActive),
          seatRent: Number(m.seatRent) || 0,
          securityDeposit: Number(m.securityDeposit) || 0,
          advanceFund: Number(m.advanceFund) || 0,
          roomId: m.roomId,
        },
      });
    }

    // 4. Products
    if (payload.products) {
      for (const p of payload.products) {
        await db.product.upsert({
          where: { id: p.id },
          create: { id: p.id, name: p.name, unit: p.unit || "kg", isActive: Boolean(p.isActive) },
          update: { name: p.name, unit: p.unit || "kg", isActive: Boolean(p.isActive) },
        });
      }
    }

    // 5. Meals
    if (payload.meals) {
      for (const meal of payload.meals) {
        const d = new Date(meal.date);
        await db.meal.upsert({
          where: { memberId_date: { memberId: meal.memberId, date: d } },
          create: {
            id: meal.id,
            memberId: meal.memberId,
            date: d,
            breakfast: Boolean(meal.breakfast),
            lunch: Boolean(meal.lunch),
            dinner: Boolean(meal.dinner),
            note: meal.note,
          },
          update: {
            breakfast: Boolean(meal.breakfast),
            lunch: Boolean(meal.lunch),
            dinner: Boolean(meal.dinner),
            note: meal.note,
          },
        });
      }
    }

    // 6. Expenses & Payments
    if (payload.expenses) {
      for (const exp of payload.expenses) {
        await db.expense.upsert({
          where: { id: exp.id },
          create: {
            id: exp.id,
            title: exp.title,
            category: exp.category,
            amount: Number(exp.amount) || 0,
            date: new Date(exp.date),
            paidById: exp.paidById,
            sharingMethod: exp.sharingMethod || "EQUAL",
            selectedMemberIds: exp.selectedMemberIds || "",
            note: exp.note,
            receiptUrl: exp.receiptUrl,
          },
          update: {
            title: exp.title,
            category: exp.category,
            amount: Number(exp.amount) || 0,
            date: new Date(exp.date),
            paidById: exp.paidById,
            sharingMethod: exp.sharingMethod || "EQUAL",
            selectedMemberIds: exp.selectedMemberIds || "",
            note: exp.note,
            receiptUrl: exp.receiptUrl,
          },
        });
      }
    }

    if (payload.payments) {
      for (const p of payload.payments) {
        await db.payment.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            memberId: p.memberId,
            amount: Number(p.amount) || 0,
            date: new Date(p.date),
            method: p.method || "CASH",
            note: p.note,
            recordedById: p.recordedById || "admin-member-1",
          },
          update: {
            memberId: p.memberId,
            amount: Number(p.amount) || 0,
            date: new Date(p.date),
            method: p.method || "CASH",
            note: p.note,
          },
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/meals");
    revalidatePath("/bazar");
    revalidatePath("/expenses");
    revalidatePath("/settlement");
    revalidatePath("/members");
    revalidatePath("/settings");

    return { success: true };
  } catch (err: any) {
    console.error("Error restoring database backup:", err);
    return { success: false, error: err?.message || "Failed to restore database backup" };
  }
}
