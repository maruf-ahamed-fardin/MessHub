import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthYear } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { SettlementSummary } from "@/types";

export function SettlementOverview({ summary, isFinalized }: { summary: SettlementSummary; isFinalized: boolean }) {
  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{formatMonthYear(summary.month, summary.year)}</h2>
        <Badge
          className={cn(
            "font-black text-xs px-2.5 py-0.5 rounded-full border",
            isFinalized
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
          )}
        >
          {isFinalized ? "Finalized" : "Draft"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Food Expense", value: formatCurrency(summary.totalFoodExpense) },
          { label: "Total Meals", value: summary.totalNormalMeals.toString() },
          { label: "Meal Rate", value: `${formatCurrency(summary.mealRate)}/meal` },
          { label: "Total Utility", value: formatCurrency(summary.totalUtility) },
          { label: "Active Members", value: summary.activeMembers.toString() },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{label}</p>
            <p className="font-semibold text-sm">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
