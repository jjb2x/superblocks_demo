import { cn } from "@/lib/utils";
import type { Priority, ExceptionStatus } from "@/data/types";
import { usePrioritiesOptional } from "@/context/PriorityContext";
import { colorClassesFor } from "@/data/priorityColors";

const DEFAULT_COLORS: Record<string, string> = {
  Critical: "red",
  High: "orange",
  Medium: "yellow",
  Low: "blue",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const ctx = usePrioritiesOptional();
  const config = ctx?.byName.get(priority);
  const colors = colorClassesFor(config?.color ?? DEFAULT_COLORS[priority]);
  const isTop = ctx ? ctx.topPriorityName === priority : priority === "Critical";
  const isRetired = config ? !config.is_active : false;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium",
        colors.badge,
        isRetired && "opacity-70 line-through decoration-1",
      )}
      title={isRetired ? `${priority} (retired)` : config?.description ?? undefined}
    >
      {isTop && !isRetired && (
        <span className={cn("mr-1 w-1.5 h-1.5 rounded-full inline-block animate-pulse", colors.dot)} />
      )}
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: ExceptionStatus }) {
  const config: Record<ExceptionStatus, { className: string }> = {
    New: { className: "bg-slate-100 text-slate-700 border-slate-200" },
    "Under Review": { className: "bg-purple-100 text-purple-800 border-purple-200" },
    Assigned: { className: "bg-blue-100 text-blue-800 border-blue-200" },
    "In Progress": { className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
    "Waiting on External Party": { className: "bg-amber-100 text-amber-800 border-amber-200" },
    Resolved: { className: "bg-green-100 text-green-800 border-green-200" },
    Closed: { className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium", config[status].className)}>
      {status}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium bg-red-50 text-red-700 border-red-200">
      Overdue
    </span>
  );
}

export function ServiceTypeBadge({ serviceType }: { serviceType: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
      {serviceType}
    </span>
  );
}
