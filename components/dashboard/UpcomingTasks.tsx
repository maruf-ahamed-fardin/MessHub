import { formatShortDate } from "@/lib/utils/date";
import { Brush, CheckSquare, Calendar } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";

interface UpcomingTasksProps {
  cleaning: any[];
  tasks: any[];
}

export function UpcomingTasks({ cleaning, tasks }: UpcomingTasksProps) {
  const all = [
    ...cleaning.map((c) => ({
      id: c.id,
      type: "cleaning" as const,
      title: c.title,
      location: c.location,
      assignedTo: c.assignedMember?.user?.name ?? "?",
      dueDate: c.dueDate,
      href: "/cleaning",
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      location: t.category,
      assignedTo: t.assignedMember?.user?.name ?? "?",
      dueDate: t.dueDate,
      href: "/cleaning",
    })),
  ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-heading mb-0">Upcoming</p>
        <Link href="/cleaning" className="text-xs text-[hsl(var(--primary))] hover:underline">View all</Link>
      </div>
      <div className="bg-white border border-[hsl(var(--border))] rounded-[var(--radius)] divide-y divide-[hsl(var(--border))]">
        {all.length === 0 ? (
          <EmptyState icon={Calendar} title="Nothing upcoming" className="py-8" />
        ) : (
          all.map((item) => (
            <Link key={item.id} href={item.href} className="flex items-start gap-3 px-4 py-3 hover:bg-[hsl(var(--muted))] transition-colors">
              <div className="w-7 h-7 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0 mt-0.5">
                {item.type === "cleaning"
                  ? <Brush size={13} className="text-[hsl(var(--secondary-foreground))]" />
                  : <CheckSquare size={13} className="text-[hsl(var(--secondary-foreground))]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.location}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {item.assignedTo} · {formatShortDate(item.dueDate)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
