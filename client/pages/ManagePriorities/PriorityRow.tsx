import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { colorClassesFor } from "@/data/priorityColors";
import type { PriorityConfig } from "@/context/PriorityContext";

interface PriorityRowProps {
  priority: PriorityConfig;
  rank: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onEdit: (priority: PriorityConfig) => void;
  onRetire: (priority: PriorityConfig) => void;
  onReactivate: (priority: PriorityConfig) => void;
}

function formatSla(hours: number | null): string {
  if (hours === null) return "No target";
  if (hours < 24) return `${hours}h`;
  const days = hours / 24;
  return Number.isInteger(days) ? `${days}d` : `${hours}h`;
}

function PriorityRowImpl({
  priority: p,
  rank,
  canMoveUp,
  canMoveDown,
  busy,
  onMove,
  onEdit,
  onRetire,
  onReactivate,
}: PriorityRowProps) {
  const colors = colorClassesFor(p.color);

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-b last:border-b-0 transition-colors",
        p.is_active ? "hover:bg-accent/30" : "bg-muted/30",
      )}
    >
      {/* Rank & reorder */}
      <div className="flex items-center gap-1 w-16 shrink-0">
        {p.is_active ? (
          <>
            <span className="text-xs font-mono text-muted-foreground w-5 text-right">{rank}</span>
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Move ${p.name} up`}
                disabled={!canMoveUp || busy}
                onClick={() => onMove(p.priority_id, -1)}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon icon="chevron-up" className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Move ${p.name} down`}
                disabled={!canMoveDown || busy}
                onClick={() => onMove(p.priority_id, 1)}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon icon="chevron-down" className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <Icon icon="archive" className="w-4 h-4 text-muted-foreground ml-1" />
        )}
      </div>

      {/* Name & description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold", colors.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
            {p.name}
          </span>
          {!p.is_active && (
            <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground border rounded px-1.5 py-0.5">
              Retired
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate" title={p.description ?? undefined}>
          {p.description || "No description"}
        </p>
      </div>

      {/* SLA */}
      <div className="w-24 shrink-0 text-right">
        <p className="text-sm font-medium">{formatSla(p.sla_hours)}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SLA target</p>
      </div>

      {/* Usage */}
      <div className="w-28 shrink-0 text-right">
        <p className="text-sm font-medium">
          {p.open_count}
          <span className="text-muted-foreground font-normal"> / {p.total_count}</span>
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Open / total</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 w-40 shrink-0 justify-end">
        <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={busy} onClick={() => onEdit(p)}>
          <Icon icon="pencil" className="w-3.5 h-3.5 mr-1" />
          Edit
        </Button>
        {p.is_active ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-red-700 hover:text-red-800 hover:bg-red-50"
            disabled={busy}
            onClick={() => onRetire(p)}
          >
            <Icon icon="archive" className="w-3.5 h-3.5 mr-1" />
            Retire
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={busy} onClick={() => onReactivate(p)}>
            <Icon icon="rotate-ccw" className="w-3.5 h-3.5 mr-1" />
            Restore
          </Button>
        )}
      </div>
    </div>
  );
}

export const PriorityRow = memo(PriorityRowImpl);
