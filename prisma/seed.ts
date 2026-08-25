import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_PRODUCTS = [
  { name: "Rice", unit: "kg" },
  { name: "Chicken", unit: "kg" },
  { name: "Egg", unit: "dozen" },
  { name: "Oil", unit: "litre" },
  { name: "Onion", unit: "kg" },
  { name: "Potato", unit: "kg" },
  { name: "Salt", unit: "kg" },
  { name: "Vegetables", unit: "kg" },
  { name: "Fish", unit: "kg" },
  { name: "Lentils", unit: "kg" },
];

// 3 Rooms (2, 2, 3) = 7 Members
const THREE_ROOMS = [
  { id: "room-1", name: "Room 101", floor: "1st Floor", type: "Double Bed (2 Seats)", seats: ["A", "B"] },
  { id: "room-2", name: "Room 102", floor: "1st Floor", type: "Double Bed (2 Seats)", seats: ["A", "B"] },
  { id: "room-3", name: "Room 103", floor: "1st Floor", type: "Triple Bed (3 Seats)", seats: ["A", "B", "C"] },
];

const SEVEN_MEMBERS = [
  { id: "member-admin", name: "Admin (You)", email: "admin@messhub.app", role: "ADMIN", room: "room-1", seatLabel: "A" },
  { id: "member-tanvir", name: "Tanvir Ahmed", email: "tanvir@example.com", role: "MEMBER", room: "room-1", seatLabel: "B" },
  { id: "member-rahim", name: "Rahim Chowdhury", email: "rahim@example.com", role: "MEMBER", room: "room-2", seatLabel: "A" },
  { id: "member-karim", name: "Karim Hasan", email: "karim@example.com", role: "MEMBER", room: "room-2", seatLabel: "B" },
  { id: "member-nafis", name: "Nafis Iqbal", email: "nafis@example.com", role: "MEMBER", room: "room-3", seatLabel: "A" },
  { id: "member-shakil", name: "Shakil Mahmud", email: "shakil@example.com", role: "MEMBER", room: "room-3", seatLabel: "B" },
  { id: "member-sifat", name: "Sifat Khan", email: "sifat@example.com", role: "MEMBER", room: "room-3", seatLabel: "C" },
];

const DAY_NAMES = ["রবিবার (Sun)", "সোমবার (Mon)", "মঙ্গলবার (Tue)", "বুধবার (Wed)", "বৃহস্পতিবার (Thu)", "শুক্রবার (Fri)", "শনিবার (Sat)"];

async function main() {
  console.log("🌱 Seeding MessHub with 3 Rooms (2, 2, 3) and 7 Members...");

  // 1. MessSettings
  await prisma.messSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      messName: "MessHub Flat 4B",
      address: "House 12, Road 4, Dhanmondi, Dhaka",
      currency: "৳",
      guestMealPricing: "DYNAMIC",
      guestMealResponsibility: "MEMBER",
      defaultSeatRent: 3500,
      defaultExpenseSharingMethod: "EQUAL",
      messRules: "1. Lock the main door when leaving.\n2. Turn off lights/AC/fans after use.\n3. Keep dining area and kitchen clean after meals.",
    },
    update: {},
  });

  // 2. Clean up obsolete rooms/seats if any
  await prisma.seat.deleteMany({
    where: { roomId: { notIn: ["room-1", "room-2", "room-3"] } },
  });
  await prisma.room.deleteMany({
    where: { id: { notIn: ["room-1", "room-2", "room-3"] } },
  });

  // 3. Upsert 3 Rooms
  for (const r of THREE_ROOMS) {
    await prisma.room.upsert({
      where: { id: r.id },
      create: { id: r.id, name: r.name, floor: r.floor },
      update: { name: r.name, floor: r.floor },
    });

    for (const label of r.seats) {
      await prisma.seat.upsert({
        where: { roomId_label: { roomId: r.id, label } },
        create: { id: `seat-${r.id}-${label}`, roomId: r.id, label, isOccupied: true },
        update: { isOccupied: true },
      });
    }
  }

  // 4. Seed 7 Members into the 3 Rooms (2, 2, 3)
  const memberPassword = await bcrypt.hash("member123", 10);
  const createdProfiles: any[] = [];

  for (const m of SEVEN_MEMBERS) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      create: {
        email: m.email,
        name: m.name,
        password: memberPassword,
        role: m.role as any,
        member: {
          create: {
            id: m.id,
            seatRent: 3500,
            isActive: true,
            roomId: m.room,
          },
        },
      },
      update: { name: m.name, role: m.role as any },
      include: { member: true },
    });

    if (user.member) {
      createdProfiles.push(user.member);
      // Link member to room & seat
      await prisma.memberProfile.update({
        where: { id: user.member.id },
        data: { roomId: m.room },
      });

      await prisma.seat.updateMany({
        where: { roomId: m.room, label: m.seatLabel },
        data: { currentMemberId: user.member.id, isOccupied: true },
      });
    }
  }
  console.log(`✅ 3 Rooms (2, 2, 3) & 7 Members seeded perfectly`);

  // 5. Default Products
  for (const product of DEFAULT_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: `default-${product.name.toLowerCase().replace(/\s+/g, "-")}` },
      create: {
        id: `default-${product.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: product.name,
        unit: product.unit,
        isActive: true,
      },
      update: {},
    });
  }

  // 6. Today's Meals for all 7 members
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  for (const prof of createdProfiles) {
    await prisma.meal.upsert({
      where: { memberId_date: { memberId: prof.id, date: today } },
      create: { memberId: prof.id, date: today, breakfast: true, lunch: true, dinner: true },
      update: {},
    });
  }

  // 7. Seed 7-Day Weekly Bazar Rotation Schedule
  for (let i = 0; i < 7; i++) {
    const scheduleDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + i));
    const dayIndex = scheduleDate.getUTCDay();
    const assignedMember = createdProfiles[i % createdProfiles.length];

    await prisma.bazarSchedule.upsert({
      where: { date: scheduleDate },
      create: {
        date: scheduleDate,
        dayName: DAY_NAMES[dayIndex],
        memberId: assignedMember.id,
        status: i === 0 ? "DONE" : "PENDING",
        note: i === 0 ? "আজকের বাজার সম্পন্ন" : `সাপ্তাহিক বাজার দায়িত্ব`,
      },
      update: {
        dayName: DAY_NAMES[dayIndex],
        memberId: assignedMember.id,
      },
    });
  }
  console.log(`✅ 7-Day Weekly Bazar Schedule synced`);

  console.log("🎉 Seed complete! 3 Rooms (2, 2, 3) and 7 Members configured.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
