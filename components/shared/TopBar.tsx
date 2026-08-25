"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell, Plus, ShoppingBasket, UserPlus, Receipt, Wrench,
  Users, Megaphone, User, Settings, LogOut, ChevronDown,
  Globe, Moon, Sun, Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { NotificationPopover } from "@/components/shared/NotificationPopover";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";
import { usePreferences } from "@/lib/context/PreferencesContext";

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
  { href: "/meals", label: "Meals & Guest Meals", icon: ShoppingBasket, desc: "Daily meal & guest counts" },
  { href: "/bazar", label: "Add Bazar", icon: ShoppingBasket, desc: "Record today's bazar" },
  { href: "/house", label: "House & Tasks", icon: Wrench, desc: "Cleaning, issues & shopping" },
];

const ADMIN_ACTIONS = [
  { href: "/meals", label: "Meals & Guest Meals", icon: ShoppingBasket, desc: "Daily meal & guest counts" },
  { href: "/bazar", label: "Add Bazar", icon: ShoppingBasket, desc: "Record grocery purchase" },
  { href: "/expenses", label: "Add Expense", icon: Receipt, desc: "Flat expenses & utilities" },
  { href: "/payments", label: "Add Payment", icon: Receipt, desc: "Record member payment" },
  { href: "/members", label: "Add Member", icon: Users, desc: "Create new member account" },
  { href: "/house", label: "House & Tasks", icon: Wrench, desc: "Cleaning, issues & shopping" },
  { href: "/notices", label: "Add Notice", icon: Megaphone, desc: "Post announcement" },
];

export function TopBar({ user }: TopBarProps) {
  const { theme, toggleTheme, language, toggleLanguage } = usePreferences();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const quickAddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const actions = user.role === "ADMIN" ? ADMIN_ACTIONS : MEMBER_ACTIONS;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-[hsl(var(--border))] bg-white flex items-center justify-between px-4 shrink-0 relative z-30">
      {/* Mobile logo (Clickable -> Home / Dashboard) */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 md:hidden hover:opacity-85 active:scale-95 transition-all cursor-pointer select-none"
        title="হোম পেজে যান"
      >
        <div className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-2xs">
          M
        </div>
        <span className="font-extrabold text-sm tracking-tight text-gray-900">MessHub</span>
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
              setUserMenuOpen(false);
            }}
            className="gap-1.5 h-8 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Quick Add</span>
            <ChevronDown size={12} className={`transition-transform ${quickAddOpen ? "rotate-180" : ""}`} />
          </Button>

          {quickAddOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[hsl(var(--border))] py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-gray-100">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</p>
              </div>
              <div className="py-1">
                {actions.map((action) => (
                  <Link
                    key={action.href + action.label}
                    href={action.href}
                    onClick={() => setQuickAddOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                      <action.icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">{action.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Interactive Notifications Popover */}
        <NotificationPopover />

        {/* 3. User Avatar Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setQuickAddOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200/90 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 divide-y divide-gray-100">
              {/* Profile Header */}
              <div className="px-3.5 py-2.5">
                <p className="text-xs font-black text-gray-900 truncate">{user.name ?? "Member"}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                <span className="inline-block mt-1 text-[10px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  {user.role}
                </span>
              </div>

              {/* Navigation Links */}
              <div className="py-1 px-1.5 space-y-0.5">
                <Link
                  href="/members/me"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={14} className="text-gray-400" />
                  <span>আমার প্রোফাইল</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={14} className="text-gray-400" />
                  <span>সেটিংস ও থিম</span>
                </Link>
              </div>

              {/* Sign out */}
              <div className="pt-1 px-1.5">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>লগ আউট</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
