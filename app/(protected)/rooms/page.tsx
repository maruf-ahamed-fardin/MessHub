import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getAllRooms, getAvailableSeats } from "@/backend/rooms/room.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { PageHeader } from "@/components/shared/PageHeader";
import { RoomsAndMembersHub } from "@/components/members/RoomsAndMembersHub";

export const metadata: Metadata = { title: "Rooms & Members" };

export default async function RoomsPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const [members, rooms, availableSeats] = await Promise.all([
    getAllMembers(true),
    getAllRooms(),
    getAvailableSeats(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rooms & Members"
        description="মেসের রুম, সিট ও মেম্বারদের বিবরণ এবং সিট বণ্টন"
      />
      <RoomsAndMembersHub
        members={members}
        rooms={rooms}
        availableSeats={availableSeats}
        isAdmin={isAdmin}
      />
    </div>
  );
}
