import { formatCurrency } from "@/lib/utils/currency";
import { formatRelativeDate } from "@/lib/utils/date";
import { ShoppingBasket, CreditCard, UserPlus } from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  bazar: any[];
  payments: any[];
  guestMeals: any[];
}

export function RecentActivity({ bazar, payments, guestMeals }: RecentActivityProps) {
  const activities = [
    ...bazar.map((b) => ({
      id: b.id,
      type: "bazar" as const,
      message: `${b.buyerMember?.user?.name ?? "Someone"} added bazar`,
      amount: Number(b.totalAmount),
      time: b.createdAt,
      href: "/bazar",
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      message: `${p.member?.user?.name ?? "Someone"} made a payment`,
      amount: Number(p.amount),
      time: p.createdAt,
      href: "/payments",
    })),
    ...guestMeals.map((gm) => ({
      id: gm.id,
      type: "guest" as const,
      message: `${gm.addedBy?.user?.name ?? "Someone"} added guest meal for ${gm.guestName}`,
      amount: null,
      time: gm.createdAt,
      href: "/guest-meals",
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  const icons = {
    bazar: { icon: ShoppingBasket, color: "bg-blue-50 text-blue-600" },
    payment: { icon: CreditCard, color: "bg-green-50 text-green-600" },
    guest: { icon: UserPlus, color: "bg-purple-50 text-purple-600" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-heading mb-0">Recent Activity</p>
        <Link href="/bazar" className="text-xs text-[hsl(var(--primary))] hover:underline">View all</Link>
      </div>
      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No recent activity</p>
        ) : (
          activities.map((a) => {
            const { icon: Icon, color } = icons[a.type];
            return (
              <Link key={a.id} href={a.href} className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{a.message}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelativeDate(a.time)}</p>
                </div>
                {a.amount !== null && (
                  <span className="text-sm font-medium shrink-0">{formatCurrency(a.amount)}</span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
