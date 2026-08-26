import { prisma } from "@/lib/db/prisma";
import { isMonthFinalized } from "@/backend/services/settlement.service";
import { roundMoney } from "@/backend/services/meal-calculation.service";
import { getMonthRange } from "@/lib/utils/date";

export async function getBazarList(month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);
  return prisma.bazar.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    include: {
      buyerMember: { include: { user: { select: { name: true, image: true } } } },
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function getBazarById(id: string) {
  return prisma.bazar.findUnique({
    where: { id },
    include: {
      buyerMember: { include: { user: true } },
      items: { include: { product: true } },
    },
  });
}

export async function createBazar(data: {
  date: Date;
  buyerId: string;
  note?: string;
  receiptUrl?: string;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    note?: string;
  }>;
}) {
  const month = data.date.getMonth() + 1;
  const year = data.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Bazar entries cannot be added.");
  }

  // Ensure buyerId resolves to a valid MemberProfile
  let validBuyerId = data.buyerId;
  const existingMember = await prisma.memberProfile.findUnique({ where: { id: validBuyerId } });
  if (!existingMember) {
    const byUser = await prisma.memberProfile.findUnique({ where: { userId: validBuyerId } });
    if (byUser) {
      validBuyerId = byUser.id;
    } else {
      const firstMember = await prisma.memberProfile.findFirst({ where: { isActive: true } });
      if (firstMember) {
        validBuyerId = firstMember.id;
      }
    }
  }

  const totalAmount = data.items.reduce(
    (sum, item) => {
      const q = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
      return sum + roundMoney(q * item.unitPrice);
    },
    0
  );

  return prisma.bazar.create({
    data: {
      date: data.date,
      buyerId: validBuyerId,
      totalAmount,
      note: data.note,
      receiptUrl: data.receiptUrl,
      items: {
        create: data.items.map((item) => {
          const q = item.quantity !== undefined && item.quantity > 0 ? item.quantity : 1;
          return {
            productId: item.productId,
            productName: item.productName,
            quantity: q,
            unit: item.unit || "kg",
            unitPrice: item.unitPrice,
            totalPrice: roundMoney(q * item.unitPrice),
            note: item.note,
          };
        }),
      },
    },
    include: { items: true },
  });
}

export async function updateBazar(
  id: string,
  data: { note?: string; receiptUrl?: string }
) {
  const bazar = await prisma.bazar.findUnique({ where: { id } });
  if (!bazar) throw new Error("Bazar entry not found.");
  const month = bazar.date.getMonth() + 1;
  const year = bazar.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Bazar entries cannot be modified.");
  }
  return prisma.bazar.update({ where: { id }, data });
}

export async function deleteBazar(id: string) {
  const bazar = await prisma.bazar.findUnique({ where: { id } });
  if (!bazar) throw new Error("Bazar entry not found.");
  const month = bazar.date.getMonth() + 1;
  const year = bazar.date.getFullYear();
  if (await isMonthFinalized(month, year)) {
    throw new Error("This month is finalized. Bazar entries cannot be deleted.");
  }
  return prisma.bazar.delete({ where: { id } });
}

export async function getProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createProduct(data: { name: string; unit: string }) {
  return prisma.product.create({ data });
}

export async function getProductReport(month: number, year: number) {
  const { startDate, endDate } = getMonthRange(month, year);

  const items = await prisma.bazarItem.findMany({
    where: { bazar: { date: { gte: startDate, lte: endDate } } },
    select: { productName: true, totalPrice: true, quantity: true, unit: true },
  });

  const byProduct: Record<string, { name: string; total: number; quantity: number; unit: string }> = {};
  for (const item of items) {
    const key = item.productName;
    if (!byProduct[key]) byProduct[key] = { name: key, total: 0, quantity: 0, unit: item.unit };
    byProduct[key].total += Number(item.totalPrice);
    byProduct[key].quantity += Number(item.quantity);
  }

  return Object.values(byProduct).sort((a, b) => b.total - a.total);
}
