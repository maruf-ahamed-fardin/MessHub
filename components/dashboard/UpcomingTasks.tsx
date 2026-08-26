"use client";

import { formatShortDate } from "@/lib/utils/date";
import { Brush, CheckSquare, ArrowRight, ListTodo } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/lib/context/PreferencesContext";

interface UpcomingTasksProps {
  cleaning: any[];
  tasks: any[];
}

export function UpcomingTasks({ cleaning, tasks }: UpcomingTasksProps) {
  const { t } = usePreferences();

  const all = [
    ...cleaning.map((c) => ({
      id: `cln-${c.id}`,
      type: "cleaning" as const,
      title: c.title,
      location: c.location,
      assignedTo: c.assignedMember?.user?.name ?? "Member",
      dueDate: c.dueDate,
      href: "/house",
    })),
    ...tasks.map((tItem: any) => ({
      id: `tsk-${tItem.id}`,
      type: "task" as const,
      title: tItem.title,
      location: tItem.category,
      assignedTo: tItem.assignedMember?.user?.name ?? "Member",
      dueDate: tItem.dueDate,
      href: "/house",
    })),
  ]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs space-y-0">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-primary" />
          <h4 className="font-bold text-xs text-gray-900 dark:text-slate-100 uppercase tracking-wider">
            {t("আসন্ন টাস্ক ও ডিউটি", "Upcoming Tasks & Duties")}
          </h4>
        </div>
        <Link href="/house" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
          <span>{t("হাউস হাব", "House Hub")}</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {all.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
            {t("কোনো নির্ধারিত টাস্ক নেই।", "No upcoming tasks scheduled.")}
          </p>
        ) : (
          all.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  {item.type === "cleaning" ? <Brush size={13} /> : <CheckSquare size={13} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate leading-tight">{item.title}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                    {item.assignedTo} • {formatShortDate(item.dueDate)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                {item.location}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
