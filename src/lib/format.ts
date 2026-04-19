import { format, formatDistanceToNow } from "date-fns";

export function formatRelative(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: string | Date, fmt = "MMM d, yyyy") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}
