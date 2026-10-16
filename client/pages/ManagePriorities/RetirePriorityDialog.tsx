import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import type { PriorityConfig } from "@/context/PriorityContext";

interface RetirePriorityDialogProps {
  priority: PriorityConfig | null;
  activePriorities: PriorityConfig[];
  retiring: boolean;
  onCancel: () => void;
  onConfirm: (replacementId: string | null) => void;
}

export default function RetirePriorityDialog({
  priority,
  activePriorities,
  retiring,
  onCancel,
  onConfirm,
}: RetirePriorityDialogProps) {
  const [replacementId, setReplacementId] = useState("");

  const options = useMemo(
    () => activePriorities.filter((p) => p.priority_id !== priority?.priority_id),
    [activePriorities, priority?.priority_id],
  );

  // Default to the next priority down in rank, falling back to the one above.
  useEffect(() => {
    if (!priority) return;
    const idx = activePriorities.findIndex((p) => p.priority_id === priority.priority_id);
    const next = activePriorities[idx + 1] ?? activePriorities[idx - 1];
    setReplacementId(next?.priority_id ?? "");
  }, [priority, activePriorities]);

  const inUse = priority?.total_count ?? 0;
  const isLastActive = options.length === 0;
  const needsReplacement = inUse > 0;
  const replacement = options.find((p) => p.priority_id === replacementId);
  const canConfirm = !isLastActive && (!needsReplacement || !!replacement);

  return (
    <Dialog open={!!priority} onOpenChange={(o) => !o && !retiring && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retire "{priority?.name}"?</DialogTitle>
          <DialogDescription>
            Retired priorities can't be assigned to exceptions. You can restore it later.
          </DialogDescription>
        </DialogHeader>

        {isLastActive ? (
          <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3">
            <Icon icon="circle-alert" className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">This is the only active priority. Add or restore another one first.</p>
          </div>
        ) : needsReplacement ? (
          <div className="space-y-3">
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Icon icon="triangle-alert" className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>{inUse}</strong> exception{inUse === 1 ? "" : "s"} ({priority?.open_count} open) use this
                priority. Choose where to move them.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reassign exceptions to</Label>
              <Select value={replacementId} onValueChange={setReplacementId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select a priority" /></SelectTrigger>
                <SelectContent>
                  {options.map((p) => (
                    <SelectItem key={p.priority_id} value={p.priority_id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No exceptions use this priority, so nothing will be reassigned.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={retiring}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(needsReplacement ? replacementId : null)}
            disabled={retiring || !canConfirm}
          >
            {retiring && <Icon icon="loader-circle" className="w-4 h-4 mr-1.5 animate-spin" />}
            {needsReplacement && replacement
              ? `Retire and move ${inUse} to ${replacement.name}`
              : "Retire priority"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
