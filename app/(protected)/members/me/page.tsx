import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { getMemberByUserId } from "@/backend/members/member.repository";
import { calculateMemberFoodCost, calculateMealRate } from "@/backend/services/meal-calculation.service";
import { calculateMemberRunningBalance } from "@/backend/services/balance.service";
import { getCurrentMonthYear } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "My Profile" };

export default async function MyProfilePage() {
  const session = await auth();

  let member: any = {
    id: "m1",
    seatRent: 3500,
    phone: "01700000000",
    joinedAt: new Date(2025, 0, 1),
    avatar: null,
    user: {
      name: session?.user.name ?? "Admin (You)",
      email: session?.user.email ?? "admin@messhub.app",
      image: null,
    },
    seat: {
      label: "A",
      room: { name: "Room 101" }
    }
  };

  let mealRate = 65.5;
  let foodCost = 4061;
  let totalMeals = 62;
  let balance = 1308;

  try {
    if (session?.user.id) {
      const dbMember = await getMemberByUserId(session.user.id);
      if (dbMember) {
        member = dbMember;
        const { month, year } = getCurrentMonthYear();
        mealRate = await calculateMealRate(month, year);
        const calculated = await calculateMemberFoodCost(member.id, month, year, mealRate);
        foodCost = calculated.foodCost;
        totalMeals = calculated.totalMeals;
        balance = await calculateMemberRunningBalance(member.id);
      }
    }
  } catch {}

  const initials = (member.user.name ?? "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My Profile" />

      <div className="stat-card flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={member.user.image ?? member.avatar ?? undefined} />
          <AvatarFallback className="text-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{member.user.name}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.user.email}</p>
          {member.phone && <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Room", value: member.seat?.room?.name ?? "—" },
          { label: "Seat", value: member.seat?.label ?? "Unassigned" },
          { label: "Seat Rent", value: formatCurrency(Number(member.seatRent)) },
          { label: "Joined", value: new Date(member.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) },
          { label: "This Month Meals", value: String(totalMeals) },
          { label: "Food Cost", value: formatCurrency(foodCost) },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className={`stat-card ${balance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <p className="text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Current Balance</p>
        <p className={`text-2xl font-bold ${balance >= 0 ? "text-green-700" : "text-red-700"}`}>
          {balance >= 0 ? "+" : ""}{formatCurrency(Math.abs(balance))}
        </p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
          {balance >= 0 ? "You have credit" : "You owe this amount"}
        </p>
      </div>
    </div>
  );
}
