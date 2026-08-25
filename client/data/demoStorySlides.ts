import type { IconName } from "lucide-react/dynamic";

export interface StorySlide {
  id: number;
  title: string;
  subtitle: string;
  narrative: string;
  appSection: string;
  icon: IconName;
  accentColor: string;
  annotations: StoryAnnotation[];
}

export interface StoryAnnotation {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: IconName;
}

export const PATIENT_NAME = "Sarah Chen";
export const MEDICATION = "Tacrolimus 1mg (Prograf)";
export const CONDITION = "Post-kidney transplant, 3 months";

export const STORY_SLIDES: StorySlide[] = [
  {
    id: 1,
    title: "A Day in VUMC Pharmacy Operations",
    subtitle: "How the system catches and resolves a critical medication issue",
    narrative: `Meet ${PATIENT_NAME}, a 42-year-old post-kidney transplant patient at Vanderbilt. She takes ${MEDICATION} twice daily — an immunosuppressant critical to preventing organ rejection. Today, she requests a refill through her phone — and what follows demonstrates how our pharmacy intelligence platform orchestrates a complex issue across teams without any gaps in patient care.`,
    appSection: "Patient Context",
    icon: "heart-pulse",
    accentColor: "amber",
    annotations: [
      { label: "Patient", value: PATIENT_NAME, icon: "user" },
      { label: "Medication", value: "Tacrolimus 1mg BID", icon: "pill" },
      { label: "Condition", value: "Kidney Transplant (3mo post-op)", icon: "activity" },
      { label: "Priority", value: "Critical — Immunosuppressant", icon: "alert-triangle", highlight: true },
    ],
  },
  {
    id: 2,
    title: "Patient Requests Refill",
    subtitle: "Sarah initiates a refill through My Health at Vanderbilt",
    narrative: "At 8:32 AM, Sarah opens the My Health at Vanderbilt app on her phone and taps \"Request Refill\" for her Tacrolimus 1mg prescription. The request is received by the VUMC mail-order pharmacy team and enters the standard dispensing workflow. The system acknowledges her request with an in-app confirmation: \"Refill request received — we're working on it.\"",
    appSection: "Patient Portal (Mobile)",
    icon: "smartphone",
    accentColor: "violet",
    annotations: [
      { label: "Time", value: "8:32 AM", icon: "clock" },
      { label: "Channel", value: "MHAV Mobile App", icon: "smartphone" },
      { label: "Request", value: "Refill — Tacrolimus 1mg #60", highlight: true, icon: "pill" },
      { label: "Acknowledgement", value: "Instant in-app confirmation", icon: "check" },
    ],
  },
  {
    id: 3,
    title: "PA Exception in Dispensing System",
    subtitle: "Pharmacy attempts to fill but hits a Prior Authorization denial",
    narrative: "At 8:47 AM, when the pharmacy team processes Sarah's refill, the dispensing system returns a rejection: Prior Authorization Required — Step Therapy. The CoverMyMeds/RelayHealth switch detects the NCPDP rejection in real time and automatically generates exception EXC-2025-1847, categorizing it as Critical (immunosuppressant) and routing it to Marcus Johnson, PharmD. The exception is pre-populated with the payer's denial reason, patient medication history, and plan details. Staff always retain the ability to create exceptions manually as well — but in this case, the system caught it the moment the rejection cleared the switch.",
    appSection: "Exception Work Queue",
    icon: "clipboard-list",
    accentColor: "orange",
    annotations: [
      { label: "Exception ID", value: "EXC-2025-1847", icon: "hash" },
      { label: "Assigned To", value: "Marcus Johnson, PharmD", icon: "user-check" },
      { label: "Denial Reason", value: "PA Required — Step Therapy", highlight: true, icon: "file-warning" },
      { label: "Auto-Priority", value: "Critical (immunosuppressant)", highlight: true, icon: "alert-triangle" },
      { label: "Rx Affected", value: "Tacrolimus 1mg #60", icon: "pill" },
      { label: "Detection", value: "Auto-created via CMM/Relay", icon: "zap" },
      { label: "Note", value: "Manual creation also available", icon: "edit" },
    ],
  },
  {
    id: 4,
    title: "Patient Communication",
    subtitle: "Pharmacy notifies Sarah via MHAV that a PA is needed",
    narrative: "Marcus sends a secure message to Sarah through My Health at Vanderbilt: \"Hi Sarah — we received your refill request for Tacrolimus. Your insurance is requiring a Prior Authorization before we can fill it. We are contacting your provider's office now to get this resolved. No action needed from you — we'll keep you updated.\" Sarah sees this on her phone within minutes.",
    appSection: "My Health at Vanderbilt",
    icon: "message-circle",
    accentColor: "blue",
    annotations: [
      { label: "Channel", value: "MHAV Secure Message", icon: "lock" },
      { label: "Tone", value: "Proactive, reassuring", icon: "heart" },
      { label: "Key Message", value: "PA needed — we're handling it", highlight: true, icon: "message-circle" },
      { label: "Patient Action", value: "None required", icon: "check" },
    ],
  },
  {
    id: 5,
    title: "Provider Outreach",
    subtitle: "Epic In-Basket message sent to prescribing provider",
    narrative: "Simultaneously, Marcus sends an Epic In-Basket message to Dr. Anita Patel's transplant team: \"PA required for Tacrolimus 1mg refill for Sarah Chen (MRN: 847291). Insurance requesting step therapy documentation. Please provide letter of medical necessity or updated clinical notes. Patient is 3-months post-transplant — this is maintenance therapy, not a new start.\" The message is flagged as urgent in Dr. Patel's queue.",
    appSection: "Epic In-Basket",
    icon: "inbox",
    accentColor: "blue",
    annotations: [
      { label: "In-Basket To", value: "Dr. Anita Patel (Transplant)", icon: "inbox" },
      { label: "Priority", value: "Urgent", highlight: true, icon: "zap" },
      { label: "Request", value: "Letter of medical necessity", icon: "file-text" },
      { label: "Clinical Context", value: "Maintenance therapy, not new start", icon: "clipboard" },
    ],
  },
  {
    id: 6,
    title: "PA Approved — Patient Notified",
    subtitle: "Pharmacy confirms approval and verifies shipping address via MHAV",
    narrative: "At 12:32 PM, the payer approves the Prior Authorization. The exception auto-updates to \"Resolved.\" Marcus sends a follow-up MHAV message to Sarah: \"Great news — your Prior Authorization has been approved and your Tacrolimus refill is ready to ship! Please confirm your shipping address is still 1842 Belmont Blvd, Nashville, TN 37212.\" Sarah confirms with a single tap.",
    appSection: "Patient Portal + Exception Queue",
    icon: "check-circle",
    accentColor: "green",
    annotations: [
      { label: "PA Outcome", value: "Approved ✓", highlight: true, icon: "badge-check" },
      { label: "Resolution Time", value: "3h 45m", icon: "timer" },
      { label: "Patient Message", value: "Approved — confirm address", icon: "message-circle" },
      { label: "Patient Response", value: "Address confirmed (1 tap)", icon: "map-pin" },
    ],
  },
  {
    id: 7,
    title: "Shipped & Closed",
    subtitle: "Medication mailed, exception closed, zero therapy gap",
    narrative: "The prescription is filled and shipped via UPS Ground to Sarah's confirmed address. She receives a final MHAV notification with tracking info. From refill request to shipped: 5 hours 12 minutes. Three teams coordinated. Sarah never made a phone call, never visited a pharmacy, and never missed a dose. This is pharmacy intelligence — proactive, coordinated, mail-order enabled, and fully patient-centered.",
    appSection: "Impact Summary",
    icon: "trophy",
    accentColor: "amber",
    annotations: [
      { label: "Total Time", value: "5h 12m (request → shipped)", icon: "clock" },
      { label: "Shipping", value: "UPS Ground to confirmed address", icon: "truck" },
      { label: "Teams Involved", value: "3 (Pharmacy, Insurance, Transplant)", icon: "users" },
      { label: "Patient Experience", value: "Zero calls, zero trips", highlight: true, icon: "heart-pulse" },
      { label: "MHAV Messages", value: "3 (status, approval, tracking)", icon: "smartphone" },
      { label: "Therapy Gap", value: "None — continuity preserved", icon: "shield-check" },
    ],
  },
];
