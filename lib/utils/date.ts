import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

/**
 * Format a date as "August 25, 2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMMM d, yyyy");
}

/**
 * Format a date as "Aug 25"
 */
export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d");
}

/**
 * Format a date as "25 Aug 2026"
 */
export function formatDayMonthYear(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "d MMM yyyy");
}

/**
 * Format date for display in activity feeds.
 * Shows "Today", "Yesterday", or relative time.
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return `Yesterday at ${format(d, "h:mm a")}`;
  return format(d, "MMM d 'at' h:mm a");
}

/**
 * Format month and year as "August 2026"
 */
export function formatMonthYear(month: number, year: number): string {
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

/**
 * Get current month (1-12) and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * Get start of month (00:00:00.000) and end of month (23:59:59.999) Date objects
 */
export function getMonthRange(month: number, year: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * Format a date as "YYYY-MM-DD" for database storage
 */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Get today as a date-only Date object (midnight UTC)
 */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Format time as "3:45 PM"
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}
