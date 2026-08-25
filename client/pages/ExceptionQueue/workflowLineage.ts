import type { ExceptionRecord } from "@/data/types";
import { subHours, subMinutes, subDays, format, parseISO } from "date-fns";

export interface WorkflowStep {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  system: string;
  detail: string;
  isCurrent: boolean;
  status: "completed" | "active" | "pending";
  icon: "zap" | "file-text" | "bell" | "inbox" | "user-check" | "clipboard-check" | "message-square" | "phone" | "check-circle" | "x-circle" | "alert-triangle" | "send" | "rotate-ccw" | "clock";
}

// Deterministic seed from exception ID
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generate a realistic workflow lineage for an exception based on its
 * category, status, age, and activity history.
 */
export function generateWorkflowLineage(exception: ExceptionRecord): WorkflowStep[] {
  const seed = hashCode(exception.id);
  const createdAt = parseISO(exception.createdAt);
  const steps: WorkflowStep[] = [];
  let stepIndex = 0;

  const isResolved = exception.status === "Resolved" || exception.status === "Closed";
  const isWaiting = exception.status === "Waiting on External Party";
  const isInProgress = exception.status === "In Progress";
  const isAssigned = exception.status === "Assigned";
  const isUnderReview = exception.status === "Under Review";

  // Helper to generate timestamps working backward from creation
  const preCreationOffset = (hoursBack: number) =>
    format(subHours(createdAt, hoursBack), "yyyy-MM-dd'T'HH:mm:ss");
  const postCreationOffset = (minutesAfter: number) =>
    format(subMinutes(createdAt, -minutesAfter), "yyyy-MM-dd'T'HH:mm:ss");

  // ─── Step 1: Initial trigger (varies by category) ───
  const triggerEvents: Record<string, { event: string; actor: string; system: string; detail: string; icon: WorkflowStep["icon"] }> = {
    Insurance: {
      event: "PA Rejection Received",
      actor: "CoverMyMeds/RelayHealth",
      system: "NCPDP Switch",
      detail: `Claim rejected — ${exception.rejectionCategory || "Prior Authorization Required"} (Carrier: ${exception.carrier || "Cigna PBM"})`,
      icon: "zap",
    },
    Inventory: {
      event: "Stock-Out Alert Triggered",
      actor: "EnterpriseRx",
      system: "Dispensing System",
      detail: `Inventory below safety threshold for ${exception.medicationName || "medication"} at ${exception.locationId}`,
      icon: "alert-triangle",
    },
    Staffing: {
      event: "Staffing Gap Detected",
      actor: "QGenda Scheduler",
      system: "Workforce System",
      detail: `${exception.shift || "Day"} shift — scheduled: ${exception.scheduledStaff ?? 5}, actual: ${exception.actualStaff ?? 3}`,
      icon: "alert-triangle",
    },
    "Workflow Delay": {
      event: "SLA Breach Threshold Reached",
      actor: "Epic Willow/WAM",
      system: "Pharmacy System",
      detail: `Processing time exceeded threshold — ${exception.medicationName || "prescription"} delayed beyond target TAT`,
      icon: "clock",
    },
    Technology: {
      event: "System Error Logged",
      actor: exception.systemAffected || "Epic Hyperspace",
      system: "Health IT",
      detail: `Interface error detected — ${exception.description?.slice(0, 80) || "system connectivity issue"}`,
      icon: "alert-triangle",
    },
    Vendor: {
      event: "Vendor SLA Violation Detected",
      actor: exception.vendorName || "McKesson Distribution",
      system: "Supply Chain",
      detail: `Delivery/fulfillment issue — ${exception.description?.slice(0, 80) || "vendor commitment missed"}`,
      icon: "alert-triangle",
    },
    Shipping: {
      event: "Shipping Exception Flagged",
      actor: "FedEx/UPS Integration",
      system: "Logistics",
      detail: `Package delivery issue — ${exception.description?.slice(0, 80) || "shipment delayed or returned"}`,
      icon: "send",
    },
    "Prescription Clarification": {
      event: "Clarification Request Generated",
      actor: "Pharmacist Review",
      system: "Epic Willow",
      detail: `Clinical clarification needed — ${exception.medicationName || "prescription"} requires provider input`,
      icon: "file-text",
    },
    Capacity: {
      event: "Capacity Threshold Exceeded",
      actor: "Operations Monitor",
      system: "Workflow Engine",
      detail: `Volume exceeds operational capacity at ${exception.locationId}`,
      icon: "alert-triangle",
    },
  };

  const trigger = triggerEvents[exception.issueCategory] || triggerEvents["Workflow Delay"];

  steps.push({
    id: `step-${stepIndex++}`,
    timestamp: preCreationOffset(seed % 3 + 1),
    event: trigger.event,
    actor: trigger.actor,
    system: trigger.system,
    detail: trigger.detail,
    isCurrent: false,
    status: "completed",
    icon: trigger.icon,
  });

  // ─── Step 2: Exception auto-created ───
  steps.push({
    id: `step-${stepIndex++}`,
    timestamp: exception.createdAt,
    event: "Exception Auto-Created",
    actor: "Health Bridge Platform",
    system: "Exception Engine",
    detail: `${exception.id} created — ${exception.issueCategory} / ${exception.issueSubtype} • Priority: ${exception.priority}`,
    isCurrent: false,
    status: "completed",
    icon: "file-text",
  });

  // ─── Step 3: Notifications sent (conditional) ───
  if (exception.priority === "Critical" || exception.priority === "High" || exception.daysOpen > 2) {
    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: postCreationOffset(2 + (seed % 5)),
      event: "MHAV Notification Sent",
      actor: "Patient Communication Engine",
      system: "My Health at Vanderbilt",
      detail: `Patient notified of potential delay via MHAV secure message`,
      isCurrent: false,
      status: "completed",
      icon: "bell",
    });
  }

  // ─── Step 4: In-Basket routed (for Insurance/Prescription categories) ───
  if (["Insurance", "Prescription Clarification", "Workflow Delay"].includes(exception.issueCategory)) {
    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: postCreationOffset(5 + (seed % 10)),
      event: "In-Basket Message Routed",
      actor: "Epic Integration",
      system: "Epic In-Basket",
      detail: `Work item routed to ${exception.serviceType} team queue for clinical review`,
      isCurrent: false,
      status: "completed",
      icon: "inbox",
    });
  }

  // ─── Step 5: Staff assigned ───
  if (exception.status !== "New") {
    const assignedUser = exception.assignedOwner || "Unassigned";
    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: postCreationOffset(15 + (seed % 30)),
      event: "Staff Assigned",
      actor: "Workflow Router",
      system: "Exception Engine",
      detail: `Assigned to ${assignedUser} based on ${exception.serviceType} team workload balancing`,
      isCurrent: false,
      status: "completed",
      icon: "user-check",
    });
  }

  // ─── Step 6: Under Review / Investigation started ───
  if (["Under Review", "Assigned", "In Progress", "Waiting on External Party", "Resolved", "Closed"].includes(exception.status)) {
    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: postCreationOffset(60 + (seed % 120)),
      event: "Investigation Started",
      actor: exception.assignedOwner || "Pharmacy Staff",
      system: "Manual Review",
      detail: exception.immediateActionTaken || `Initial assessment underway — reviewing ${exception.issueCategory.toLowerCase()} details`,
      isCurrent: false,
      status: "completed",
      icon: "clipboard-check",
    });
  }

  // ─── Step 7: External outreach (if Waiting or further) ───
  if (isWaiting || isInProgress || isResolved) {
    const externalActor = exception.issueCategory === "Insurance"
      ? (exception.carrier || "Insurance Payer")
      : exception.issueCategory === "Vendor"
        ? (exception.vendorName || "Vendor")
        : "External Party";

    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: postCreationOffset(180 + (seed % 360)),
      event: "External Outreach Initiated",
      actor: exception.assignedOwner || "Pharmacy Staff",
      system: "Communications",
      detail: `Contacted ${externalActor} — awaiting response on resolution path`,
      isCurrent: false,
      status: "completed",
      icon: "phone",
    });
  }

  // ─── Step 8: Notes / follow-ups from activity history ───
  const noteActions = exception.activityHistory.filter(
    (a) => a.action === "Note Added" || a.action === "Status Changed"
  );
  for (const note of noteActions.slice(0, 3)) {
    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: note.timestamp,
      event: note.action === "Note Added" ? "Follow-Up Note Added" : "Status Updated",
      actor: note.user,
      system: "Exception Engine",
      detail: note.details,
      isCurrent: false,
      status: "completed",
      icon: "message-square",
    });
  }

  // ─── Step 9: Resolution (if resolved/closed) ───
  if (isResolved) {
    steps.push({
      id: `step-${stepIndex++}`,
      timestamp: exception.lastUpdatedAt,
      event: exception.status === "Closed" ? "Exception Closed" : "Exception Resolved",
      actor: exception.assignedOwner || "System",
      system: "Exception Engine",
      detail: exception.resolutionSummary || "Resolution completed — no further action required",
      isCurrent: true,
      status: "completed",
      icon: exception.status === "Closed" ? "x-circle" : "check-circle",
    });
  }

  // ─── Mark current step ───
  if (!isResolved && steps.length > 0) {
    // Last completed step becomes the "active" current position
    const lastStep = steps[steps.length - 1];
    lastStep.isCurrent = true;
    lastStep.status = "active";

    // Add pending next steps based on status
    if (exception.status === "New") {
      steps.push({
        id: `step-${stepIndex++}`,
        timestamp: "",
        event: "Awaiting Triage & Assignment",
        actor: "—",
        system: "Exception Engine",
        detail: "Exception pending initial review and staff assignment",
        isCurrent: false,
        status: "pending",
        icon: "clock",
      });
    } else if (isWaiting) {
      steps.push({
        id: `step-${stepIndex++}`,
        timestamp: "",
        event: "Awaiting External Response",
        actor: "—",
        system: "Pending",
        detail: `Waiting on response from external party to proceed`,
        isCurrent: false,
        status: "pending",
        icon: "clock",
      });
    } else if (isInProgress || isAssigned || isUnderReview) {
      steps.push({
        id: `step-${stepIndex++}`,
        timestamp: "",
        event: "Resolution Pending",
        actor: "—",
        system: "Exception Engine",
        detail: "Active work in progress — target resolution by due date",
        isCurrent: false,
        status: "pending",
        icon: "clock",
      });
    }
  }

  // Sort by timestamp (empty timestamps go last)
  steps.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return 1;
    return a.timestamp.localeCompare(b.timestamp);
  });

  return steps;
}
