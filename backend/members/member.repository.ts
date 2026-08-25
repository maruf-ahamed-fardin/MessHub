import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { MemberProfile, User } from "@prisma/client";

export type MemberWithUser = MemberProfile & { user: User };

export async function getAllMembers(includeInactive = false) {
  return prisma.memberProfile.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, image: true } },
      seat: { include: { room: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export async function getMemberById(id: string) {
  return prisma.memberProfile.findUnique({
    where: { id },
    include: {
      user: true,
      seat: { include: { room: true } },
    },
  });
}

export async function getMemberByUserId(userId: string) {
  return prisma.memberProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      seat: { include: { room: true } },
    },
  });
}

export async function createMember(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  seatRent?: number;
  roomId?: string;
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new Error("A user with this email already exists.");

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "MEMBER",
      member: {
        create: {
          phone: data.phone,
          seatRent: data.seatRent ?? 0,
          roomId: data.roomId,
        },
      },
    },
    include: { member: true },
  });
}

export async function updateMember(
  memberId: string,
  data: {
    name?: string;
    phone?: string;
    seatRent?: number;
    roomId?: string | null;
    avatar?: string;
  }
) {
  const member = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    include: { user: true },
  });
  if (!member) throw new Error("Member not found.");

  await prisma.$transaction(async (tx) => {
    if (data.name) {
      await tx.user.update({
        where: { id: member.userId },
        data: { name: data.name },
      });
    }
    await tx.memberProfile.update({
      where: { id: memberId },
      data: {
        phone: data.phone,
        seatRent: data.seatRent,
        roomId: data.roomId,
        avatar: data.avatar,
      },
    });
  });
}

export async function deactivateMember(memberId: string) {
  const member = await prisma.memberProfile.findUnique({
    where: { id: memberId },
    include: { seat: true },
  });
  if (!member) throw new Error("Member not found.");

  await prisma.$transaction(async (tx) => {
    // Free the seat
    if (member.seat) {
      await tx.seat.update({
        where: { id: member.seat.id },
        data: { isOccupied: false, currentMemberId: null },
      });
    }
    // Deactivate member
    await tx.memberProfile.update({
      where: { id: memberId },
      data: { isActive: false, leftAt: new Date() },
    });
  });
}

export async function assignSeat(memberId: string, seatId: string) {
  const [member, seat] = await Promise.all([
    prisma.memberProfile.findUnique({ where: { id: memberId }, include: { seat: true } }),
    prisma.seat.findUnique({ where: { id: seatId }, include: { room: true } }),
  ]);

  if (!member) throw new Error("Member not found.");
  if (!seat) throw new Error("Seat not found.");
  if (seat.isOccupied && seat.currentMemberId !== memberId) {
    throw new Error("This seat is already occupied by another member.");
  }

  await prisma.$transaction(async (tx) => {
    // Free previous seat if any
    if (member.seat && member.seat.id !== seatId) {
      await tx.seat.update({
        where: { id: member.seat.id },
        data: { isOccupied: false, currentMemberId: null },
      });
    }
    // Assign new seat
    await tx.seat.update({
      where: { id: seatId },
      data: { isOccupied: true, currentMemberId: memberId },
    });
    // Update member's room
    await tx.memberProfile.update({
      where: { id: memberId },
      data: { roomId: seat.roomId },
    });
  });
}
