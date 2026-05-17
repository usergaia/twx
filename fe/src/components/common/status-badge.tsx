import { cn } from "@/lib/utils";
import type { DriverStatus } from "@/types";

const STATUS_STYLES: Record<DriverStatus, string> = {
  safe: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
  caution: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-700 ring-red-500/30 dark:text-red-300",
};

export function StatusBadge({ status, className }: { status: DriverStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ring-1",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
