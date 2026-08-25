import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { TrendingDown, TrendingUp, UtensilsCrossed, BedDouble } from "lucide-react";
import { Meal } from "@prisma/client";

interface PersonalSummaryProps {
  balance: number;
  foodCost: number;
  totalMeals: number;
  todayMeal: Meal | null;
  room: string | null;
  seat: string | null;
  mealRate: number;
}

export function PersonalSummary({
  balance, foodCost, totalMeals, todayMeal, room, seat, mealRate
}: PersonalSummaryProps) {
  const isCredit = balance >= 0;

  return (
    <div>
      <p className="section-heading">My Summary</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Balance */}
        <div className="stat-card col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Current Balance</p>
            {isCredit
              ? <TrendingUp size={14} className="text-[hsl(var(--success))]" />
              : <TrendingDown size={14} className="text-destructive" />}
          </div>
          <p className={cn("text-2xl font-semibold", isCredit ? "balance-positive" : "balance-negative")}>
            {isCredit ? "+" : ""}{formatCurrency(Math.abs(balance))}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {isCredit ? "Credit" : "You owe"}
          </p>
        </div>

        {/* Food Cost */}
        <div className="stat-card">
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium mb-2">This Month Food</p>
          <p className="text-xl font-semibold">{formatCurrency(foodCost)}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Rate: {formatCurrency(mealRate)}/meal
          </p>
        </div>

        {/* Meals */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Total Meals</p>
            <UtensilsCrossed size={14} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-xl font-semibold">{totalMeals}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">This month</p>
        </div>

        {/* Room / Seat */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Room & Seat</p>
            <BedDouble size={14} className="text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="text-xl font-semibold">{room ?? "—"}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Seat {seat ?? "Unassigned"}
          </p>
        </div>
      </div>

      {/* Today's Meals */}
      {todayMeal !== undefined && (
        <div className="mt-3 stat-card">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Today's Meals</p>
          <div className="flex gap-4">
            {[
              { label: "Breakfast", key: "breakfast" as const, emoji: "☀️" },
              { label: "Lunch", key: "lunch" as const, emoji: "🍽️" },
              { label: "Dinner", key: "dinner" as const, emoji: "🌙" },
            ].map(({ label, key, emoji }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-base">{emoji}</span>
                <div>
                  <p className="text-xs font-medium">{label}</p>
                  <p className={cn("text-xs", todayMeal?.[key] ? "text-[hsl(var(--success))]" : "text-[hsl(var(--muted-foreground))]")}>
                    {todayMeal === null ? "—" : todayMeal[key] ? "✓ Eating" : "Skipped"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
