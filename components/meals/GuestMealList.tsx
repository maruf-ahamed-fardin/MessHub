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
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl divide-y divide-gray-100 dark:divide-slate-800 shadow-2xs overflow-hidden">
      {guestMeals.map((gm) => (
        <div key={gm.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
            <UserPlus size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{gm.guestName}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {gm.member?.user?.name} · {formatShortDate(gm.date)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <Badge variant="outline" className="text-xs mb-0.5 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200">{MEAL_LABELS[gm.mealType]}</Badge>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">x{gm.quantity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
