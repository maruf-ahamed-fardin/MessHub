import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function seedUtilities() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const bills = [
    { type: "RENT", amount: 24500, note: "বাসা ভাড়া (৭ জনের জন্য মোট)" },
    { type: "ELECTRICITY", amount: 2100, note: "ডেসকো / কারেন্ট বিল" },
    { type: "GAS", amount: 1050, note: "তিতাস গ্যাস বিল" },
    { type: "WATER", amount: 700, note: "ওয়াসা পানি বিল" },
    { type: "INTERNET", amount: 1050, note: "ওয়াইফাই ব্রডব্যান্ড বিল" },
    { type: "COOK", amount: 2100, note: "রান্না ও খালা বিল" },
    { type: "WASTE", amount: 350, note: "ময়লা ও ক্লিনিং ফি" },
  ];

  for (const b of bills) {
    await prisma.utilityBill.upsert({
      where: { type_month_year: { type: b.type as any, month, year } },
      create: {
        type: b.type as any,
        amount: b.amount,
        month,
        year,
        date: new Date(),
        note: b.note,
      },
      update: {
        amount: b.amount,
        note: b.note,
      },
    });
  }

  console.log("✅ 7-Person Utility Bills seeded successfully for current month!");
}

seedUtilities().finally(() => prisma.$disconnect());
