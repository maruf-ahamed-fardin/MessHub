"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, ShoppingBasket, Brush, CreditCard, CheckCheck, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const popoverRef = useRef<HTMLDivElement>(null);

  const notifications = [
    {
      id: "n1",
      type: "URGENT",
      title: "Mess Meeting Tonight at 9:00 PM",
      desc: "Monthly meal calculation and settlement discussion in dining area.",
      time: "10 mins ago",
      href: "/notices",
      icon: AlertTriangle,
      color: "bg-rose-50 text-rose-600 border-rose-200",
    },
    {
      id: "n2",
      type: "BAZAR",
      title: "আজকের বাজার দায়িত্ব: Admin (You)",
      desc: "সাপ্তাহিক রোটেশন অনুযায়ী আজকের বাজার সম্পন্ন করার অনুরোধ।",
      time: "Today",
      href: "/bazar",
      icon: ShoppingBasket,
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      id: "n3",
      type: "PAYMENT",
      title: "নতুন পেমেন্ট জমা: ৳৮,৫০০",
      desc: "Rahim Chowdhury ক্যাশ পেমেন্ট প্রদান করেছেন।",
      time: "1 hour ago",
      href: "/payments",
      icon: CreditCard,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Interactive Bell Button with Red Pulsing Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none",
          isOpen ? "bg-gray-100 text-gray-900 shadow-2xs" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
        title="নোটিফিকেশন ও অ্যালার্ট"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-extrabold text-white ring-2 ring-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-2xl border border-gray-200 py-0 z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                নোটিফিকেশন ও অ্যালার্ট
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {unreadCount} নতুন
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={13} />
                <span>পঠিত</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 hover:bg-gray-50/80 transition-colors",
                    n.type === "URGENT" && "bg-rose-50/30"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", n.color)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-gray-900 truncate leading-tight">{n.title}</p>
                      <span className="text-[9px] text-gray-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
            <Link
              href="/notices"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>সকল নোটিশ ও অ্যালার্ট বোর্ড</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
