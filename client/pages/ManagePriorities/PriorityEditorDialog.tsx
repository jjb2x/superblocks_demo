import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  PRIORITY_COLOR_CLASSES,
  PRIORITY_COLOR_KEYS,
  colorClassesFor,
  isPriorityColor,
  type PriorityColor,
} from "@/data/priorityColors";
import type { PriorityConfig } from "@/context/PriorityContext";

export interface PriorityFormValues {
  name: string;
  color: PriorityColor;
  sla_hours: number | null;
  description: string | null;
}

interface PriorityEditorDialogProps {
  open: boolean;
  /** null = creating a new priority */
  priority: PriorityConfig | null;
  existingNames: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: PriorityFormValues) => void;
}

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &/()\-]*$/;

export default function PriorityEditorDialog({
  open,
  priority,
  existingNames,
  saving,
  onCancel,
  onSubmit,
}: PriorityEditorDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<PriorityColor>("slate");
  const [sla, setSla] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(priority?.name ?? "");
    setColor(priority && isPriorityColor(priority.color) ? priority.color : "slate");
    setSla(priority?.sla_hours != null ? String(priority.sla_hours) : "");
    setDescription(priority?.description ?? "");
    setTouched(false);
  }, [open, priority]);

  const trimmedName = name.trim().replace(/\s+/g, " ");
  const isRename = !!priority && trimmedName !== priority.name;

  const errors = useMemo(() => {
    const e: { name?: string; sla?: string } = {};
    if (!trimmedName) e.name = "Name is required.";
    else if (trimmedName.length > 40) e.name = "Keep the name to 40 characters or fewer.";
    else if (!NAME_PATTERN.test(trimmedName)) e.name = "Use letters, numbers, spaces, and - & / ( ) only.";
    else if (
      existingNames.some(
        (n) => n.toLowerCase() === trimmedName.toLowerCase() && n !== priority?.name,
      )
    ) {
      e.name = "Another priority already uses this name.";
    }
    if (sla.trim()) {
      const n = Number(sla);
      if (!Number.isInteger(n) || n < 1 || n > 8760) e.sla = "Enter whole hours between 1 and 8760.";
    }
    return e;
  }, [trimmedName, sla, existingNames, priority?.name]);

  const hasErrors = Object.keys(errors).length > 0;
  const preview = colorClassesFor(color);

  const handleSubmit = () => {
    setTouched(true);
    if (hasErrors) return;
    onSubmit({
      name: trimmedName,
      color,
      sla_hours: sla.trim() ? Number(sla) : null,
      description: description.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{priority ? `Edit "${priority.name}"` : "New priority"}</DialogTitle>
          <DialogDescription>
            {priority
              ? "Changes apply everywhere this priority is shown or assigned."
              : "New priorities are added at the bottom of the ranking. Reorder them afterwards."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="priority-name" className="text-xs">Name *</Label>
            <Input
              id="priority-name"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Urgent"
              className="h-9"
            />
            {touched && errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={PRIORITY_COLOR_CLASSES[key].label}
                  aria-pressed={color === key}
                  title={PRIORITY_COLOR_CLASSES[key].label}
                  onClick={() => setColor(key)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform",
                    PRIORITY_COLOR_CLASSES[key].dot,
                    color === key ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priority-sla" className="text-xs">SLA target (hours)</Label>
              <Input
                id="priority-sla"
                type="number"
                min={1}
                max={8760}
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                placeholder="e.g. 24"
                className="h-9"
              />
              {touched && errors.sla && <p className="text-xs text-red-600">{errors.sla}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Preview</Label>
              <div className="h-9 flex items-center">
                <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold", preview.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", preview.dot)} />
                  {trimmedName || "Priority"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority-desc" className="text-xs">Description</Label>
            <Textarea
              id="priority-desc"
              value={description}
              maxLength={300}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When should staff choose this priority?"
              className="min-h-20 text-sm"
            />
          </div>

          {isRename && priority && priority.total_count > 0 && (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Icon icon="triangle-alert" className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Renaming updates <strong>{priority.total_count}</strong> existing exception
                {priority.total_count === 1 ? "" : "s"} from <strong>{priority.name}</strong> to{" "}
                <strong>{trimmedName}</strong> in Databricks.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || (touched && hasErrors)}>
            {saving && <Icon icon="loader-circle" className="w-4 h-4 mr-1.5 animate-spin" />}
            {priority ? (isRename && priority.total_count > 0 ? "Save and update exceptions" : "Save changes") : "Create priority"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
