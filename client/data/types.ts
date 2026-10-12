// Core types for the Pharmacy Operations Command Center

export type Priority = "Low" | "Medium" | "High" | "Critical";
export type ExceptionStatus = "New" | "Under Review" | "Assigned" | "In Progress" | "Waiting on External Party" | "Resolved" | "Closed";

export type IssueCategory =
  | "Inventory"
  | "Insurance"
  | "Staffing"
  | "Workflow Delay"
  | "Technology"
  | "Vendor"
  | "Shipping"
  | "Prescription Clarification"
  | "Capacity"
  | "Other";

export type ServiceType =
  | "Retail Pharmacy"
  | "Specialty Pharmacy"
  | "Central Fill"
  | "Mail Order"
  | "Transplant Pharmacy"
  | "Clinic Pharmacy"
  | "Medication Access Services";

export type WorkflowStage =
  | "Intake"
  | "Data Entry"
  | "Insurance Processing"
  | "Pharmacist Verification"
  | "Filling"
  | "Packing"
  | "Final Verification"
  | "Ready for Pickup"
  | "Shipped";

export type Region = "Northeast" | "Southeast" | "Midwest" | "West" | "Central";

export type PharmacyType = "Retail" | "Specialty" | "Central Fill" | "Mail Order" | "Hospital" | "Clinic";

export interface PharmacyLocation {
  id: string;
  name: string;
  region: Region;
  pharmacyType: PharmacyType;
  operatingStatus: "Active" | "Limited" | "Maintenance";
  staffingLevel: number; // percentage
  capacityUtilization: number; // percentage
  serviceTypes: ServiceType[];
}

export interface DailyMetric {
  date: string; // ISO date
  locationId: string;
  prescriptionVolume: number;
  averageTurnaroundMinutes: number;
  openExceptionCount: number;
  serviceLevelPct: number;
  delayedPrescriptions: number;
  resolvedExceptions: number;
  criticalExceptions: number;
}

export interface HourlyMetric {
  hour: number;
  locationId: string;
  date: string;
  prescriptionVolume: number;
}

export interface WorkflowStageMetric {
  locationId: string;
  stage: WorkflowStage;
  currentCount: number;
  averageProcessingMinutes: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface ExceptionRecord {
  id: string;
  createdAt: string;
  locationId: string;
  serviceType: ServiceType;
  issueCategory: IssueCategory;
  issueSubtype: string;
  priority: Priority;
  status: ExceptionStatus;
  assignedOwner: string;
  daysOpen: number;
  estimatedImpact: string;
  prescriptionsAffected: number;
  lastUpdatedAt: string;
  resolutionDueDate: string;
  description: string;
  resolutionSummary: string;
  immediateActionTaken: string;
  notes: string[];
  activityHistory: ActivityEntry[];
  // Conditional fields
  medicationName?: string;
  vendorName?: string;
  systemAffected?: string;
  carrier?: string;
  rejectionCategory?: string;
  shift?: string;
  scheduledStaff?: number;
  actualStaff?: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "Pharmacy Staff" | "Pharmacy Manager" | "Pharmacy Administrator";
  defaultLocation: string;
  notificationPreference: "Email" | "In-App" | "Both" | "None";
}

export interface FilterState {
  dateRange: { start: string; end: string };
  locationId: string | null;
  region: Region | null;
  serviceType: ServiceType | null;
  priority: Priority | null;
  issueCategory: IssueCategory | null;
}
