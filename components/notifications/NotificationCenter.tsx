"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, AlertTriangle, ShoppingBasket, Brush, Wrench,
  CreditCard, UtensilsCrossed, CheckCheck, Trash2,
  ArrowRight, MessageSquare, Check, Sparkles, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { LiveNotificationItem } from "@/backend/notifications/notification.service";

interface NotificationCenterProps {
  initialNotifications: LiveNotificationItem[];
}

export function NotificationCenter({ initialNotifications }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "notice":
        return {
          icon: Megaphone,
          badgeBg: "bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-xs",
          tagLabel: "নোটিশ",
          tagStyle: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        };
      case "bazar":
        return {
          icon: ShoppingBasket,
          badgeBg: "bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs",
          tagLabel: "বাজার",
          tagStyle: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        };
      case "payment":
        return {
          icon: CreditCard,
          badgeBg: "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs",
          tagLabel: "টাকা জমা",
          tagStyle: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        };
      case "duty":
        return {
          icon: Sparkles,
          badgeBg: "bg-gradient-to-tr from-teal-500 to-cyan-600 text-white shadow-xs",
          tagLabel: "ডিউটি",
          tagStyle: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
        };
      case "meal":
        return {
          icon: UtensilsCrossed,
          badgeBg: "bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-xs",
          tagLabel: "মিল বুকিং",
          tagStyle: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
        };
      case "house":
        return {
          icon: Wrench,
          badgeBg: "bg-gradient-to-tr from-purple-500 to-violet-600 text-white shadow-xs",
          tagLabel: "হাউস টাস্ক",
          tagStyle: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
        };
      case "community":
        return {
          icon: MessageSquare,
          badgeBg: "bg-gradient-to-tr from-indigo-500 to-primary text-white shadow-xs",
          tagLabel: "ফিড পোস্ট",
          tagStyle: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
        };
      default:
        return {
          icon: Bell,
          badgeBg: "bg-gradient-to-tr from-slate-600 to-slate-800 text-white shadow-xs",
          tagLabel: "অ্যালার্ট",
          tagStyle: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        };
    }
  };

  const filteredList = notifications.filter((n) => {
    if (activeCategory === "unread") return !n.read;
    if (activeCategory === "bazar_meal") return n.category === "bazar" || n.category === "meal";
    if (activeCategory === "finance") return n.category === "payment";
    if (activeCategory === "duties") return n.category === "duty" || n.category === "house";
    if (activeCategory === "notices") return n.category === "notice" || n.category === "community";
    return true;
  });

  return (
    <div className="space-y-4 max-w-4xl pb-20">
      {/* 1. Filter and Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 p-1.5 bg-gray-100 dark:bg-slate-800/80 rounded-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none",
              activeCategory === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            সব ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("unread")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none",
              activeCategory === "unread"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            অপঠিত ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("bazar_meal")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none",
              activeCategory === "bazar_meal"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            🛒 বাজার ও মিল
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("finance")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none",
              activeCategory === "finance"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            💰 টাকা ও লেনদেন
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("duties")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none",
              activeCategory === "duties"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            🧹 ডিউটি ও কাজ
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("notices")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer select-none",
              activeCategory === "notices"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700/50"
            )}
          >
            📢 নোটিশ ও ফিড
          </button>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            className="h-8 text-xs font-bold gap-1.5 shrink-0 rounded-xl"
          >
            <CheckCheck size={14} />
            <span>সবগুলো পঠিত করুন</span>
          </Button>
        )}
      </div>

      {/* 2. Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Bell size={22} className="opacity-50" />
            </div>
            <p className="font-bold">কোনো নোটিফিকেশন পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredList.map((n) => {
            const { icon: Icon, badgeBg, tagLabel, tagStyle } = getCategoryIcon(n.category);

            return (
              <div
                key={n.id}
                className={cn(
                  "p-3.5 sm:p-4 flex items-start justify-between gap-3 transition-colors",
                  !n.read
                    ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Distinct Colorful Squircle Badge */}
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5", badgeBg)}>
                    <Icon size={18} strokeWidth={2.3} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={n.href}
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors leading-tight"
                      >
                        {n.title}
                      </Link>
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0", tagStyle)}>
                        {tagLabel}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{n.desc}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{n.time}</p>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <Link
                    href={n.href}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="দেখুন"
                  >
                    <ArrowRight size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleRead(n.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={n.read ? "অপঠিত চিহ্নিত করুন" : "পঠিত চিহ্নিত করুন"}
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
