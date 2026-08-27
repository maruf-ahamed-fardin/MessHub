"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, AlertTriangle, ShoppingBasket, CreditCard, CheckCheck,
  ArrowRight, UtensilsCrossed, Megaphone, Sparkles, Wrench,
  MessageSquare, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";
import {
  getNotificationSummaryAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/app/actions/notification.actions";
import { LiveNotificationItem } from "@/backend/notifications/notification.service";

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<LiveNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { t } = usePreferences();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Fetch notifications from server
  const loadNotifications = async () => {
    try {
      const summary = await getNotificationSummaryAction();
      setUnreadCount(summary.unreadCount);
      setNotifications(summary.notifications);
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Auto-poll every 25 seconds
    const interval = setInterval(loadNotifications, 25000);

    // Refresh on window focus
    const handleFocus = () => loadNotifications();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsAsReadAction();
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (n: LiveNotificationItem) => {
    setIsOpen(false);
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationAsReadAction(n.id);
      } catch (err) {
        console.warn("Failed to mark as read:", err);
      }
    }
    router.push(n.href);
  };

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "meal":
        return {
          icon: UtensilsCrossed,
          badgeBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        };
      case "bazar":
        return {
          icon: ShoppingBasket,
          badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        };
      case "payment":
        return {
          icon: CreditCard,
          badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        };
      case "notice":
        return {
          icon: Megaphone,
          badgeBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        };
      case "duty":
        return {
          icon: Sparkles,
          badgeBg: "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
        };
      case "house":
        return {
          icon: Wrench,
          badgeBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        };
      case "community":
        return {
          icon: MessageSquare,
          badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        };
      default:
        return {
          icon: Bell,
          badgeBg: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        };
    }
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
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-red-600 px-1 text-[9px] font-black text-white shadow-xs leading-none animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover */}
      {isOpen && (
        <div className="fixed sm:absolute top-14 sm:top-full right-3 sm:right-0 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 py-0 z-50 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
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
          <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[60vh] sm:max-h-84 overflow-y-auto">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 size={20} className="animate-spin text-primary" />
                <span className="text-xs">{t("লোড হচ্ছে…", "Loading…")}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 dark:text-slate-500">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-gray-400">
                  <Bell size={18} className="opacity-50" />
                </div>
                <p className="font-bold">{t("কোনো নতুন নোটিফিকেশন নেই", "No notifications yet")}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { icon: Icon, badgeBg } = getCategoryConfig(n.category);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none",
                      !n.read && "bg-indigo-50/35 dark:bg-indigo-950/20"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5", badgeBg)}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn("text-xs font-bold truncate leading-tight", !n.read ? "text-indigo-950 dark:text-indigo-100" : "text-gray-900 dark:text-slate-100")}>
                          {n.title}
                        </p>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.desc}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5 animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
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
