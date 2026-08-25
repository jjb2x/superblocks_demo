import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/shared/StatusBadges";
import { updateException } from "@/data/exceptions";
import { getLocationName } from "@/data/locations";
import { APP_USERS } from "@/data/users";
import { useAppContext } from "@/context/AppContext";
import type { ExceptionRecord, ExceptionStatus, Priority } from "@/data/types";

const STATUS_OPTS: ExceptionStatus[] = [
  "New", "Under Review", "Assigned", "In Progress",
  "Waiting on External Party", "Resolved", "Closed",
];
const PRIORITY_OPTS: Priority[] = ["Critical", "High", "Medium", "Low"];
const PAGE_SIZE = 20;

interface InteractiveGridProps {
  data: ExceptionRecord[];
}

interface CellFlash {
  id: string;
  field: string;
  ts: number;
}

export default function InteractiveGrid({ data }: InteractiveGridProps) {
  const { triggerExceptionRefresh, userName } = useAppContext();
  const [page, setPage] = useState(0);
  const [flashes, setFlashes] = useState<CellFlash[]>([]);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>();

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const flash = useCallback((id: string, field: string) => {
    const f = { id, field, ts: Date.now() };
    setFlashes((prev) => [...prev, f]);
    flashTimeout.current = setTimeout(() => {
      setFlashes((prev) => prev.filter((x) => x !== f));
    }, 1200);
  }, []);

  const isFlashing = useCallback(
    (id: string, field: string) => flashes.some((f) => f.id === id && f.field === field),
    [flashes]
  );

  const handleStatusChange = useCallback((ex: ExceptionRecord, value: string) => {
    updateException(ex.id, {
      status: value as ExceptionStatus,
      activityHistory: [...ex.activityHistory, {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: userName,
        action: "Status Updated",
        details: `Changed to ${value}`,
      }],
    });
    triggerExceptionRefresh();
    flash(ex.id, "status");
  }, [triggerExceptionRefresh, flash]);

  const handlePriorityChange = useCallback((ex: ExceptionRecord, value: string) => {
    updateException(ex.id, {
      priority: value as Priority,
      activityHistory: [...ex.activityHistory, {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: userName,
        action: "Priority Updated",
        details: `Changed to ${value}`,
      }],
    });
    triggerExceptionRefresh();
    flash(ex.id, "priority");
  }, [triggerExceptionRefresh, flash]);

  const handleOwnerChange = useCallback((ex: ExceptionRecord, value: string) => {
    updateException(ex.id, {
      assignedOwner: value,
      activityHistory: [...ex.activityHistory, {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: userName,
        action: "Owner Reassigned",
        details: `Assigned to ${APP_USERS.find((u) => u.id === value)?.name ?? value}`,
      }],
    });
    triggerExceptionRefresh();
    flash(ex.id, "owner");
  }, [triggerExceptionRefresh, flash]);

  const handleDueDateBlur = useCallback((ex: ExceptionRecord, value: string) => {
    if (value === ex.resolutionDueDate) return;
    updateException(ex.id, { resolutionDueDate: value });
    triggerExceptionRefresh();
    flash(ex.id, "dueDate");
  }, [triggerExceptionRefresh, flash]);

  const handleImpactBlur = useCallback((ex: ExceptionRecord, value: string) => {
    if (value === ex.estimatedImpact) return;
    updateException(ex.id, { estimatedImpact: value });
    triggerExceptionRefresh();
    flash(ex.id, "impact");
  }, [triggerExceptionRefresh, flash]);

  const handleResolutionBlur = useCallback((ex: ExceptionRecord, value: string) => {
    if (value === (ex.resolutionSummary ?? "")) return;
    updateException(ex.id, { resolutionSummary: value });
    triggerExceptionRefresh();
    flash(ex.id, "resolution");
  }, [triggerExceptionRefresh, flash]);

  const handleAddNote = useCallback((ex: ExceptionRecord) => {
    const text = noteInputs[ex.id]?.trim();
    if (!text) return;
    updateException(ex.id, {
      notes: [...ex.notes, text],
      activityHistory: [...ex.activityHistory, {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        user: userName,
        action: "Note Added",
        details: text,
      }],
    });
    setNoteInputs((prev) => ({ ...prev, [ex.id]: "" }));
    triggerExceptionRefresh();
    flash(ex.id, "note");
    toast.success("Note added");
  }, [noteInputs, triggerExceptionRefresh, flash]);

  const cellClass = (id: string, field: string) =>
    `transition-colors duration-300 ${isFlashing(id, field) ? "bg-green-100" : ""}`;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Grid */}
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full text-xs border-collapse min-w-[1400px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/80 border-b">
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-24">ID</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-28">Category</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-36">
                <span className="flex items-center gap-1">Location <span className="text-[8px] px-1 py-px rounded bg-amber-100 text-amber-700 font-medium">Internal</span></span>
              </th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-28">Service Type</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-14">Days</th>
              <th className="px-2 py-2 text-center font-semibold text-muted-foreground w-12">
                <span className="flex items-center justify-center gap-1">Rx <span className="text-[8px] px-1 py-px rounded bg-red-100 text-red-700 font-medium">PHI</span></span>
              </th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-40">Status</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-24">Priority</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-36">
                <span className="flex items-center gap-1">Owner <span className="text-[8px] px-1 py-px rounded bg-blue-100 text-blue-700 font-medium">PII</span></span>
              </th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-28">Due Date</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-36">Est. Impact</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-40">Resolution Notes</th>
              <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-48">Quick Note</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((ex) => (
              <tr key={ex.id} className="border-b hover:bg-muted/30 group">
                {/* Read-only columns */}
                <td className="px-2 py-1.5 font-mono text-primary font-medium">{ex.id}</td>
                <td className="px-2 py-1.5 truncate">{ex.issueCategory}</td>
                <td className="px-2 py-1.5 truncate" title={getLocationName(ex.locationId)}>
                  {getLocationName(ex.locationId)}
                </td>
                <td className="px-2 py-1.5 truncate">{ex.serviceType}</td>
                <td className="px-2 py-1.5 text-center font-medium">{ex.daysOpen}</td>
                <td className="px-2 py-1.5 text-center font-medium">{ex.prescriptionsAffected}</td>

                {/* Editable: Status */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "status")}`}>
                  <select
                    value={ex.status}
                    onChange={(e) => handleStatusChange(ex, e.target.value)}
                    className="w-full h-7 px-1 rounded border border-border bg-background text-xs cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>

                {/* Editable: Priority */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "priority")}`}>
                  <select
                    value={ex.priority}
                    onChange={(e) => handlePriorityChange(ex, e.target.value)}
                    className="w-full h-7 px-1 rounded border border-border bg-background text-xs cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    {PRIORITY_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </td>

                {/* Editable: Owner */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "owner")}`}>
                  <select
                    value={ex.assignedOwner}
                    onChange={(e) => handleOwnerChange(ex, e.target.value)}
                    className="w-full h-7 px-1 rounded border border-border bg-background text-xs cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    {APP_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </td>

                {/* Editable: Due Date */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "dueDate")}`}>
                  <input
                    type="date"
                    defaultValue={ex.resolutionDueDate}
                    onBlur={(e) => handleDueDateBlur(ex, e.target.value)}
                    className="w-full h-7 px-1 rounded border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                  />
                </td>

                {/* Editable: Estimated Impact */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "impact")}`}>
                  <input
                    type="text"
                    defaultValue={ex.estimatedImpact}
                    onBlur={(e) => handleImpactBlur(ex, e.target.value)}
                    className="w-full h-7 px-1.5 rounded border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                    placeholder="—"
                  />
                </td>

                {/* Editable: Resolution Notes */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "resolution")}`}>
                  <input
                    type="text"
                    defaultValue={ex.resolutionSummary ?? ""}
                    onBlur={(e) => handleResolutionBlur(ex, e.target.value)}
                    className="w-full h-7 px-1.5 rounded border border-border bg-background text-xs focus:ring-1 focus:ring-primary"
                    placeholder="—"
                  />
                </td>

                {/* Quick Note */}
                <td className={`px-1 py-1 ${cellClass(ex.id, "note")}`}>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="text"
                      value={noteInputs[ex.id] ?? ""}
                      onChange={(e) => setNoteInputs((prev) => ({ ...prev, [ex.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(ex); }}
                      className="flex-1 h-7 px-1.5 rounded border border-border bg-background text-xs focus:ring-1 focus:ring-primary min-w-0"
                      placeholder="Add note..."
                    />
                    <button
                      onClick={() => handleAddNote(ex)}
                      disabled={!noteInputs[ex.id]?.trim()}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-primary/10 text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Add note"
                    >
                      <Icon icon="plus" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No exceptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2 border-t">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} &bull; {data.length} total
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 text-xs px-2"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <Icon icon="chevron-left" className="w-3 h-3" />
            </Button>
            <Button
              variant="outline" size="sm" className="h-7 text-xs px-2"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <Icon icon="chevron-right" className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
