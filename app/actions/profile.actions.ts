"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/backend/permissions/permission.service";
import { prisma } from "@/lib/db/prisma";

export async function updateProfileAction(data: {
  name?: string;
  phone?: string;
  avatar?: string | null; // base64 data URL or null to remove
}) {
  const session = await requireAuth();

  // Update user name on the User record
  if (data.name !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name.trim() },
    });
  }

  // Update phone and avatar on the MemberProfile record
  const memberData: Record<string, unknown> = {};
  if (data.phone !== undefined) memberData.phone = data.phone || null;
  if (data.avatar !== undefined) memberData.avatar = data.avatar;

  if (Object.keys(memberData).length > 0) {
    await prisma.memberProfile.update({
      where: { userId: session.user.id },
      data: memberData,
    });
  }

  revalidatePath("/members/me");
  return { success: true };
}
