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
        <div key={bazar.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{bazar.buyerMember?.user?.name ?? "Unknown"}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{formatShortDate(bazar.date)}</p>
            </div>
            <p className="text-base font-extrabold text-amber-700 dark:text-amber-400">{formatCurrency(Number(bazar.totalAmount))}</p>
          </div>
          <div className="px-4 py-2 space-y-1 divide-y divide-gray-50 dark:divide-slate-800/60">
            {bazar.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm py-1.5">
                <span className="text-gray-900 dark:text-slate-100 font-medium">{item.productName}</span>
                <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
                  <span className="text-xs">{Number(item.quantity)} {item.unit}</span>
                  <span className="text-xs">@ {formatCurrency(Number(item.unitPrice))}</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(Number(item.totalPrice))}</span>
                </div>
              </div>
            ))}
          </div>
          {bazar.note && <p className="px-4 pb-2 text-xs text-gray-400 dark:text-slate-500">{bazar.note}</p>}
        </div>
      ))}
    </div>
  );
}
