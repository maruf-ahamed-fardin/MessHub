import { formatShortDate } from "@/lib/utils/date";
import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";

const MEAL_LABELS: Record<string, string> = { BREAKFAST: "☀️ Breakfast", LUNCH: "🍽️ Lunch", DINNER: "🌙 Dinner" };

export function GuestMealList({ guestMeals, isAdmin }: { guestMeals: any[]; isAdmin: boolean }) {
  if (guestMeals.length === 0) {
    return <EmptyState icon={UserPlus} title="No guest meals this month" description="Guest meals are tracked separately from member meals." />;
  }

  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
      {guestMeals.map((gm) => (
        <div key={gm.id} className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
            <UserPlus size={14} className="text-[hsl(var(--secondary-foreground))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{gm.guestName}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {gm.member?.user?.name} · {formatShortDate(gm.date)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <Badge variant="outline" className="text-xs mb-0.5">{MEAL_LABELS[gm.mealType]}</Badge>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">x{gm.quantity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
