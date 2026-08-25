import { cn } from "@/lib/utils/cn";
import { AlertTriangle, Info, Megaphone } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils/date";

interface NoticeCardProps {
  notice: any;
  isAdmin: boolean;
}

export function NoticeCard({ notice }: NoticeCardProps) {
  const isUrgent = notice.priority === "URGENT";
  const isImportant = notice.priority === "IMPORTANT";

  return (
    <div className={cn(
      "rounded-[var(--radius)] border p-4",
      isUrgent && "bg-red-50 border-red-200",
      isImportant && "bg-amber-50 border-amber-200",
      !isUrgent && !isImportant && "bg-white border-[hsl(var(--border))]"
    )}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {isUrgent ? <AlertTriangle size={16} className="text-red-600" />
            : isImportant ? <Megaphone size={16} className="text-amber-600" />
            : <Info size={16} className="text-[hsl(var(--primary))]" />}
        </div>
        <div className="flex-1">
          <p className={cn("text-sm font-semibold",
            isUrgent && "text-red-800", isImportant && "text-amber-800")}>
            {notice.title}
          </p>
          <p className={cn("text-sm mt-1",
            isUrgent && "text-red-700", isImportant && "text-amber-700", !isUrgent && !isImportant && "text-[hsl(var(--muted-foreground))]")}>
            {notice.description}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>{notice.author?.name}</span>
            <span>·</span>
            <span>{formatRelativeDate(notice.createdAt)}</span>
            {notice.expiresAt && <><span>·</span><span>Expires {formatRelativeDate(notice.expiresAt)}</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}
