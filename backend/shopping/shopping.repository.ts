import { prisma } from "@/lib/db/prisma";

export async function getShoppingItems() {
  return prisma.shoppingItem.findMany({
    include: {
      addedBy: { include: { user: { select: { name: true } } } },
      purchasedBy: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createShoppingItem(data: {
  name: string;
  quantity?: string;
  unit?: string;
  note?: string;
  addedById: string;
}) {
  return prisma.shoppingItem.create({ data: { ...data, status: "PENDING" } });
}

export async function markShoppingItemPurchased(id: string, purchasedById: string) {
  return prisma.shoppingItem.update({
    where: { id },
    data: { status: "PURCHASED", purchasedById, purchasedAt: new Date() },
  });
}

export async function deleteShoppingItem(id: string) {
  return prisma.shoppingItem.delete({ where: { id } });
}

export async function clearPurchasedItems() {
  return prisma.shoppingItem.deleteMany({ where: { status: "PURCHASED" } });
}
