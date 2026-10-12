import { useState, useCallback, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { PriorityBadge, StatusBadge } from "@/components/shared/StatusBadges";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ExceptionRecord, ExceptionStatus, Priority } from "@/data/types";
import { updateException } from "@/data/exceptions";
import { getLocationName } from "@/data/locations";
import { APP_USERS } from "@/data/users";
import { useAppContext } from "@/context/AppContext";
import WorkflowLineageTab from "./WorkflowLineageTab";
import { useApi } from "@/hooks/useApi";

interface ExceptionDrawerProps {
  exception: ExceptionRecord | null;
  open: boolean;
  onClose: () => void;
}

const STATUSES: ExceptionStatus[] = [
  "New", "Under Review", "Assigned", "In Progress",
  "Waiting on External Party", "Resolved", "Closed",
];
const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Critical"];

function formatTs(ts: string) {
  try { return format(parseISO(ts), "MMM d, yyyy h:mm a"); } catch { return ts; }
}

export default function ExceptionDrawer({ exception, open, onClose }: ExceptionDrawerProps) {
  const { triggerExceptionRefresh, userName } = useAppContext();
  const { run: runUpdateException } = useApi("UpdateException");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "resolve" | "reopen" | "close">(null);
  const [sharePreview, setSharePreview] = useState<null | "teams" | "email">(null);
  const [teamsChannel, setTeamsChannel] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "lineage">("details");

  // Reset tab when switching exceptions
  useEffect(() => {
    setActiveTab("details");
  }, [exception?.id]);

  // Edit state
  const [editStatus, setEditStatus] = useState<ExceptionStatus>("New");
  const [editPriority, setEditPriority] = useState<Priority>("Medium");
  const [editOwner, setEditOwner] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editImpact, setEditImpact] = useState("");
  const [editResolution, setEditResolution] = useState("");

  const startEdit = useCallback(() => {
    if (!exception) return;
    setEditStatus(exception.status);
    setEditPriority(exception.priority);
    setEditOwner(exception.assignedOwner);
    setEditDueDate(exception.resolutionDueDate);
    setEditImpact(exception.estimatedImpact);
    setEditResolution(exception.resolutionSummary);
    setEditing(true);
  }, [exception]);

  const handleSave = useCallback(async () => {
    if (!exception || saving) return;

    const user = APP_USERS.find((u) => u.id === editOwner);
    const ownerName = user?.name ?? editOwner;

    try {
      setSaving(true);

      const result = await runUpdateException({
        id: exception.id,
        status: editStatus,
        priority: editPriority,
        owner: ownerName,
        dueDate: editDueDate ?? "",
      });

      if (!result?.success) {
        throw new Error("UpdateException did not return success");
      }

      updateException(exception.id, {
        status: editStatus,
        priority: editPriority,
        assignedOwner: editOwner,
        resolutionDueDate: editDueDate,
        estimatedImpact: editImpact,
        resolutionSummary: editResolution,
        activityHistory: [
          ...exception.activityHistory,
          {
            id: Math.random().toString(36).slice(2),
            timestamp: new Date().toISOString(),
            user: userName,
            action: "Updated",
            details: `Status → ${editStatus} | Priority → ${editPriority} | Owner → ${ownerName}`,
          },
        ],
      });

      setEditing(false);
      triggerExceptionRefresh();
      toast.success("Exception updated successfully");
    } catch (error) {
      console.error("UpdateException failed:", error);
      toast.error("Unable to update exception");
    } finally {
      setSaving(false);
    }
  }, [
    exception,
    saving,
    runUpdateException,
    editStatus,
    editPriority,
    editOwner,
    editDueDate,
    editImpact,
    editResolution,
    triggerExceptionRefresh,
    userName,
  ]);

  const handleAddNote = useCallback(() => {
    if (!exception || !noteText.trim()) return;
    updateException(exception.id, {
      notes: [...exception.notes, noteText.trim()],
      activityHistory: [
        ...exception.activityHistory,
        {
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          user: userName,
          action: "Note Added",
          details: noteText.trim(),
        },
      ],
    });
    setNoteText("");
    triggerExceptionRefresh();
    toast.success("Note added");
  }, [exception, noteText, triggerExceptionRefresh]);

  const handleConfirmedAction = useCallback(() => {
    if (!exception || !confirmAction) return;
    const newStatus: ExceptionStatus =
      confirmAction === "resolve" ? "Resolved"
      : confirmAction === "close" ? "Closed"
      : "New";
    updateException(exception.id, {
      status: newStatus,
      activityHistory: [
        ...exception.activityHistory,
        {
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          user: userName,
          action: confirmAction === "reopen" ? "Reopened" : confirmAction === "close" ? "Closed" : "Resolved",
          details: `Exception ${newStatus}`,
        },
      ],
    });
    setConfirmAction(null);
    triggerExceptionRefresh();
    toast.success(`Exception ${newStatus.toLowerCase()}`);
  }, [exception, confirmAction, triggerExceptionRefresh]);

  // Build formatted share message
  const shareMessage = useMemo(() => {
    if (!exception) return "";
    const ownerName = APP_USERS.find((u) => u.id === exception.assignedOwner)?.name ?? exception.assignedOwner;
    const latestNotes = exception.notes.slice(-3);
    return [
      `🚨 Exception ${exception.id} — ${exception.status}`,
      ``,
      `Priority: ${exception.priority}`,
      `Category: ${exception.issueCategory} — ${exception.issueSubtype}`,
      `Location: ${getLocationName(exception.locationId)}`,
      `Service: ${exception.serviceType}`,
      `Owner: ${ownerName}`,
      `Days Open: ${exception.daysOpen} | Rx Affected: ${exception.prescriptionsAffected}`,
      `Due: ${exception.resolutionDueDate}`,
      ``,
      `Description: ${exception.description || "N/A"}`,
      `Impact: ${exception.estimatedImpact || "N/A"}`,
      ...(latestNotes.length > 0 ? [``, `Recent Notes:`, ...latestNotes.map((n) => `  • ${n}`)] : []),
      ...(exception.resolutionSummary ? [``, `Resolution: ${exception.resolutionSummary}`] : []),
    ].join("\n");
  }, [exception]);

  const handleShare = useCallback((channel: "teams" | "email") => {
    setSharePreview(null);
    toast.success(`Ready to send via ${channel === "teams" ? "Microsoft Teams" : "Email"} — integration not yet connected`, {
      description: "Connect the integration in Administration to enable sending.",
      duration: 4000,
    });
  }, []);

  if (!exception) return null;

  const isOverdue = new Date(exception.resolutionDueDate) < new Date() && exception.status !== "Resolved" && exception.status !== "Closed";
  const isResolved = exception.status === "Resolved" || exception.status === "Closed";

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto flex flex-col gap-0 p-0">
          <SheetHeader className="px-5 pt-5 pb-4 border-b bg-muted/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <SheetTitle className="text-base font-semibold">{exception.id}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {exception.issueCategory} — {exception.issueSubtype}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium border border-amber-200">Internal Only</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium border border-red-200">PHI-Adjacent</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">De-identified</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <PriorityBadge priority={exception.priority} />
                <StatusBadge status={exception.status} />
                {isOverdue && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 rounded">Overdue</span>}
              </div>
            </div>
            {/* Tab switcher */}
            <div className="flex gap-1 mt-3 bg-muted/50 rounded-lg p-0.5 border">
              <button
                onClick={() => setActiveTab("details")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all",
                  activeTab === "details"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon icon="file-text" className="w-3 h-3" />
                Details
              </button>
              <button
                onClick={() => setActiveTab("lineage")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all",
                  activeTab === "lineage"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon icon="git-branch" className="w-3 h-3" />
                Workflow Lineage
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {activeTab === "lineage" ? (
              <WorkflowLineageTab exception={exception} />
            ) : (
            <>
            {/* Key info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Location</span>
                <p className="font-medium">{getLocationName(exception.locationId)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Service Type</span>
                <p className="font-medium">{exception.serviceType}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Created</span>
                <p>{formatTs(exception.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Last Updated</span>
                <p>{formatTs(exception.lastUpdatedAt)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Assigned Owner</span>
                <p className="font-medium">{APP_USERS.find((u) => u.id === exception.assignedOwner)?.name ?? exception.assignedOwner}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Due Date</span>
                <p className={isOverdue ? "text-red-600 font-semibold" : ""}>{exception.resolutionDueDate}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Days Open</span>
                <p>{exception.daysOpen} days</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Rx Affected</span>
                <p className="font-medium">{exception.prescriptionsAffected.toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Description</h3>
              <p className="text-sm">{exception.description || "No description provided."}</p>
            </div>

            {/* Impact */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Operational Impact</h3>
              <p className="text-sm">{exception.estimatedImpact || "—"}</p>
            </div>

            {/* Immediate action */}
            {exception.immediateActionTaken && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Immediate Action Taken</h3>
                <p className="text-sm">{exception.immediateActionTaken}</p>
              </div>
            )}

            {/* Resolution summary */}
            {exception.resolutionSummary && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Resolution Summary</h3>
                <p className="text-sm">{exception.resolutionSummary}</p>
              </div>
            )}

            <Separator />

            {/* Edit form */}
            {editing && (
              <div className="space-y-3 bg-muted/30 rounded-lg p-4 border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Edit Record</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ExceptionStatus)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Assigned Owner</Label>
                    <Select value={editOwner} onValueChange={setEditOwner}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{APP_USERS.map((u) => <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Due Date</Label>
                    <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Operational Impact</Label>
                  <Textarea value={editImpact} onChange={(e) => setEditImpact(e.target.value)} rows={2} className="text-xs resize-none" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Resolution Summary</Label>
                  <Textarea value={editResolution} onChange={(e) => setEditResolution(e.target.value)} rows={2} className="text-xs resize-none" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs h-7">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs h-7">Cancel</Button>
                </div>
              </div>
            )}

            {/* Add Note */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Add Note</h3>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Enter a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="text-xs resize-none flex-1"
                />
                <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()} className="self-end text-xs h-8">
                  Add
                </Button>
              </div>
            </div>

            {/* Notes */}
            {exception.notes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Notes ({exception.notes.length})</h3>
                <div className="space-y-2">
                  {exception.notes.map((note, i) => (
                    <div key={i} className="text-sm bg-muted/40 rounded px-3 py-2 border">{note}</div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Activity history */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Activity History</h3>
              <div className="space-y-2">
                {[...exception.activityHistory].reverse().map((entry) => (
                  <div key={entry.id} className="flex gap-2.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{entry.user}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium text-primary">{entry.action}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">{formatTs(entry.timestamp)}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 break-words">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </>
            )}
          </div>
          <div className="px-5 py-4 border-t bg-muted/20 flex flex-wrap gap-2">
            {!editing && (
              <Button size="sm" onClick={startEdit} className="text-xs h-8">
                <Icon icon="pencil" className="w-3 h-3 mr-1" /> Edit
              </Button>
            )}
            {!isResolved && (
              <Button size="sm" variant="outline" onClick={() => setConfirmAction("resolve")} className="text-xs h-8 text-green-700 border-green-300 hover:bg-green-50">
                <Icon icon="check-circle" className="w-3 h-3 mr-1" /> Resolve
              </Button>
            )}
            {isResolved && (
              <Button size="sm" variant="outline" onClick={() => setConfirmAction("reopen")} className="text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50">
                <Icon icon="rotate-ccw" className="w-3 h-3 mr-1" /> Reopen
              </Button>
            )}
            {exception.status !== "Closed" && (
              <Button size="sm" variant="outline" onClick={() => setConfirmAction("close")} className="text-xs h-8 text-muted-foreground">
                <Icon icon="x-circle" className="w-3 h-3 mr-1" /> Close
              </Button>
            )}

            {/* Share buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <Button size="sm" variant="outline" onClick={() => setSharePreview("teams")} className="text-xs h-8 text-[#6264A7] border-[#6264A7]/30 hover:bg-[#6264A7]/5">
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor"><path d="M19.2 6.4h-1.6V4.8c0-.88.72-1.6 1.6-1.6s1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm1.6 2.4h-4c-.44 0-.8.36-.8.8v4.4c0 1.32 1.08 2.4 2.4 2.4h1.6c1.32 0 2.4-1.08 2.4-2.4V9.6c0-.44-.36-.8-.8-.8zM14.4 5.6c0 1.32-1.08 2.4-2.4 2.4s-2.4-1.08-2.4-2.4S10.68 3.2 12 3.2s2.4 1.08 2.4 2.4zM16 9.6v5.2c0 2.1-1.7 3.8-3.8 3.8H9.8C7.7 18.6 6 16.9 6 14.8V9.6c0-.66.54-1.2 1.2-1.2h7.6c.66 0 1.2.54 1.2 1.2zM4 8.8H2.8c-.44 0-.8.36-.8.8v3.6c0 1.1.9 2 2 2h.8V9.6c0-.28.04-.56.12-.8z"/></svg>
                Teams
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSharePreview("email")} className="text-xs h-8 text-blue-600 border-blue-300 hover:bg-blue-50">
                <Icon icon="mail" className="w-3.5 h-3.5 mr-1" />
                Email
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {confirmAction === "resolve" ? "Resolution" : confirmAction === "close" ? "Closure" : "Reopen"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction === "resolve"
              ? `Are you sure you want to resolve exception ${exception.id}? This indicates the issue has been addressed.`
              : confirmAction === "close"
              ? `Are you sure you want to close exception ${exception.id}? Closed exceptions are archived.`
              : `Are you sure you want to reopen exception ${exception.id}? It will be returned to New status.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button onClick={handleConfirmedAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share preview dialog */}
      <Dialog open={!!sharePreview} onOpenChange={() => setSharePreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sharePreview === "teams" ? (
                <>
                  <svg className="w-5 h-5 text-[#6264A7]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.2 6.4h-1.6V4.8c0-.88.72-1.6 1.6-1.6s1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm1.6 2.4h-4c-.44 0-.8.36-.8.8v4.4c0 1.32 1.08 2.4 2.4 2.4h1.6c1.32 0 2.4-1.08 2.4-2.4V9.6c0-.44-.36-.8-.8-.8zM14.4 5.6c0 1.32-1.08 2.4-2.4 2.4s-2.4-1.08-2.4-2.4S10.68 3.2 12 3.2s2.4 1.08 2.4 2.4zM16 9.6v5.2c0 2.1-1.7 3.8-3.8 3.8H9.8C7.7 18.6 6 16.9 6 14.8V9.6c0-.66.54-1.2 1.2-1.2h7.6c.66 0 1.2.54 1.2 1.2zM4 8.8H2.8c-.44 0-.8.36-.8.8v3.6c0 1.1.9 2 2 2h.8V9.6c0-.28.04-.56.12-.8z"/></svg>
                  Share via Microsoft Teams
                </>
              ) : (
                <>
                  <Icon icon="mail" className="w-5 h-5 text-blue-600" />
                  Share via Email
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Recipient fields */}
            {sharePreview === "teams" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Channel or User</Label>
                <Input
                  placeholder="#pharmacy-ops or marcus.webb"
                  value={teamsChannel}
                  onChange={(e) => setTeamsChannel(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">To</Label>
                  <Input
                    placeholder="recipient@meridianhealth.demo"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CC</Label>
                  <Input
                    placeholder="cc@meridianhealth.demo (optional)"
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Preview of the message that will be sent when the integration is connected:
            </p>
            <div className="bg-muted/50 border rounded-md p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground">{shareMessage}</pre>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <Icon icon="info" className="w-3.5 h-3.5 shrink-0" />
              <span>Integration not yet connected. Configure in Administration to enable sending.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSharePreview(null)}>Cancel</Button>
            <Button onClick={() => handleShare(sharePreview!)}>
              <Icon icon="send" className="w-3.5 h-3.5 mr-1.5" />
              Send via {sharePreview === "teams" ? "Teams" : "Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
