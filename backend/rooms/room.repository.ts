import { prisma } from "@/lib/db/prisma";

export async function getAllRooms() {
  return prisma.room.findMany({
    include: {
      seats: {
        include: {
          currentMember: {
            include: { user: { select: { name: true, image: true } } },
          },
        },
        orderBy: { label: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRoomById(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: {
      seats: {
        include: { currentMember: { include: { user: true } } },
        orderBy: { label: "asc" },
      },
    },
  });
}

export async function createRoom(data: { name: string; floor?: string; description?: string }) {
  return prisma.room.create({ data });
}

export async function updateRoom(id: string, data: { name?: string; floor?: string; description?: string }) {
  return prisma.room.update({ where: { id }, data });
}

export async function deleteRoom(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: { seats: { where: { isOccupied: true } } },
  });
  if (!room) throw new Error("Room not found.");
  if (room.seats.length > 0) throw new Error("Cannot delete room with occupied seats.");
  return prisma.room.delete({ where: { id } });
}

export async function createSeat(data: { roomId: string; label: string }) {
  const existing = await prisma.seat.findUnique({
    where: { roomId_label: { roomId: data.roomId, label: data.label } },
  });
  if (existing) throw new Error(`Seat "${data.label}" already exists in this room.`);
  return prisma.seat.create({ data });
}

export async function deleteSeat(id: string) {
  const seat = await prisma.seat.findUnique({ where: { id } });
  if (!seat) throw new Error("Seat not found.");
  if (seat.isOccupied) throw new Error("Cannot delete an occupied seat. Remove the member first.");
  return prisma.seat.delete({ where: { id } });
}

export async function getAvailableSeats() {
  return prisma.seat.findMany({
    where: { isOccupied: false },
    include: { room: true },
    orderBy: [{ room: { name: "asc" } }, { label: "asc" }],
  });
}
