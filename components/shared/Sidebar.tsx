"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Users, BedDouble, UtensilsCrossed,
  ShoppingBasket, Receipt, CreditCard, BarChart3,
  Brush, Bell, Calendar, MessageSquare, Megaphone,
  Settings, LogOut, ChevronRight,
} from "lucide-react";
import { useT } from "@/lib/i18n/useT";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const T = useT();
  const [unreadCount, setUnreadCount] = useState<number>(3);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("messhub_unread_notifs");
      if (saved !== null) {
        setUnreadCount(Number(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
      try {
        localStorage.setItem("messhub_unread_notifs", "0");
      } catch {}
    }
  }, [pathname]);

  const notifBadge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : undefined;

  const NAV_SECTIONS = [
    {
      label: null,
      items: [{ href: "/dashboard", label: T.nav.home, icon: LayoutDashboard }],
    },
    {
      label: T.nav.feed,
      items: [
        { href: "/community", label: T.nav.feed, icon: MessageSquare },
        { href: "/notices", label: T.sidebar.notices, icon: Megaphone },
        { href: "/notifications", label: T.sidebar.notifications, icon: Bell, badge: notifBadge },
        { href: "/calendar", label: T.sidebar.calendar, icon: Calendar },
      ],
    },
    {
      label: T.sidebar.messhub,
      items: [
        { href: "/rooms", label: T.sidebar.rooms, icon: BedDouble },
        { href: "/meals", label: T.nav.meals, icon: UtensilsCrossed },
        { href: "/bazar", label: T.sidebar.bazar, icon: ShoppingBasket },
        { href: "/expenses", label: T.sidebar.expenses, icon: Receipt },
        { href: "/payments", label: T.sidebar.payments, icon: CreditCard },
        { href: "/settlement", label: T.sidebar.settlement, icon: BarChart3 },
      ],
    },
    {
      label: T.sidebar.house,
      items: [
        { href: "/house", label: T.sidebar.house, icon: Brush },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col h-full w-60 shrink-0 border-r overflow-hidden",
        "bg-[hsl(var(--sidebar))] border-[hsl(var(--sidebar-border))]",
        className
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-4 py-5 border-b border-[hsl(var(--sidebar-border))] hover:opacity-90 transition-all cursor-pointer shrink-0"
        title="MessHub"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-2xs">
          M
        </div>
        <span className="font-extrabold text-[hsl(var(--sidebar-foreground))] text-base tracking-tight">
          MessHub
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5">
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
                  {"badge" in item && item.badge && (
                    <span className="text-[10px] font-black bg-gradient-to-r from-rose-500 to-red-600 text-white px-1.5 py-0.5 rounded-full shadow-2xs leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight size={14} className="opacity-50" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-[hsl(var(--sidebar-border))] space-y-0.5 shrink-0">
        <Link href="/settings" className={cn("nav-item", pathname === "/settings" && "active")}>
          <Settings size={16} />
          <span>{T.nav.settings}</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item w-full text-left hover:text-red-400 cursor-pointer"
        >
          <LogOut size={16} />
          <span>{T.nav.logOut}</span>
        </button>
      </div>
    </aside>
  );
}
