"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus, ShoppingBasket, Receipt, Wrench,
  Users, Megaphone, ChevronDown, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPopover } from "@/components/shared/NotificationPopover";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { MoreSidebar } from "@/components/shared/MoreSidebar";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useT } from "@/lib/i18n/useT";

interface TopBarProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
}

const MEMBER_ACTIONS = [
  { hrefKey: "/meals",  labelKey: "meals",     descKey: "dailyMeal",      icon: ShoppingBasket },
  { hrefKey: "/bazar",  labelKey: "addBazar",   descKey: "recordBazar",    icon: ShoppingBasket },
  { hrefKey: "/house",  labelKey: "houseTasks", descKey: "cleaningIssues", icon: Wrench },
] as const;

const ADMIN_ACTIONS = [
  { hrefKey: "/meals",    labelKey: "meals",           descKey: "dailyMeal",         icon: ShoppingBasket },
  { hrefKey: "/bazar",   labelKey: "addBazar",         descKey: "recordBazar",       icon: ShoppingBasket },
  { hrefKey: "/expenses",labelKey: "addExpense",       descKey: "flatExpenses",      icon: Receipt },
  { hrefKey: "/payments",labelKey: "addPayment",       descKey: "recordPayment",     icon: Receipt },
  { hrefKey: "/members", labelKey: "addMember",        descKey: "createMember",      icon: Users },
  { hrefKey: "/house",   labelKey: "houseTasks",       descKey: "cleaningIssues",    icon: Wrench },
  { hrefKey: "/notices", labelKey: "addNotice",        descKey: "postAnnouncement",  icon: Megaphone },
] as const;

export function TopBar({ user }: TopBarProps) {
  const { theme, toggleTheme, language, toggleLanguage } = usePreferences();
  const T = useT();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const quickAddRef = useRef<HTMLDivElement>(null);

  const actions = user.role === "ADMIN" ? ADMIN_ACTIONS : MEMBER_ACTIONS;

  // Close quick-add when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-14 border-b border-[hsl(var(--border))] bg-white dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 relative z-30">
        {/* Mobile logo (Clickable -> Home / Dashboard) */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 md:hidden hover:opacity-85 active:scale-95 transition-all cursor-pointer select-none"
          title={T.topbar.goHome}
        >
          <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-2xs">
            M
          </div>
          <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-slate-100">MessHub</span>
        </Link>

        {/* Desktop spacer */}
        <div className="hidden md:block" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <PwaInstallButton variant="topbar" />

          {/* 1. Quick Add Dropdown */}
          <div className="relative" ref={quickAddRef}>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setQuickAddOpen(!quickAddOpen);
              }}
              className="gap-1.5 h-8 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>{T.topbar.quickAdd}</span>
              <ChevronDown size={12} className={`transition-transform ${quickAddOpen ? "rotate-180" : ""}`} />
            </Button>

            {quickAddOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-[hsl(var(--border))] dark:border-slate-800 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{T.topbar.quickActions}</p>
                </div>
                <div className="py-1">
                  {actions.map((action) => (
                    <Link
                      key={action.hrefKey + action.labelKey}
                      href={action.hrefKey}
                      onClick={() => setQuickAddOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-slate-300 shrink-0">
                        <action.icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">
                          {T.topbar[action.labelKey as keyof typeof T.topbar]}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-400 truncate">
                          {T.topbar[action.descKey as keyof typeof T.topbar]}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Notifications Popover */}
          <NotificationPopover />

          {/* 3. Hamburger Menu Button — opens MoreSidebar */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-100 transition-all cursor-pointer active:scale-95"
            aria-label={T.topbar.openMenu}
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* More Sidebar */}
      <MoreSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
    </>
  );
}
