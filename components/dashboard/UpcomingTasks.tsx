"use client";

import { formatShortDate } from "@/lib/utils/date";
import { Brush, CheckSquare, Calendar, ArrowRight, ListTodo } from "lucide-react";
import Link from "next/link";

interface UpcomingTasksProps {
  cleaning: any[];
  tasks: any[];
}

export function UpcomingTasks({ cleaning, tasks }: UpcomingTasksProps) {
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
    ...tasks.map((t) => ({
      id: `tsk-${t.id}`,
      type: "task" as const,
      title: t.title,
      location: t.category,
      assignedTo: t.assignedMember?.user?.name ?? "Member",
      dueDate: t.dueDate,
      href: "/house",
    })),
  ]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs space-y-0">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-primary" />
          <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">আসন্ন টাস্ক ও ডিউটি</h4>
        </div>
        <Link href="/house" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
          <span>হাউস হাব</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {all.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-400">কোনো নির্ধারিত টাস্ক নেই।</p>
        ) : (
          all.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                  {item.type === "cleaning" ? <Brush size={13} /> : <CheckSquare size={13} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate leading-tight">{item.title}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {item.assignedTo} • {formatShortDate(item.dueDate)}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">
                {item.location}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
