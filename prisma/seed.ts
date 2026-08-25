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

const SEVEN_MEMBERS = [
  { id: "member-admin", name: "Admin (You)", email: "admin@messhub.app", role: "ADMIN", room: "room-1", seatLabel: "A" },
  { id: "member-tanvir", name: "Tanvir Ahmed", email: "tanvir@example.com", role: "MEMBER", room: "room-1", seatLabel: "B" },
  { id: "member-rahim", name: "Rahim Chowdhury", email: "rahim@example.com", role: "MEMBER", room: "room-2", seatLabel: "A" },
  { id: "member-karim", name: "Karim Hasan", email: "karim@example.com", role: "MEMBER", room: "room-2", seatLabel: "B" },
  { id: "member-nafis", name: "Nafis Iqbal", email: "nafis@example.com", role: "MEMBER", room: "room-3", seatLabel: "A" },
  { id: "member-shakil", name: "Shakil Mahmud", email: "shakil@example.com", role: "MEMBER", room: "room-3", seatLabel: "B" },
  { id: "member-sifat", name: "Sifat Khan", email: "sifat@example.com", role: "MEMBER", room: "room-4", seatLabel: "A" },
];

const DAY_NAMES = ["রবিবার (Sun)", "সোমবার (Mon)", "মঙ্গলবার (Tue)", "বুধবার (Wed)", "বৃহস্পতিবার (Thu)", "শুক্রবার (Fri)", "শনিবার (Sat)"];

async function main() {
  console.log("🌱 Seeding MessHub database with 7 members and weekly bazar rotation...");

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

  // 2. Rooms
  const rooms = ["room-1", "room-2", "room-3", "room-4"];
  for (let i = 0; i < rooms.length; i++) {
    await prisma.room.upsert({
      where: { id: rooms[i] },
      create: { id: rooms[i], name: `Room 10${i + 1}`, floor: "1st Floor" },
      update: {},
    });
  }

  // 3. Seats
  for (const r of rooms) {
    for (const label of ["A", "B"]) {
      await prisma.seat.upsert({
        where: { roomId_label: { roomId: r, label } },
        create: { id: `seat-${r}-${label}`, roomId: r, label, isOccupied: true },
        update: { isOccupied: true },
      });
    }
  }

  // 4. Seed 7 Members
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
      await prisma.seat.updateMany({
        where: { roomId: m.room, label: m.seatLabel },
        data: { currentMemberId: user.member.id, isOccupied: true },
      });
    }
  }
  console.log(`✅ 7 members and room seats seeded`);

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
    const dayIndex = scheduleDate.getUTCDay(); // 0: Sun, 1: Mon, ... 6: Sat
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
  console.log(`✅ 7-Day Weekly Bazar Schedule created`);

  // 8. Sample Bazar
  const tanvir = createdProfiles.find((m) => m.id === "member-tanvir") ?? createdProfiles[1];
  if (tanvir) {
    const existingBazar = await prisma.bazar.findFirst();
    if (!existingBazar) {
      await prisma.bazar.create({
        data: {
          date: today,
          buyerId: tanvir.id,
          totalAmount: 2450,
          note: "Weekly grocery market",
          items: {
            create: [
              { productName: "Rice", quantity: 25, unit: "kg", unitPrice: 60, totalPrice: 1500 },
              { productName: "Chicken", quantity: 3, unit: "kg", unitPrice: 220, totalPrice: 660 },
              { productName: "Onion", quantity: 5, unit: "kg", unitPrice: 58, totalPrice: 290 },
            ],
          },
        },
      });
    }
  }

  // 9. Sample Payments
  for (const prof of createdProfiles.slice(0, 3)) {
    const existingPayment = await prisma.payment.findFirst({ where: { memberId: prof.id } });
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          memberId: prof.id,
          amount: 8000,
          date: today,
          method: "BKASH",
          recordedById: "member-admin",
          note: "Monthly deposit",
        },
      });
    }
  }

  // 10. Sample Tasks & Notices
  const existingNotice = await prisma.notice.findFirst();
  if (!existingNotice) {
    await prisma.notice.create({
      data: {
        title: "Mess Meeting Tonight at 9:00 PM",
        description: "Monthly meal calculation and settlement discussion in the dining area. Everyone must attend.",
        priority: "IMPORTANT",
        authorId: "member-admin",
      },
    });
  }

  console.log("🎉 Seed complete! 7 Members and weekly bazar schedule are ready.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
