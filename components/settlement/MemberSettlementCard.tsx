import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberSettlementSummary } from "@/types";
import { Separator } from "@/components/ui/separator";

export function MemberSettlementCard({ data }: { data: MemberSettlementSummary }) {
  const isCredit = data.balance >= 0;
  const initials = data.memberName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const rows = [
    { label: "Food", value: data.foodCost, meals: data.totalMeals },
    { label: "Guest Meals", value: data.guestMealCost },
    { label: "Utilities", value: data.utilityCost },
    { label: "Seat Rent", value: data.seatRent },
    { label: "Other", value: data.otherCost },
  ];

  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))]">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">{initials}</AvatarFallback>
        </Avatar>
        <p className="font-medium text-sm flex-1">{data.memberName}</p>
        <span className={cn("text-sm font-semibold", isCredit ? "text-[hsl(var(--success))]" : "text-destructive")}>
          {isCredit ? "+" : ""}{formatCurrency(Math.abs(data.balance))}
        </span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {rows.map(({ label, value, meals }: any) => value > 0 ? (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-[hsl(var(--muted-foreground))]">
              {label}{meals ? ` (${meals} meals)` : ""}
            </span>
            <span>{formatCurrency(value)}</span>
          </div>
        ) : null)}
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Total Due</span>
          <span>{formatCurrency(data.totalCost)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span>Paid</span>
          <span>{formatCurrency(data.totalPaid)}</span>
        </div>
      </div>
      <div className={cn("px-4 py-2.5 text-xs font-medium flex justify-between",
        isCredit ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
        <span>{isCredit ? "Credit" : "Due"}</span>
        <span>{formatCurrency(Math.abs(data.balance))}</span>
      </div>
    </div>
  );
}
