import type {
  ExceptionRecord,
  Priority,
  ExceptionStatus,
  IssueCategory,
  ServiceType,
  ActivityEntry,
} from "./types.js";
import { APP_USERS } from "./users.js";

let exceptionCounter = 151;

function generateId(): string {
  return `EXC-${String(exceptionCounter++).padStart(4, "0")}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function activity(user: string, action: string, details: string, daysAgoN: number): ActivityEntry {
  return {
    id: Math.random().toString(36).slice(2),
    timestamp: daysAgo(daysAgoN),
    user,
    action,
    details,
  };
}

const SUBTYPES: Record<IssueCategory, string[]> = {
  Inventory: ["Stockout", "Low Stock", "Expiry Risk", "Recalls", "Storage Issue"],
  Insurance: ["Prior Auth Denied", "Coverage Lapsed", "Wrong Payer", "Copay Dispute", "Formulary Exception"],
  Staffing: ["Sick Call", "No-Show", "Understaffing", "Training Gap", "Overtime Limit"],
  "Workflow Delay": ["Queue Backup", "Verification Bottleneck", "Intake Backlog", "Packing Delay", "Courier Late"],
  Technology: ["System Outage", "Interface Error", "Printer Failure", "Software Bug", "Network Issue"],
  Vendor: ["Delivery Delay", "Incorrect Shipment", "Contract Issue", "Quality Concern", "Price Discrepancy"],
  Shipping: ["Lost Package", "Carrier Delay", "Damaged Shipment", "Wrong Address", "Weather Hold"],
  "Prescription Clarification": ["Illegible Rx", "Drug-Drug Interaction", "Dose Query", "Missing Info", "Prescriber Unavailable"],
  Capacity: ["Volume Surge", "Space Constraint", "Equipment Limit", "Overnight Backlog", "Holiday Surge"],
  Other: ["Patient Complaint", "Regulatory Query", "Audit Request", "Billing Dispute", "Process Review"],
};

// Pre-seeded compelling scenarios
const SCENARIO_RECORDS: Partial<ExceptionRecord>[] = [
  // SCENARIO 1: Critical inventory shortage - Tacrolimus affecting transplant locations
  {
    id: "EXC-0001",
    issueCategory: "Inventory",
    issueSubtype: "Stockout",
    priority: "Critical",
    status: "In Progress",
    locationId: "loc-03",
    serviceType: "Specialty Pharmacy",
    prescriptionsAffected: 47,
    estimatedImpact: "47 transplant patients unable to fill Tacrolimus; risk of organ rejection",
    description: "Tacrolimus 1mg capsules are completely out of stock across our specialty network. Wholesaler McKesson unable to fulfill emergency order due to manufacturer backorder. Affecting post-transplant patients.",
    immediateActionTaken: "Contacted alternative wholesaler AmerisourceBergen; pharmacist counseling initiated for all affected patients.",
    medicationName: "Tacrolimus 1mg capsules",
    vendorName: "McKesson Medical",
    resolutionDueDate: daysFromNow(1),
    assignedOwner: "user-03",
    createdAt: daysAgo(3),
    lastUpdatedAt: daysAgo(0.1),
    activityHistory: [
      activity("Priya Nandakumar", "Created", "Exception logged for Tacrolimus shortage", 3),
      activity("Dr. Samantha Reyes", "Escalated", "Escalated to Critical — patient safety risk identified", 2),
      activity("Priya Nandakumar", "Updated", "Emergency order placed with AmerisourceBergen; ETA 48 hours", 1),
      activity("Marcus Webb", "Note Added", "Regional director notified; Summit Transplant (loc-06) also affected", 0.5),
    ],
  },
  {
    id: "EXC-0002",
    issueCategory: "Inventory",
    issueSubtype: "Stockout",
    priority: "Critical",
    status: "Assigned",
    locationId: "loc-06",
    serviceType: "Transplant Pharmacy",
    prescriptionsAffected: 31,
    estimatedImpact: "31 transplant patients affected by Tacrolimus shortage; secondary site impacted",
    description: "Summit Transplant Services experiencing same Tacrolimus 1mg stockout as Northgate. Patient referrals from regional hospitals cannot be filled.",
    immediateActionTaken: "Coordinating with Northgate on shared supply; manual patient tracking initiated.",
    medicationName: "Tacrolimus 1mg capsules",
    vendorName: "McKesson Medical",
    resolutionDueDate: daysFromNow(1),
    assignedOwner: "user-01",
    createdAt: daysAgo(2),
    lastUpdatedAt: daysAgo(0.2),
    activityHistory: [
      activity("Dr. Samantha Reyes", "Created", "Exception created — mirroring Northgate shortage", 2),
      activity("Dr. Samantha Reyes", "Assigned", "Assigned to self for enterprise-level coordination", 1),
    ],
  },

  // SCENARIO 2: Technology outage at Westfield Central Fill
  {
    id: "EXC-0003",
    issueCategory: "Technology",
    issueSubtype: "System Outage",
    priority: "Critical",
    status: "In Progress",
    locationId: "loc-04",
    serviceType: "Central Fill",
    prescriptionsAffected: 312,
    estimatedImpact: "Central fill dispensing system offline; 312 prescriptions backlogged across 4 downstream locations",
    description: "QS/1 dispensing automation system at Westfield Central Fill experienced catastrophic database failure at 06:42. All automated filling suspended. Manual verification required for all active queues.",
    immediateActionTaken: "Downtime procedures activated; IT ticket submitted; vendor Omnicell support engaged; overflow routed to loc-02.",
    systemAffected: "QS/1 Dispensing Automation",
    resolutionDueDate: daysFromNow(0),
    assignedOwner: "user-05",
    createdAt: daysAgo(8),
    lastUpdatedAt: daysAgo(0.05),
    activityHistory: [
      activity("Elena Torres", "Created", "System outage identified — QS/1 dispenser offline", 8),
      activity("Dr. Samantha Reyes", "Escalated", "Escalated to Critical — downtime procedures activated", 8),
      activity("Elena Torres", "Updated", "Omnicell vendor support ETA 4 hours", 7),
      activity("Elena Torres", "Updated", "Partial system recovery — 40% capacity restored", 5),
      activity("Marcus Webb", "Note Added", "Overflow prescriptions being processed manually at loc-02", 3),
      activity("Elena Torres", "Updated", "Lingering performance issues — root cause under investigation", 1),
    ],
  },

  // SCENARIO 3: Staffing shortage at Meridian Main Campus
  {
    id: "EXC-0004",
    issueCategory: "Staffing",
    issueSubtype: "Sick Call",
    priority: "High",
    status: "In Progress",
    locationId: "loc-01",
    serviceType: "Retail Pharmacy",
    prescriptionsAffected: 85,
    estimatedImpact: "3 pharmacists called out sick; TAT increased 40%; patient wait times exceeding 60 minutes",
    description: "Three pharmacists on the evening shift at Meridian Main Campus called out sick. Current staffing at 52% of scheduled level. Retail pharmacy wait times now averaging 62 minutes vs 38-minute target.",
    immediateActionTaken: "On-call pharmacist contacted; per-diem coverage requested; posted mandatory overtime.",
    shift: "Evening (3PM–11PM)",
    scheduledStaff: 8,
    actualStaff: 4,
    resolutionDueDate: daysFromNow(1),
    assignedOwner: "user-02",
    createdAt: daysAgo(2),
    lastUpdatedAt: daysAgo(0.3),
    activityHistory: [
      activity("Marcus Webb", "Created", "Staffing shortage reported — 3 sick calls received", 2),
      activity("Marcus Webb", "Updated", "On-call pharmacist secured; 1 per-diem confirmed", 1),
      activity("Marcus Webb", "Note Added", "Patient wait times improving but still above target", 0.5),
    ],
  },

  // SCENARIO 4: Shipping delay - specialty medications
  {
    id: "EXC-0005",
    issueCategory: "Shipping",
    issueSubtype: "Carrier Delay",
    priority: "High",
    status: "Waiting on External Party",
    locationId: "loc-07",
    serviceType: "Mail Order",
    prescriptionsAffected: 63,
    estimatedImpact: "63 specialty prescriptions delayed 2-3 days; multiple biologic medications at temperature risk",
    description: "FedEx cold-chain shipment batch held at Memphis hub due to weather-related airport closure. 63 specialty prescriptions including biologics in temperature-controlled packaging. Estimated 48-hour delay.",
    immediateActionTaken: "FedEx case opened (#FC-2024-88341); patients notified via automated outreach; backup supply assessment underway.",
    carrier: "FedEx Priority Overnight",
    resolutionDueDate: daysFromNow(2),
    assignedOwner: "user-07",
    createdAt: daysAgo(1),
    lastUpdatedAt: daysAgo(0.4),
    activityHistory: [
      activity("Natasha Monroe", "Created", "Shipping delay identified — FedEx hub weather delay", 1),
      activity("Natasha Monroe", "Updated", "Case escalated to FedEx specialty pharma team", 0.8),
      activity("Natasha Monroe", "Note Added", "Temperature logger data requested from FedEx; medication integrity may be affected", 0.3),
    ],
  },

  // SCENARIO 5: Insurance processing issue
  {
    id: "EXC-0006",
    issueCategory: "Insurance",
    issueSubtype: "Prior Auth Denied",
    priority: "High",
    status: "Under Review",
    locationId: "loc-11",
    serviceType: "Specialty Pharmacy",
    prescriptionsAffected: 28,
    estimatedImpact: "28 specialty Rx rejections from BlueCross PA policy change effective 11/1; estimated $84,000 ARV",
    description: "BlueCross BlueShield updated their prior authorization policy for specialty biologics effective Nov 1. 28 active prescriptions rejected under new PA requirements. Estimated revenue impact $84,000.",
    immediateActionTaken: "PA submissions initiated for all 28 cases; physicians notified; appeal letters prepared.",
    rejectionCategory: "Prior Authorization Required",
    resolutionDueDate: daysFromNow(5),
    assignedOwner: "user-09",
    createdAt: daysAgo(4),
    lastUpdatedAt: daysAgo(0.6),
    activityHistory: [
      activity("Linda Choi", "Created", "PA rejection wave identified following BlueCross policy change", 4),
      activity("Priya Nandakumar", "Reviewed", "Assigned to specialty team; PA submissions prioritized", 3),
      activity("Linda Choi", "Updated", "8 of 28 PAs approved; 20 still pending", 1),
    ],
  },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBulkExceptions(): ExceptionRecord[] {
  const locationIds = [
    "loc-01", "loc-02", "loc-03", "loc-04", "loc-05",
    "loc-06", "loc-07", "loc-08", "loc-09", "loc-10", "loc-11", "loc-12"
  ];
  const serviceTypes: ServiceType[] = [
    "Retail Pharmacy", "Specialty Pharmacy", "Central Fill",
    "Mail Order", "Transplant Pharmacy", "Clinic Pharmacy", "Medication Access Services"
  ];
  const categories: IssueCategory[] = [
    "Inventory", "Insurance", "Staffing", "Workflow Delay", "Technology",
    "Vendor", "Shipping", "Prescription Clarification", "Capacity", "Other"
  ];
  const priorities: Priority[] = ["Low", "Low", "Medium", "Medium", "Medium", "High", "High", "Critical"];
  const statuses: ExceptionStatus[] = [
    "New", "New", "Under Review", "Assigned", "In Progress",
    "Waiting on External Party", "Resolved", "Resolved", "Closed"
  ];

  const records: ExceptionRecord[] = [];

  for (let i = 7; i <= 150; i++) {
    const id = `EXC-${String(i).padStart(4, "0")}`;
    const daysOpenN = Math.floor(Math.random() * 30);
    const cat = randomFrom(categories);
    const priority = randomFrom(priorities);
    const status = randomFrom(statuses);
    const locationId = randomFrom(locationIds);
    const userIndex = Math.floor(Math.random() * APP_USERS.length);
    const user = APP_USERS[userIndex];
    const rxAffected = Math.round(Math.random() * 60 + 1);

    const isResolved = status === "Resolved" || status === "Closed";
    const updatedHoursAgo = Math.random() * 48;

    records.push({
      id,
      createdAt: daysAgo(daysOpenN + Math.random() * 0.5),
      locationId,
      serviceType: randomFrom(serviceTypes),
      issueCategory: cat,
      issueSubtype: randomFrom(SUBTYPES[cat]),
      priority,
      status,
      assignedOwner: user.id,
      daysOpen: daysOpenN,
      estimatedImpact: isResolved
        ? "Resolved — no ongoing impact"
        : `${rxAffected} prescriptions affected; operational impact ${priority === "Critical" ? "severe" : priority === "High" ? "significant" : "moderate"}`,
      prescriptionsAffected: rxAffected,
      lastUpdatedAt: new Date(Date.now() - updatedHoursAgo * 3600000).toISOString(),
      resolutionDueDate: daysFromNow(isResolved ? -1 : Math.ceil(Math.random() * 7)),
      description: `${cat} issue at ${locationId}: ${randomFrom(SUBTYPES[cat])} identified requiring attention.`,
      resolutionSummary: isResolved ? "Issue resolved through standard procedures. Root cause documented." : "",
      immediateActionTaken: "Initial assessment completed; appropriate team notified.",
      notes: [],
      activityHistory: [
        activity(user.name, "Created", `Exception created — ${cat} / ${randomFrom(SUBTYPES[cat])}`, daysOpenN),
        ...(daysOpenN > 2 ? [activity(user.name, "Updated", "Status updated following review", Math.floor(daysOpenN / 2))] : []),
        ...(isResolved ? [activity(user.name, "Resolved", "Issue resolved and documented", 0.5)] : []),
      ],
    });
  }
  return records;
}

// Build the full exception store with scenario records first
const scenarioRecords: ExceptionRecord[] = SCENARIO_RECORDS.map((s, i) => ({
  id: s.id ?? `EXC-${String(i + 1).padStart(4, "0")}`,
  createdAt: s.createdAt ?? daysAgo(Math.random() * 10),
  locationId: s.locationId ?? "loc-01",
  serviceType: s.serviceType ?? "Retail Pharmacy",
  issueCategory: s.issueCategory ?? "Other",
  issueSubtype: s.issueSubtype ?? "Other",
  priority: s.priority ?? "Medium",
  status: s.status ?? "New",
  assignedOwner: s.assignedOwner ?? "user-01",
  daysOpen: Math.round(
    (Date.now() - new Date(s.createdAt ?? daysAgo(1)).getTime()) / (1000 * 60 * 60 * 24)
  ),
  estimatedImpact: s.estimatedImpact ?? "Under assessment",
  prescriptionsAffected: s.prescriptionsAffected ?? 0,
  lastUpdatedAt: s.lastUpdatedAt ?? daysAgo(0.1),
  resolutionDueDate: s.resolutionDueDate ?? daysFromNow(3),
  description: s.description ?? "",
  resolutionSummary: s.resolutionSummary ?? "",
  immediateActionTaken: s.immediateActionTaken ?? "",
  notes: s.notes ?? [],
  activityHistory: s.activityHistory ?? [],
  medicationName: s.medicationName,
  vendorName: s.vendorName,
  systemAffected: s.systemAffected,
  carrier: s.carrier,
  rejectionCategory: s.rejectionCategory,
  shift: s.shift,
  scheduledStaff: s.scheduledStaff,
  actualStaff: s.actualStaff,
}));

let _exceptionsStore: ExceptionRecord[] = [
  ...scenarioRecords,
  ...generateBulkExceptions(),
];

// Exported getters and mutators
export function getExceptions(): ExceptionRecord[] {
  return _exceptionsStore;
}

export function getExceptionById(id: string): ExceptionRecord | undefined {
  return _exceptionsStore.find((e) => e.id === id);
}

export function updateException(id: string, updates: Partial<ExceptionRecord>): ExceptionRecord | null {
  const idx = _exceptionsStore.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const prev = _exceptionsStore[idx];
  const updated: ExceptionRecord = {
    ...prev,
    ...updates,
    lastUpdatedAt: new Date().toISOString(),
    daysOpen: Math.round(
      (Date.now() - new Date(prev.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    ),
  };
  _exceptionsStore = [
    ..._exceptionsStore.slice(0, idx),
    updated,
    ..._exceptionsStore.slice(idx + 1),
  ];
  return updated;
}

export function addException(record: ExceptionRecord): void {
  _exceptionsStore = [record, ..._exceptionsStore];
}

export function generateExceptionId(): string {
  const maxId = _exceptionsStore.reduce((max, e) => {
    const n = parseInt(e.id.replace("EXC-", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `EXC-${String(maxId + 1).padStart(4, "0")}`;
}

// Analytics helpers
export function getExceptionsByCategory(): { category: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const e of _exceptionsStore.filter(
    (e) => e.status !== "Resolved" && e.status !== "Closed"
  )) {
    counts[e.issueCategory] = (counts[e.issueCategory] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getExceptionsByStatus(): { status: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const e of _exceptionsStore) {
    counts[e.status] = (counts[e.status] ?? 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

export function getOpenExceptionsByLocation(): { locationId: string; count: number; critical: number }[] {
  const result: Record<string, { count: number; critical: number }> = {};
  for (const e of _exceptionsStore.filter(
    (e) => e.status !== "Resolved" && e.status !== "Closed"
  )) {
    if (!result[e.locationId]) result[e.locationId] = { count: 0, critical: 0 };
    result[e.locationId].count++;
    if (e.priority === "Critical") result[e.locationId].critical++;
  }
  return Object.entries(result).map(([locationId, v]) => ({ locationId, ...v }));
}
