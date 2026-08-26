"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X, BedDouble, ShoppingBasket, Receipt, CreditCard, BarChart3,
  Brush, Bell, Calendar, Settings, Megaphone, LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { useT } from "@/lib/i18n/useT";

interface MoreSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
}

const NAV_ITEMS = [
  { labelKey: "rooms",         href: "/rooms",         icon: BedDouble,      colorStyle: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60",  activeColor: "bg-indigo-600 text-white shadow-xs" },
  { labelKey: "bazar",         href: "/bazar",         icon: ShoppingBasket, colorStyle: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60",   activeColor: "bg-amber-600 text-white shadow-xs" },
  { labelKey: "expenses",      href: "/expenses",      icon: Receipt,        colorStyle: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60",      activeColor: "bg-rose-600 text-white shadow-xs" },
  { labelKey: "payments",      href: "/payments",      icon: CreditCard,     colorStyle: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60", activeColor: "bg-emerald-600 text-white shadow-xs" },
  { labelKey: "settlement",    href: "/settlement",    icon: BarChart3,      colorStyle: "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60",  activeColor: "bg-purple-600 text-white shadow-xs" },
  { labelKey: "house",         href: "/house",         icon: Brush,          colorStyle: "bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60",        activeColor: "bg-teal-600 text-white shadow-xs" },
  { labelKey: "notices",       href: "/notices",       icon: Megaphone,      colorStyle: "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800/60",        activeColor: "bg-red-600 text-white shadow-xs" },
  { labelKey: "notifications", href: "/notifications", icon: Bell,           colorStyle: "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60",      activeColor: "bg-blue-600 text-white shadow-xs" },
  { labelKey: "calendar",      href: "/calendar",      icon: Calendar,       colorStyle: "bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60",  activeColor: "bg-orange-600 text-white shadow-xs" },
] as const;

export function MoreSidebar({ isOpen, onClose, user }: MoreSidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const T = useT();

  const items = NAV_ITEMS;

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[300px] max-w-[90vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-slate-800",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              M
            </div>
            <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-slate-100">MessHub</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-2">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1.5">
            {T.sidebar.features}
          </p>
          <div className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                    isActive
                      ? "bg-primary/10 text-primary dark:bg-primary/20"
                      : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                      isActive ? item.activeColor : item.colorStyle
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm leading-tight truncate",
                      isActive ? "font-extrabold text-primary" : "font-semibold text-gray-800 dark:text-slate-200"
                    )}>
                    {T.sidebar[item.labelKey]}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer — Profile & Sign Out */}
        <div className="px-2 py-3 border-t border-gray-100 dark:border-slate-800 space-y-0.5 shrink-0">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Settings size={15} />
            </div>
            <span className="text-sm font-semibold">{T.nav.settings}</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40 flex items-center justify-center shrink-0">
              <LogOut size={15} />
            </div>
            <span className="text-sm font-semibold">{T.nav.logOut}</span>
          </button>
        </div>
      </div>
    </>
  );
}
