import { formatCurrency } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/date";
import { ShoppingBasket } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface BazarListProps {
  items: any[];
  isAdmin: boolean;
  currentMemberId: string;
}

export function BazarList({ items }: BazarListProps) {
  if (items.length === 0) {
    return <EmptyState icon={ShoppingBasket} title="No bazar entries this month" description="Add the first bazar entry using the button above." />;
  }

  return (
    <div className="space-y-3">
      {items.map((bazar) => (
        <div key={bazar.id} className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <div>
              <p className="text-sm font-medium">{bazar.buyerMember?.user?.name ?? "Unknown"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatShortDate(bazar.date)}</p>
            </div>
            <p className="text-base font-semibold">{formatCurrency(Number(bazar.totalAmount))}</p>
          </div>
          <div className="px-4 py-2 space-y-1">
            {bazar.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--foreground))]">{item.productName}</span>
                <div className="flex items-center gap-3 text-[hsl(var(--muted-foreground))]">
                  <span className="text-xs">{Number(item.quantity)} {item.unit}</span>
                  <span className="text-xs">@ {formatCurrency(Number(item.unitPrice))}</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{formatCurrency(Number(item.totalPrice))}</span>
                </div>
              </div>
            ))}
          </div>
          {bazar.note && <p className="px-4 pb-2 text-xs text-[hsl(var(--muted-foreground))]">{bazar.note}</p>}
        </div>
      ))}
    </div>
  );
}
