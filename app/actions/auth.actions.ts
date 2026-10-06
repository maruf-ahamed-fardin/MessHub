"use server";

import { getPrisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function registerMemberWithInviteCodeAction(data: {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  roomId?: string;
}) {
  const db = getPrisma();
  const cleanCode = data.inviteCode?.trim().toUpperCase();

  if (!cleanCode) {
    return { success: false, error: "Please enter the Mess Invite Code." };
  }

  // 1. Verify Invite Code against Mess Settings
  let settings = await db.messSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.messSettings.create({
      data: { id: "singleton", messName: "MessHub", inviteCode: "MESSHUB2026" },
    });
  }

  const validCode = (settings.inviteCode?.trim() || "MESSHUB2026").toUpperCase();
  if (cleanCode !== validCode) {
    return {
      success: false,
      error: "ভুল ইনভাইট কোড! অনুগ্রহ করে আপনার মেস এডমিন বা ম্যানেজারের কাছ থেকে সঠিক কোডটি জেনে নিন। (Invalid Invite Code)",
    };
  }

  // 2. Validate email
  const cleanEmail = data.email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please provide a valid email address." };
  }

  const existingUser = await db.user.findUnique({ where: { email: cleanEmail } });
  if (existingUser) {
    return {
      success: false,
      error: "এই ইমেইল দিয়ে ইতোমধ্যে একটি একাউন্ট খোলা রয়েছে। দয়া করে লগইন করুন। (Email is already registered)",
    };
  }

  if (!data.password || data.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  // 3. Hash password and create User + MemberProfile
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const defaultSeatRent = settings.defaultSeatRent || 0;

  const newUser = await db.user.create({
    data: {
      name: data.name?.trim() || "New Member",
      email: cleanEmail,
      password: hashedPassword,
      role: "MEMBER",
      member: {
        create: {
          phone: data.phone?.trim() || null,
          seatRent: defaultSeatRent,
          roomId: data.roomId || null,
          isActive: true,
        },
      },
    },
    include: {
      member: true,
    },
  });

  // Welcome notification
  await db.notification.create({
    data: {
      userId: newUser.id,
      title: "MessHub-এ স্বাগতম! 🎉",
      message: `${settings.messName} মেসে আপনার একাউন্ট সফলভাবে যুক্ত হয়েছে। এখন থেকে প্রতিদিনের মিল, বাজার ও ব্যালেন্স ট্র্যাকিং করতে পারবেন।`,
      type: "GENERAL",
      isRead: false,
    },
  });

  revalidatePath("/members");
  revalidatePath("/dashboard");

  return { success: true, email: cleanEmail };
}
