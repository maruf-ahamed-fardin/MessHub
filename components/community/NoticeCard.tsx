"use client";

import { cn } from "@/lib/utils/cn";
import { AlertTriangle, Info, Megaphone } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/date";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface NoticeCardProps {
  notice: any;
  isAdmin: boolean;
}

export function NoticeCard({ notice }: NoticeCardProps) {
  const { t } = usePreferences();
  const isUrgent = notice.priority === "URGENT";
  const isImportant = notice.priority === "IMPORTANT";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-2xs transition-all",
        isUrgent && "bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800",
        isImportant && "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        !isUrgent && !isImportant && "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isUrgent ? (
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          ) : isImportant ? (
            <Megaphone size={16} className="text-amber-600 dark:text-amber-400" />
          ) : (
            <Info size={16} className="text-primary" />
          )}
        </div>
        <div className="flex-1">
          <p
            className={cn(
              "text-sm font-semibold",
              isUrgent && "text-red-900 dark:text-red-200",
              isImportant && "text-amber-900 dark:text-amber-200",
              !isUrgent && !isImportant && "text-gray-900 dark:text-slate-100"
            )}
          >
            {notice.title}
          </p>
          <p
            className={cn(
              "text-sm mt-1",
              isUrgent && "text-red-700 dark:text-red-300",
              isImportant && "text-amber-700 dark:text-amber-300",
              !isUrgent && !isImportant && "text-gray-600 dark:text-slate-400"
            )}
          >
            {notice.description}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-slate-500">
            <span>{notice.author?.name}</span>
            <span>·</span>
            <span>{formatRelativeDate(notice.createdAt)}</span>
            {notice.expiresAt && (
              <>
                <span>·</span>
                <span>{t(`মেয়াদ শেষ: ${formatRelativeDate(notice.expiresAt)}`, `Expires ${formatRelativeDate(notice.expiresAt)}`)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
