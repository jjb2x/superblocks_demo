import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/ui/icon";
import { useApi } from "@/hooks/useApi";
import { useAppContext } from "@/context/AppContext";
import { usePriorities, type PriorityConfig } from "@/context/PriorityContext";
import { errorMessage, isAbortError } from "@/lib/errorMessage";
import { PriorityRow } from "./PriorityRow";
import PriorityEditorDialog, { type PriorityFormValues } from "./PriorityEditorDialog";
import RetirePriorityDialog from "./RetirePriorityDialog";
import UnmatchedPrioritiesNotice from "./UnmatchedPrioritiesNotice";

export default function ManagePriorities() {
  const navigate = useNavigate();
  const { triggerExceptionRefresh } = useAppContext();
  const { priorities, activePriorities, unmatched, loading, fetching, isLive, error, refetch } = usePriorities();

  const { run: savePriority, loading: saving } = useApi("SavePriority");
  const { run: retirePriority, loading: retiring } = useApi("RetirePriority");
  const { run: reactivatePriority, loading: reactivating } = useApi("ReactivatePriority");
  const { run: reorderPriorities, loading: reordering } = useApi("ReorderPriorities");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PriorityConfig | null>(null);
  const [retireTarget, setRetireTarget] = useState<PriorityConfig | null>(null);

  const busy = saving || retiring || reactivating || reordering;
  const retired = useMemo(() => priorities.filter((p) => !p.is_active), [priorities]);
  const existingNames = useMemo(() => priorities.map((p) => p.name), [priorities]);
  const totalOpen = useMemo(() => activePriorities.reduce((s, p) => s + p.open_count, 0), [activePriorities]);

  const reportError = useCallback((action: string, err: unknown) => {
    if (isAbortError(err)) return;
    toast.error(`Couldn't ${action}`, { description: errorMessage(err) });
  }, []);

  /** Reload priorities, and exceptions too when their stored values changed. */
  const refreshAfter = useCallback(
    async (exceptionsChanged: boolean) => {
      await refetch();
      if (exceptionsChanged) triggerExceptionRefresh();
    },
    [refetch, triggerExceptionRefresh],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((p: PriorityConfig) => {
    setEditing(p);
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(
    async (values: PriorityFormValues) => {
      try {
        const result = await savePriority({
          priority_id: editing?.priority_id ?? null,
          name: values.name,
          color: values.color,
          sla_hours: values.sla_hours,
          description: values.description,
        });
        if (!result) return; // cancelled
        setEditorOpen(false);
        await refreshAfter(result.cascadedCount > 0);
        if (result.created) {
          toast.success(`Created "${result.name}"`, { description: "It's now available in the Exception Queue." });
        } else if (result.cascadedCount > 0) {
          toast.success(`Renamed to "${result.name}"`, {
            description: `${result.cascadedCount} exception${result.cascadedCount === 1 ? "" : "s"} updated.`,
          });
        } else {
          toast.success(`Saved "${result.name}"`);
        }
      } catch (err) {
        reportError("save the priority", err);
      }
    },
    [editing, savePriority, refreshAfter, reportError],
  );

  const handleRetire = useCallback(
    async (replacementId: string | null) => {
      if (!retireTarget) return;
      try {
        const result = await retirePriority({
          priority_id: retireTarget.priority_id,
          replacement_priority_id: replacementId,
        });
        if (!result) return; // cancelled
        setRetireTarget(null);
        await refreshAfter(result.reassignedCount > 0);
        toast.success(`Retired "${retireTarget.name}"`, {
          description:
            result.reassignedCount > 0
              ? `${result.reassignedCount} exception${result.reassignedCount === 1 ? "" : "s"} moved to ${result.replacementName}.`
              : undefined,
        });
      } catch (err) {
        reportError("retire the priority", err);
      }
    },
    [retireTarget, retirePriority, refreshAfter, reportError],
  );

  const handleReactivate = useCallback(
    async (p: PriorityConfig) => {
      try {
        await reactivatePriority({ priority_id: p.priority_id });
        await refreshAfter(false);
        toast.success(`Restored "${p.name}"`);
      } catch (err) {
        reportError("restore the priority", err);
      }
    },
    [reactivatePriority, refreshAfter, reportError],
  );

  const handleMove = useCallback(
    async (id: string, direction: -1 | 1) => {
      const ids = activePriorities.map((p) => p.priority_id);
      const from = ids.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to], ids[from]];
      // Retired priorities keep their place after the active ones.
      const ordered = [...ids, ...retired.map((p) => p.priority_id)];
      try {
        await reorderPriorities({ ordered_ids: ordered });
        await refreshAfter(false);
      } catch (err) {
        reportError("reorder priorities", err);
      }
    },
    [activePriorities, retired, reorderPriorities, refreshAfter, reportError],
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/app/queue")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <Icon icon="arrow-left" className="w-3.5 h-3.5" />
              Back to Exception Work Queue
            </button>
            <h1 className="text-xl font-bold text-foreground">Manage Priorities</h1>
            <p className="text-sm text-muted-foreground">
              Set the priority levels staff can assign in the Exception Queue. Rank 1 is the most urgent.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fetching && !loading && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Icon icon="loader-circle" className="w-3.5 h-3.5 animate-spin" />
                Updating…
              </span>
            )}
            <Button onClick={openCreate} disabled={busy || !isLive} size="sm">
              <Icon icon="plus" className="w-4 h-4 mr-1" />
              New priority
            </Button>
          </div>
        </div>

        {/* Source / error banner */}
        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex gap-2">
              <Icon icon="circle-alert" className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Couldn't load priorities from Databricks</p>
                <p className="text-xs text-red-700">{errorMessage(error)}. Showing the default list, and editing is turned off.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Retry</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
            Stored in <code className="font-mono">workspace.default.exception_priorities</code>
          </div>
        )}

        <UnmatchedPrioritiesNotice unmatched={unmatched} />

        {/* Active priorities */}
        <Card className="gap-0 py-0 overflow-hidden">
          <CardHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Active priorities</CardTitle>
              <span className="text-xs text-muted-foreground">
                {activePriorities.length} levels · {totalOpen} open exceptions
              </span>
            </div>
          </CardHeader>
          <CardContent className={`p-0 ${fetching && !loading ? "opacity-70" : ""}`}>
            {loading ? (
              <div className="divide-y">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              activePriorities.map((p, i) => (
                <PriorityRow
                  key={p.priority_id}
                  priority={p}
                  rank={i + 1}
                  canMoveUp={i > 0}
                  canMoveDown={i < activePriorities.length - 1}
                  busy={busy || !isLive}
                  onMove={handleMove}
                  onEdit={openEdit}
                  onRetire={setRetireTarget}
                  onReactivate={handleReactivate}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Retired priorities */}
        {retired.length > 0 && (
          <Card className="gap-0 py-0 overflow-hidden">
            <CardHeader className="px-4 py-3 border-b">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Retired priorities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {retired.map((p) => (
                <PriorityRow
                  key={p.priority_id}
                  priority={p}
                  rank={null}
                  canMoveUp={false}
                  canMoveDown={false}
                  busy={busy || !isLive}
                  onMove={handleMove}
                  onEdit={openEdit}
                  onRetire={setRetireTarget}
                  onReactivate={handleReactivate}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          The top-ranked priority gets the pulsing badge and counts toward "critical open" in the queue. The top two count as
          high priority in summaries.
        </p>
      </div>

      <PriorityEditorDialog
        open={editorOpen}
        priority={editing}
        existingNames={existingNames}
        saving={saving}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleSave}
      />

      <RetirePriorityDialog
        priority={retireTarget}
        activePriorities={activePriorities}
        retiring={retiring}
        onCancel={() => setRetireTarget(null)}
        onConfirm={handleRetire}
      />
    </div>
  );
}
