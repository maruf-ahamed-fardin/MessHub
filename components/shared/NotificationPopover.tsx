"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, ShoppingBasket, CreditCard, CheckCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { t } = usePreferences();

  const notifications = [
    {
      id: "n1",
      type: "URGENT",
      title: t("আজ রাত ৯:০০ টায় মেস মিটিং", "Mess Meeting Tonight at 9:00 PM"),
      desc: t("ডাইনিং রুমে মিল হিসাব ও মেস সংক্রান্ত আলোচনা।", "Monthly meal calculation and settlement discussion in dining area."),
      time: t("১০ মিনিট আগে", "10 mins ago"),
      href: "/notices",
      icon: AlertTriangle,
      color: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    },
    {
      id: "n2",
      type: "BAZAR",
      title: t("আজকের বাজার দায়িত্ব: Admin (You)", "Today's Bazar Duty: Admin (You)"),
      desc: t("সাপ্তাহিক রোটেশন অনুযায়ী আজকের বাজার সম্পন্ন করার অনুরোধ।", "Scheduled duty to complete mess grocery shopping today."),
      time: t("আজকে", "Today"),
      href: "/bazar",
      icon: ShoppingBasket,
      color: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    },
    {
      id: "n3",
      type: "PAYMENT",
      title: t("নতুন পেমেন্ট জমা: ৳৮,৫০০", "New Payment Recorded: ৳8,500"),
      desc: t("Rahim Chowdhury ক্যাশ পেমেন্ট প্রদান করেছেন।", "Rahim Chowdhury recorded cash deposit."),
      time: t("১ ঘণ্টা আগে", "1 hour ago"),
      href: "/payments",
      icon: CreditCard,
      color: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    },
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("messhub_unread_notifs");
      if (saved !== null) {
        setUnreadCount(Number(saved));
      }
    } catch {}

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
    try {
      localStorage.setItem("messhub_unread_notifs", "0");
    } catch {}
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Interactive Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none",
          isOpen
            ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-2xs"
            : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
        )}
        title={t("নোটিফিকেশন ও অ্যালার্ট", "Notifications & Alerts")}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-red-600 px-1 text-[9px] font-black text-white shadow-xs leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="fixed sm:absolute top-14 sm:top-full right-3 sm:right-0 w-[calc(100vw-24px)] sm:w-88 max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 py-0 z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
                {t("নোটিফিকেশন", "Notifications")}
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount} {t("নতুন", "new")}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={13} />
                <span>{t("পঠিত", "Read")}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[60vh] sm:max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors",
                    n.type === "URGENT" && "bg-rose-50/30 dark:bg-rose-950/20"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", n.color)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{n.title}</p>
                      <span className="text-[9px] text-gray-400 dark:text-slate-500 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{t("সকল নোটিফিকেশন সেন্টার", "View All Notifications")}</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
