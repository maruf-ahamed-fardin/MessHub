import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getMemberById } from "@/backend/members/member.repository";
import { getAllRooms, getAvailableSeats } from "@/backend/rooms/room.repository";
import { calculateMemberFoodCost, calculateMealRate } from "@/backend/services/meal-calculation.service";
import { calculateMemberRunningBalance } from "@/backend/services/balance.service";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { MemberManageForm } from "@/components/members/MemberManageForm";

export const metadata: Metadata = { title: "Manage Member" };

export default async function ManageMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const member = await getMemberById(id);
  if (!member) notFound();

  const { month, year } = getCurrentMonthYear();
  const mealRate = await calculateMealRate(month, year);
  const { foodCost, totalMeals } = await calculateMemberFoodCost(member.id, month, year, mealRate);
  const balance = await calculateMemberRunningBalance(member.id);

  const [rooms, availableSeats] = await Promise.all([
    getAllRooms(),
    getAvailableSeats(),
  ]);

  const initials = (member.user.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={member.user.name ?? "Member"}
        description={`Manage seat, rent, and status`}
      />

      <div className="stat-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={member.user.image ?? member.avatar ?? undefined} />
            <AvatarFallback className="text-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{member.user.name}</h2>
              <Badge variant={member.isActive ? "default" : "outline"} className={member.isActive ? "bg-green-600" : ""}>
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
              {member.user.role === "ADMIN" && <Badge className="bg-[hsl(var(--primary))]">Admin</Badge>}
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.user.email}</p>
            {member.phone && <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.phone}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Room / Seat</p>
          <p className="font-semibold">{member.seat ? `${member.seat.room?.name} - ${member.seat.label}` : "None"}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Seat Rent</p>
          <p className="font-semibold">{formatCurrency(Number(member.seatRent))}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Meals (This Month)</p>
          <p className="font-semibold">{totalMeals}</p>
        </div>
        <div className={`stat-card ${balance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Current Balance</p>
          <p className={`font-semibold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>
            {balance >= 0 ? "+" : ""}{formatCurrency(Math.abs(balance))}
          </p>
        </div>
      </div>

      {isAdmin && (
        <MemberManageForm
          member={member}
          rooms={rooms}
          availableSeats={availableSeats}
        />
      )}
    </div>
  );
}
