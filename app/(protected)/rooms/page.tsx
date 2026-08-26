import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getAllRooms, getAvailableSeats } from "@/backend/rooms/room.repository";
import { getAllMembers } from "@/backend/members/member.repository";
import { PageHeader } from "@/components/shared/PageHeader";
import { RoomsAndMembersHub } from "@/components/members/RoomsAndMembersHub";
import { getServerT } from "@/lib/i18n/serverT";

export const metadata: Metadata = { title: "Rooms & Members" };

export default async function RoomsPage() {
  const [session, T] = await Promise.all([auth(), getServerT()]);
  const isAdmin = session?.user.role === "ADMIN";

  const [members, rooms, availableSeats] = await Promise.all([
    getAllMembers(true),
    getAllRooms(),
    getAvailableSeats(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={T.pages.rooms.title}
        description={T.pages.rooms.description}
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
