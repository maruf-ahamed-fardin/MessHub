"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus, ShoppingBasket, Receipt, Wrench,
  Users, Megaphone, ChevronDown, Menu,
  Sun, Moon, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPopover } from "@/components/shared/NotificationPopover";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { MoreSidebar } from "@/components/shared/MoreSidebar";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useT } from "@/lib/i18n/useT";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const initials = (user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md flex items-center justify-between px-3.5 sm:px-5 shrink-0 relative z-30 transition-colors">
        {/* Left Section: Mobile Logo or Desktop Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-85 active:scale-95 transition-all select-none"
            title={T.topbar.goHome}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-indigo-500/20">
              M
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline-block">
              MessHub
            </span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <PwaInstallButton variant="topbar" />

          {/* Quick Add Action Menu */}
          <div className="relative" ref={quickAddRef}>
            <Button
              type="button"
              size="sm"
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className="gap-1.5 h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-sm shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{T.topbar.quickAdd}</span>
              <ChevronDown size={11} className={`transition-transform ${quickAddOpen ? "rotate-180" : ""}`} />
            </Button>

            {quickAddOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {T.topbar.quickActions}
                  </p>
                </div>
                <div className="py-1">
                  {actions.map((action) => (
                    <Link
                      key={action.hrefKey + action.labelKey}
                      href={action.hrefKey}
                      onClick={() => setQuickAddOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <action.icon size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">
                          {T.topbar[action.labelKey as keyof typeof T.topbar]}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {T.topbar[action.descKey as keyof typeof T.topbar]}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Popover */}
          <NotificationPopover />

          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-indigo-500/40 active:scale-95 transition-all"
            title="Toggle Language (বাংলা / English)"
          >
            <Globe size={13} className="text-slate-400" />
            <span className="font-mono text-[11px]">{language === "bn" ? "বাং" : "EN"}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 transition-all"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* User Profile Pill */}
          <Link
            href="/members/me"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all select-none"
          >
            <Avatar className="w-6 h-6 border border-indigo-500/30">
              {user.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
              <AvatarFallback className="text-[10px] bg-indigo-600 text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 hidden md:inline-block max-w-[90px] truncate">
              {user.name || "User"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hidden lg:inline-block">
              {user.role === "ADMIN" ? "Admin" : "Member"}
            </span>
          </Link>

          {/* Mobile Hamburger Drawer */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 md:hidden"
            aria-label={T.topbar.openMenu}
          >
            <Menu size={18} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* More Sidebar Drawer */}
      <MoreSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />
    </>
  );
}
