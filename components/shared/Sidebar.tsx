"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Users, BedDouble, UtensilsCrossed, UserPlus,
  ShoppingBasket, Receipt, Zap, CreditCard, BarChart3,
  Brush, Wrench, ShoppingCart, Bell, Calendar, MessageSquare,
  Settings, LogOut, ChevronRight,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Community",
    items: [
      { href: "/community", label: "Feed", icon: MessageSquare },
      { href: "/notices", label: "Notices", icon: Bell },
      { href: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Mess",
    items: [
      { href: "/rooms", label: "Rooms & Members", icon: BedDouble },
      { href: "/meals", label: "Meals", icon: UtensilsCrossed },
      { href: "/bazar", label: "Bazar", icon: ShoppingBasket },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/payments", label: "Money Transaction", icon: CreditCard },
      { href: "/settlement", label: "Monthly Settlement", icon: BarChart3 },
    ],
  },
  {
    label: "House",
    items: [
      { href: "/house", label: "House & Tasks", icon: Brush },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-60 shrink-0 border-r overflow-y-auto",
        "bg-[hsl(var(--sidebar))] border-[hsl(var(--sidebar-border))]",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sidebar-primary))] flex items-center justify-center text-white font-bold text-sm">
          M
        </div>
        <span className="font-semibold text-[hsl(var(--sidebar-foreground))] text-base tracking-tight">
          MessHub
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="nav-section-label">{section.label}</p>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn("nav-item", isActive && "active")}>
                  <item.icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="opacity-50" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-[hsl(var(--sidebar-border))] space-y-0.5">
        <Link href="/settings" className={cn("nav-item", pathname === "/settings" && "active")}>
          <Settings size={16} />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item w-full text-left hover:text-red-400"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
