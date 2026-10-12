import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ExceptionRecord } from "@/data/types";
import { generateWorkflowLineage, type WorkflowStep } from "./workflowLineage";

interface WorkflowLineageTabProps {
  exception: ExceptionRecord;
}

function formatStepTime(ts: string) {
  if (!ts) return "—";
  try {
    return format(parseISO(ts), "MMM d, h:mm a");
  } catch {
    return ts;
  }
}

function StepNode({ step, isLast }: { step: WorkflowStep; isLast: boolean }) {
  const dotColor = step.status === "active"
    ? "bg-amber-500 ring-4 ring-amber-100"
    : step.status === "completed"
      ? "bg-emerald-500"
      : "bg-slate-300";

  const lineColor = step.status === "pending" ? "bg-slate-200" : "bg-emerald-200";

  const cardBg = step.status === "active"
    ? "bg-amber-50 border-amber-200 shadow-sm"
    : step.status === "pending"
      ? "bg-slate-50 border-slate-200 border-dashed"
      : "bg-white border-border";

  return (
    <div className="flex gap-3 relative">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0 w-6">
        <div className={cn("w-3 h-3 rounded-full shrink-0 mt-3 z-10 transition-all", dotColor)} />
        {!isLast && <div className={cn("w-0.5 flex-1 min-h-6", lineColor)} />}
      </div>

      {/* Content card */}
      <div className={cn("flex-1 rounded-lg border px-3 py-2.5 mb-3 transition-all", cardBg)}>
        <div className="flex items-start gap-2">
          <div className={cn(
            "w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5",
            step.status === "active" ? "bg-amber-100 text-amber-700"
              : step.status === "pending" ? "bg-slate-100 text-slate-400"
                : "bg-emerald-50 text-emerald-600"
          )}>
            <Icon icon={step.icon} className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "text-xs font-semibold",
                step.status === "active" ? "text-amber-800"
                  : step.status === "pending" ? "text-slate-400"
                    : "text-foreground"
              )}>
                {step.event}
              </span>
              {step.isCurrent && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold uppercase tracking-wider animate-pulse">
                  Current
                </span>
              )}
            </div>
            <p className={cn("text-[11px] mt-0.5", step.status === "pending" ? "text-slate-400" : "text-muted-foreground")}>
              {step.detail}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Icon icon="user" className="w-2.5 h-2.5" />
                {step.actor}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Icon icon="server" className="w-2.5 h-2.5" />
                {step.system}
              </span>
              {step.timestamp && (
                <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                  <Icon icon="clock" className="w-2.5 h-2.5" />
                  {formatStepTime(step.timestamp)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowLineageTab({ exception }: WorkflowLineageTabProps) {
  const steps = useMemo(() => generateWorkflowLineage(exception), [exception]);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.length;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2 border">
        <div className="flex items-center gap-2">
          <Icon icon="git-branch" className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Workflow Lineage</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">
            {completedCount}/{totalSteps} steps completed
          </span>
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="pl-1">
        {steps.map((step, i) => (
          <StepNode key={step.id} step={step} isLast={i === steps.length - 1} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="text-[10px] text-muted-foreground">Pending</span>
        </div>
      </div>
    </div>
  );
}
