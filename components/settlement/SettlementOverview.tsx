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
        <Badge className={isFinalized ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}>
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
