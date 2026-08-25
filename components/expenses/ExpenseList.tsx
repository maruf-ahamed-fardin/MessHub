import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants/categories";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";

export function ExpenseList({ expenses, isAdmin }: { expenses: any[]; isAdmin: boolean }) {
  if (expenses.length === 0) {
    return <EmptyState icon={Receipt} title="No expenses this month" description="Non-food expenses will appear here." />;
  }

  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{expense.title}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                {EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}
              </Badge>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {expense.paidBy?.user?.name} · {formatShortDate(expense.date)} · {expense.sharingMethod.replace("_", " ")}
            </p>
          </div>
          <p className="text-sm font-semibold shrink-0">{formatCurrency(Number(expense.amount))}</p>
        </div>
      ))}
    </div>
  );
}

export function UtilitySection({ utilities, isAdmin, month, year }: { utilities: any[]; isAdmin: boolean; month: number; year: number }) {
  const UTILITY_LABELS: Record<string, string> = { ELECTRICITY: "⚡ Electricity", GAS: "🔥 Gas", WATER: "💧 Water", INTERNET: "📶 Internet" };

  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
      {utilities.length === 0 ? (
        <EmptyState icon={Receipt} title="No utility bills this month" description="Add electricity, gas, water, and internet bills." />
      ) : (
        utilities.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <p className="text-sm">{UTILITY_LABELS[u.type] ?? u.type}</p>
            <p className="text-sm font-semibold">{formatCurrency(Number(u.amount))}</p>
          </div>
        ))
      )}
      {utilities.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--muted))]">
          <p className="text-sm font-semibold">Total</p>
          <p className="text-sm font-semibold">
            {formatCurrency(utilities.reduce((sum: number, u: any) => sum + Number(u.amount), 0))}
          </p>
        </div>
      )}
    </div>
  );
}
