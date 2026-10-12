import { cn } from "@/lib/utils";
import type { Priority, ExceptionStatus } from "@/data/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; className: string }> = {
    Critical: { label: "Critical", className: "bg-red-100 text-red-800 border-red-200" },
    High: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
    Medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    Low: { label: "Low", className: "bg-blue-100 text-blue-800 border-blue-200" },
  };
  const c = config[priority];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium", c.className)}>
      {priority === "Critical" && <span className="mr-1 w-1.5 h-1.5 rounded-full bg-red-600 inline-block animate-pulse" />}
      {c.label}
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
