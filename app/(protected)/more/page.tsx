import type { Metadata } from "next";
import Link from "next/link";
import {
  Users, BedDouble, ShoppingBasket, Receipt, Zap, CreditCard, BarChart3,
  Brush, Wrench, ShoppingCart, Bell, Calendar, Settings, Megaphone,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = { title: "More" };

const ALL_ITEMS = [
  { label: "Rooms & Members", href: "/rooms", icon: BedDouble, desc: "Room seats and member directory" },
  { label: "Bazar", href: "/bazar", icon: ShoppingBasket, desc: "Grocery records" },
  { label: "Expenses & Bills", href: "/expenses", icon: Receipt, desc: "Rent, utilities & shared expenses" },
  { label: "Money Transaction", href: "/payments", icon: CreditCard, desc: "Member deposits, expenses & cash flow" },
  { label: "Settlement", href: "/settlement", icon: BarChart3, desc: "Monthly settlement" },
  { label: "House & Tasks", href: "/house", icon: Brush, desc: "Cleaning, maintenance & shopping" },
  { label: "Notices", href: "/notices", icon: Megaphone, desc: "Official announcements & meetings" },
  { label: "Notifications", href: "/notifications", icon: Bell, desc: "Personal alerts & reminders" },
  { label: "Calendar", href: "/calendar", icon: Calendar, desc: "Events & schedule" },
  { label: "Settings", href: "/settings", icon: Settings, desc: "Mess configuration" },
];

export default async function MorePage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const items = isAdmin ? ALL_ITEMS : ALL_ITEMS.filter((i) => i.href !== "/settings");

  return (
    <div>
      <PageHeader title="More" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] p-4 flex flex-col gap-2 hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <item.icon size={20} className="text-[hsl(var(--primary))]" />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
