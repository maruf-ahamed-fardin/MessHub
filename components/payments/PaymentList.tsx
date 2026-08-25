import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { CreditCard } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash", BKASH: "bKash", NAGAD: "Nagad", ROCKET: "Rocket",
  BANK_TRANSFER: "Bank", OTHER: "Other",
};
const METHOD_COLORS: Record<string, string> = {
  BKASH: "bg-pink-50 text-pink-700 border-pink-200",
  NAGAD: "bg-orange-50 text-orange-700 border-orange-200",
  ROCKET: "bg-purple-50 text-purple-700 border-purple-200",
  BANK_TRANSFER: "bg-blue-50 text-blue-700 border-blue-200",
  CASH: "bg-green-50 text-green-700 border-green-200",
  OTHER: "",
};

export function PaymentList({ payments, isAdmin }: { payments: any[]; isAdmin: boolean }) {
  if (payments.length === 0) {
    return <EmptyState icon={CreditCard} title="No payments this month" description="Use the button above to record a payment." />;
  }

  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
      {payments.map((payment) => {
        const name = payment.member?.user?.name ?? "Unknown";
        const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={payment.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatShortDate(payment.date)}</p>
            </div>
            <Badge variant="outline" className={`text-xs shrink-0 ${METHOD_COLORS[payment.method] ?? ""}`}>
              {METHOD_LABELS[payment.method] ?? payment.method}
            </Badge>
            <p className="text-sm font-semibold text-[hsl(var(--success))] shrink-0 ml-1">
              +{formatCurrency(Number(payment.amount))}
            </p>
          </div>
        );
      })}
    </div>
  );
}
