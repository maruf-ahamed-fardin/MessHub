"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/backend/permissions/permission.service";
import { prisma } from "@/lib/db/prisma";

export async function getContactsAction() {
  await requireAuth();
  return prisma.contactEntry.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createContactAction(data: {
  name: string;
  role: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  note?: string;
  emoji?: string;
  sortOrder?: number;
}) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  await prisma.contactEntry.create({
    data: {
      name: data.name,
      role: data.role,
      phone: data.phone || null,
      phone2: data.phone2 || null,
      email: data.email || null,
      address: data.address || null,
      note: data.note || null,
      emoji: data.emoji || null,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContactAction(
  id: string,
  data: {
    name?: string;
    role?: string;
    phone?: string;
    phone2?: string;
    email?: string;
    address?: string;
    note?: string;
    emoji?: string;
    sortOrder?: number;
  }
) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  await prisma.contactEntry.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.phone2 !== undefined && { phone2: data.phone2 || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.note !== undefined && { note: data.note || null }),
      ...(data.emoji !== undefined && { emoji: data.emoji || null }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
  revalidatePath("/contacts");
  return { success: true };
}

export async function deleteContactAction(id: string) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  await prisma.contactEntry.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/contacts");
  return { success: true };
}
