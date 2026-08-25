"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, AlertTriangle, ShoppingBasket, Brush, Wrench,
  CreditCard, UtensilsCrossed, CheckCheck, Trash2,
  ArrowRight, MessageSquare, Check, Sparkles, Filter,
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
        return { icon: AlertTriangle, color: "bg-rose-50 text-rose-600 border-rose-200" };
      case "bazar":
        return { icon: ShoppingBasket, color: "bg-amber-50 text-amber-600 border-amber-200" };
      case "payment":
        return { icon: CreditCard, color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "duty":
        return { icon: Brush, color: "bg-teal-50 text-teal-600 border-teal-200" };
      case "meal":
        return { icon: UtensilsCrossed, color: "bg-blue-50 text-blue-600 border-blue-200" };
      case "house":
        return { icon: Wrench, color: "bg-purple-50 text-purple-600 border-purple-200" };
      case "community":
        return { icon: MessageSquare, color: "bg-indigo-50 text-indigo-600 border-indigo-200" };
      default:
        return { icon: Bell, color: "bg-gray-50 text-gray-600 border-gray-200" };
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
    <div className="space-y-4 max-w-4xl">
      {/* 1. Filter and Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeCategory === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            সব ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("unread")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeCategory === "unread" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            অপঠিত ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("bazar_meal")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeCategory === "bazar_meal" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            বাজার ও মিল
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("finance")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeCategory === "finance" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            টাকা ও লেনদেন
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("duties")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeCategory === "duties" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            ডিউটি ও কাজ
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("notices")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
              activeCategory === "notices" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            )}
          >
            নোটিশ ও পোস্ট
          </button>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            className="h-8 text-xs font-semibold gap-1.5 shrink-0"
          >
            <CheckCheck size={14} />
            <span>সবগুলো পঠিত চিহ্নিত করুন</span>
          </Button>
        )}
      </div>

      {/* 2. Notifications List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-gray-100">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            <Bell size={28} className="mx-auto mb-2 opacity-30" />
            <p>কোনো নোটিফিকেশন পাওয়া যায়নি।</p>
          </div>
        ) : (
          filteredList.map((n) => {
            const { icon: Icon, color } = getCategoryIcon(n.category);

            return (
              <div
                key={n.id}
                className={cn(
                  "p-4 flex items-start justify-between gap-3 transition-colors hover:bg-gray-50/70",
                  !n.read && "bg-indigo-50/20"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5", color)}>
                    <Icon size={16} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={n.href} className="text-xs font-bold text-gray-900 hover:text-primary transition-colors">
                        {n.title}
                      </Link>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <Link
                    href={n.href}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                    title="দেখুন"
                  >
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggleRead(n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title={n.read ? "অপঠিত করুন" : "পঠিত করুন"}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={14} />
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
