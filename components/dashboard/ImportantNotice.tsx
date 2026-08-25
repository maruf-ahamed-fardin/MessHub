import { cn } from "@/lib/utils/cn";
import { AlertTriangle, Info, Megaphone } from "lucide-react";
import Link from "next/link";

interface ImportantNoticeProps {
  notice: {
    id: string;
    title: string;
    description: string;
    priority: string;
  };
}

export function ImportantNotice({ notice }: ImportantNoticeProps) {
  const isUrgent = notice.priority === "URGENT";
  const isImportant = notice.priority === "IMPORTANT";

  return (
    <Link
      href="/notices"
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-[var(--radius)] border transition-opacity hover:opacity-90",
        isUrgent && "bg-red-50 border-red-200",
        isImportant && "bg-amber-50 border-amber-200",
        !isUrgent && !isImportant && "bg-blue-50 border-blue-200"
      )}
    >
      <div className="shrink-0 mt-0.5">
        {isUrgent ? (
          <AlertTriangle size={16} className="text-red-600" />
        ) : isImportant ? (
          <Megaphone size={16} className="text-amber-600" />
        ) : (
          <Info size={16} className="text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          isUrgent && "text-red-800",
          isImportant && "text-amber-800",
          !isUrgent && !isImportant && "text-blue-800"
        )}>
          {notice.title}
        </p>
        <p className={cn(
          "text-xs mt-0.5 line-clamp-2",
          isUrgent && "text-red-700",
          isImportant && "text-amber-700",
          !isUrgent && !isImportant && "text-blue-700"
        )}>
          {notice.description}
        </p>
      </div>
    </Link>
  );
}
