import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// --- Architecture Data ---

interface ArchHop {
  from: string;
  to: string;
  latency: string;
  encryption: string;
  protocol: string;
}

const ARCHITECTURE_HOPS: ArchHop[] = [
  {
    from: "Patient Mobile Device",
    to: "VUMC Network Edge",
    latency: "~40–80ms",
    encryption: "TLS 1.3",
    protocol: "HTTPS / Certificate Pinning",
  },
  {
    from: "VUMC Network Edge",
    to: "Superblocks App Server",
    latency: "~15–25ms",
    encryption: "mTLS (mutual TLS)",
    protocol: "Internal VPC / Private Link",
  },
  {
    from: "Superblocks App Server",
    to: "Epic FHIR R4 Gateway",
    latency: "~100–200ms",
    encryption: "TLS 1.3 + OAuth 2.0",
    protocol: "SMART on FHIR / REST",
  },
  {
    from: "Epic FHIR R4 Gateway",
    to: "Epic Clarity / Caboodle",
    latency: "~50–150ms",
    encryption: "AES-256 (at rest)",
    protocol: "Internal Epic Bus",
  },
];

const TOTAL_LATENCY = "~250–500ms round trip (typical patient query)";

interface FaqItem {
  question: string;
  answer: string;
  category: "feasibility" | "security" | "timeline" | "challenge";
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "feasibility",
    question: "How feasible is it to build this for production?",
    answer: "Highly feasible. The architecture demonstrated here mirrors production patterns already deployed at other health systems using Superblocks + Epic FHIR. The core data layer (FHIR R4 medication, messaging, and task APIs) is well-documented and stable. The primary effort is organizational — obtaining Epic API credentials, completing InfoSec review, and meeting VUMC's change management requirements. The technical implementation itself (UI, API orchestration, auth flows) could be production-ready in 6–8 weeks with a 2-person team.",
  },
  {
    category: "feasibility",
    question: "What's simulated vs. what's production-ready today?",
    answer: "Production-ready today: the entire frontend UI, component architecture, state management, real-time feed patterns, and the Superblocks API SDK layer. Simulated: the Epic FHIR data responses (we use synthetic data), OAuth token flows (we bypass auth), and the actual patient portal write-back. Moving to production requires swapping synthetic data for live FHIR calls — the UI stays the same.",
  },
  {
    category: "security",
    question: "Is patient data encrypted end-to-end?",
    answer: "Yes. In the proposed production architecture: TLS 1.3 secures all data in transit (mobile device ↔ VUMC network ↔ Superblocks ↔ Epic). Mutual TLS (mTLS) authenticates service-to-service calls. Data at rest is encrypted with AES-256 in both Snowflake/Databricks and Epic's storage layer. PHI never traverses the public internet — all FHIR calls stay within the VUMC private network boundary via VPC peering or Private Link.",
  },
  {
    category: "security",
    question: "How are OAuth tokens managed and what's the session lifecycle?",
    answer: "SMART on FHIR uses OAuth 2.0 with short-lived access tokens (typically 5-minute TTL) and refresh tokens (24-hour TTL). Tokens are stored in encrypted server-side session storage — never in the browser or local storage. The Superblocks backend handles token refresh transparently. If a refresh token expires, the user is prompted to re-authenticate via the VUMC SSO (Okta) flow. All token events are logged to the audit trail.",
  },
  {
    category: "timeline",
    question: "What does the Epic API access approval process look like?",
    answer: "Epic API access requires: (1) Registration in Epic's App Orchard or direct customer-hosted setup (~2–4 weeks), (2) VUMC IT Security review and approval (~3–6 weeks depending on scope), (3) Epic sandbox provisioning for development (~1–2 weeks), (4) Production credential issuance after successful sandbox testing (~2–3 weeks). Total: expect 8–15 weeks for full production API access. This can run in parallel with frontend development.",
  },
  {
    category: "timeline",
    question: "What's a realistic go-live timeline?",
    answer: "Assuming a dedicated 2–3 person team and parallel workstreams: Weeks 1–4: Epic API access application + InfoSec documentation. Weeks 2–8: Build production API layer against Epic sandbox. Weeks 6–10: Integration testing, UAT with pharmacy staff. Weeks 10–12: Staged rollout (single location → full network). Total: approximately 12–16 weeks from kickoff to full production, with a pilot possible by week 8.",
  },
  {
    category: "challenge",
    question: "What are the known technical challenges?",
    answer: "Key challenges: (1) Epic FHIR rate limits — production APIs are limited to ~100 requests/second per client; batch queries and caching are essential. (2) Data freshness — Epic Clarity data may lag real-time by 15–60 minutes depending on the extract schedule; FHIR APIs provide real-time data but with rate constraints. (3) Patient consent management — MyChart portal access requires patient opt-in; not all patients will have active accounts. (4) Epic version variance — FHIR resource availability depends on the specific Epic version deployed at VUMC.",
  },
  {
    category: "challenge",
    question: "What VUMC InfoSec requirements apply?",
    answer: "Anticipated requirements: (1) Security Risk Assessment (SRA) per VUMC InfoSec standards. (2) Business Associate Agreement (BAA) with Superblocks for PHI handling. (3) Penetration testing of the application before production deployment. (4) Data classification review — all PHI fields must be inventoried. (5) Access control matrix showing RBAC enforcement. (6) Annual review and recertification. The Security & Compliance page of this app demonstrates how these controls are documented.",
  },
  {
    category: "challenge",
    question: "How are Epic sandbox vs. production environments handled?",
    answer: "Epic provides separate sandbox and production FHIR endpoints. Development uses the sandbox (synthetic patients, no PHI). The Superblocks SDK supports environment-specific configuration — integration credentials are swapped via data tags (Dev/Staging/Prod) without code changes. This means the same UI and API logic runs identically against sandbox or production data, reducing testing gaps.",
  },
  {
    category: "feasibility",
    question: "What team resources are needed for implementation?",
    answer: "Recommended team: (1) 1 Application designer/developer working collaboratively with the Superblocks AI assistant (Clark) — no dedicated React engineer required. This role handles requirements, data modeling, API design, and UI validation while Clark implements the code. (2) 1 Integration engineer — Epic FHIR configuration, auth flows, data mapping. (3) Part-time: InfoSec analyst (compliance docs), pharmacy SME (workflow validation), project manager. Superblocks Professional Services can supplement integration engineering if internal Epic expertise is limited. Note: This demo was built entirely using the AI-assisted model described above.",
  },
  {
    category: "feasibility",
    question: "How would we build this for production using this platform?",
    answer: "You'd work directly in Superblocks with the AI assistant (Clark) to go from demo to production: (1) Open the Integrations panel and configure a REST API integration with OAuth 2.0 — provide the Epic FHIR base URL and client credentials. (2) Clark builds real SDK APIs that call the FHIR endpoints (replacing synthetic data). (3) Test against Epic's sandbox environment using the Dev data tag. (4) Once validated, create a Prod data tag pointing at production credentials — same code, real data. (5) Deploy. The UI you see today stays exactly as-is; only the data source is swapped. No code rewrite, no separate backend project. The entire process can be done collaboratively in this same editor.",
  },
  {
    category: "feasibility",
    question: "What FHIR API queries are needed to power each section?",
    answer: "Each feature maps to specific Epic FHIR R4 endpoints: • Medications List → GET /MedicationRequest?patient={id}&status=active • Refill Requests → GET /Task?code=refill-request&status=requested • Rx Status Tracker → GET /MedicationDispense?patient={id}&status=in-progress (plus Task for workflow stage) • Messages / In-Basket → GET /Communication?recipient={id}&status=in-progress • Appointments → GET /Appointment?patient={id}&date=ge{today} • Test Results → GET /Observation?patient={id}&category=laboratory&_sort=-date • Patient Header → GET /Patient/{id} (demographics, allergies) • Real-Time Feed → Subscription resource or Epic Event Notifications (webhook). All use standard FHIR R4 search parameters and return JSON bundles. No custom Epic APIs required — these are all documented in Epic's FHIR R4 API reference.",
  },
  {
    category: "feasibility",
    question: "Which dispensing systems can this connect to?",
    answer: "Two primary paths: (1) McKesson EnterpriseRx — via the McKesson Hub REST API, which provides access to fill status, PA denials, claim rejections, and workflow events. Note: this integration path is not currently established and would require partnership with McKesson to enable API access. (2) Epic Willow Ambulatory (WAM) — via standard FHIR R4 MedicationDispense, MedicationRequest, and Task endpoints. This is a well-documented, proven approach already used by health systems running Epic. Both paths can feed data into the same unified exception work queue within the platform.",
  },
  {
    category: "feasibility",
    question: "Can both dispensing systems feed the same exception queue?",
    answer: "Yes. The Superblocks orchestration layer acts as a normalizer — regardless of whether exception data originates from EnterpriseRx (via REST), Willow Ambulatory (via FHIR), or CoverMyMeds (via NCPDP), it is mapped into the same exception schema and routed to the same work queue. This means a health system running multiple systems could have pharmacy staff working from a single, unified queue without switching between systems. Priority scoring, assignment rules, and SLA tracking all apply identically regardless of source.",
  },
  {
    category: "feasibility",
    question: "Could we intercept PA rejections at the switch level instead?",
    answer: "Yes. Since all NCPDP claim transactions — whether originating from EnterpriseRx or Willow Ambulatory — route through the CoverMyMeds/RelayHealth switch, tapping into that layer provides a single, dispensing-system-agnostic source of real-time rejection data. The switch sees every claim submission and every PBM adjudication response (including PA-required rejection codes like NCPDP 75). CoverMyMeds exposes a Pharmacy API built on the NCPDP Telecom standard that allows you to synchronize PA status and receive rejection notifications. This approach doesn't replace direct WAM or ERx integration but offers an elegant alternative that works regardless of which dispensing system is in use.",
  },
  {
    category: "feasibility",
    question: "Can PA exceptions be auto-created in real time?",
    answer: "Yes — with any of the three integration paths. PA rejections are inherently real-time events: when a claim is submitted to the PBM, the rejection response (with reason codes) comes back in 2–5 seconds. The question is capturing that event programmatically: (1) EnterpriseRx exposes a Claim Rejection webhook and PA_Required flag. (2) Epic WAM can surface rejections via FHIR Task resources or Epic Event Notifications. (3) CoverMyMeds/RelayHealth sees the rejection at the switch level the moment it's returned. With any of these paths established, the system could auto-generate exceptions the instant a PA rejection is returned — no manual staff entry required. Staff would then be assigned to work the exception rather than create it.",
  },
  {
    category: "feasibility" as const,
    question: "How are duplicate exceptions prevented?",
    answer: "Each exception is identified by a composite key: Rx# + NDC + Patient ID + Plan BIN/PCN + Reject Code. When the system receives a rejection, it checks for an existing open exception with the same composite key. If found, it updates the lastSeenAt timestamp and increments attemptCount — no duplicate is created. For paid claims: when a paid adjudication response arrives for the same Rx#/NDC, the system checks BIN/PCN. If the same plan that was rejected now pays, the exception auto-closes as 'Resolved — Paid Claim.' If a different plan pays (alternate plan scenario), it closes as 'Resolved — Alternate Plan.' Once an exception is closed, it will not be reopened by subsequent rejections for the same script.",
  },
];

const CATEGORY_COLORS: Record<FaqItem["category"], string> = {
  feasibility: "bg-green-50 text-green-700 border-green-200",
  security: "bg-blue-50 text-blue-700 border-blue-200",
  timeline: "bg-amber-50 text-amber-700 border-amber-200",
  challenge: "bg-red-50 text-red-700 border-red-200",
};

const CATEGORY_LABELS: Record<FaqItem["category"], string> = {
  feasibility: "Feasibility",
  security: "Security",
  timeline: "Timeline",
  challenge: "Challenge",
};

// --- Component ---

export default function TechnicalArchitecture() {
  const [expandedDiagram, setExpandedDiagram] = useState(true);

  return (
    <div className="space-y-4">
      {/* Architecture Diagram */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
                <Icon icon="git-branch" className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              Data Flow Architecture & Latency
            </CardTitle>
            <button
              onClick={() => setExpandedDiagram(!expandedDiagram)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icon icon={expandedDiagram ? "chevron-up" : "chevron-down"} className="w-3 h-3" />
              {expandedDiagram ? "Collapse" : "Expand"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Production-state architecture showing the data path from patient device to Epic backend with latency estimates at each hop.
          </p>
        </CardHeader>
        {expandedDiagram && (
          <CardContent className="pt-2">
            {/* Visual flow */}
            <div className="space-y-0">
              {ARCHITECTURE_HOPS.map((hop, idx) => (
                <div key={idx}>
                  {/* Node */}
                  {idx === 0 && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-teal-50 border border-teal-200">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Icon icon="smartphone" className="w-4 h-4 text-teal-700" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-teal-900">{hop.from}</p>
                        <p className="text-[9px] text-teal-600">iOS / Android — MyChart or Browser</p>
                      </div>
                    </div>
                  )}

                  {/* Connection line with latency */}
                  <div className="flex items-center ml-6 py-1.5">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-teal-300 to-indigo-300 rounded" />
                    <div className="ml-3 flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {hop.latency}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{hop.protocol}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-300 text-green-700 bg-green-50">
                        🔒 {hop.encryption}
                      </Badge>
                    </div>
                  </div>

                  {/* Destination node */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon
                        icon={
                          hop.to.includes("Network") ? "shield" :
                          hop.to.includes("Superblocks") ? "server" :
                          hop.to.includes("FHIR") ? "heart-pulse" :
                          "database"
                        }
                        className="w-4 h-4 text-slate-700"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-900">{hop.to}</p>
                      <p className="text-[9px] text-slate-500">
                        {hop.to.includes("Network") && "F5 Load Balancer + WAF, DDoS protection"}
                        {hop.to.includes("Superblocks") && "API orchestration, caching, RBAC enforcement"}
                        {hop.to.includes("FHIR") && "SMART on FHIR authorization, resource routing"}
                        {hop.to.includes("Clarity") && "Source of truth — clinical data warehouse"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total latency summary */}
            <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-3">
              <Icon icon="gauge" className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-indigo-900">Total End-to-End Latency</p>
                <p className="text-[10px] text-indigo-700">{TOTAL_LATENCY}</p>
                <p className="text-[9px] text-indigo-500 mt-0.5">
                  Includes DNS, TLS handshake, FHIR query, response serialization. Cached responses: ~50–100ms.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Security & Encryption */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
              <Icon icon="lock" className="w-3.5 h-3.5 text-green-700" />
            </div>
            Security & Encryption Posture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-50/50 border border-green-200 space-y-1.5">
              <p className="text-[10px] font-bold text-green-900 flex items-center gap-1.5">
                <Icon icon="shield-check" className="w-3 h-3" /> In Transit
              </p>
              <ul className="text-[9px] text-green-800 space-y-0.5 pl-4 list-disc">
                <li>TLS 1.3 on all external connections</li>
                <li>mTLS between internal services</li>
                <li>Certificate pinning on mobile app</li>
                <li>Perfect Forward Secrecy (PFS) enabled</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200 space-y-1.5">
              <p className="text-[10px] font-bold text-blue-900 flex items-center gap-1.5">
                <Icon icon="hard-drive" className="w-3 h-3" /> At Rest
              </p>
              <ul className="text-[9px] text-blue-800 space-y-0.5 pl-4 list-disc">
                <li>AES-256 encryption (all PHI stores)</li>
                <li>Envelope encryption with KMS key rotation</li>
                <li>Encrypted backups with geo-redundancy</li>
                <li>Column-level encryption for SSN/MRN fields</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-1.5">
              <p className="text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                <Icon icon="key-round" className="w-3 h-3" /> Token Lifecycle
              </p>
              <ul className="text-[9px] text-amber-800 space-y-0.5 pl-4 list-disc">
                <li>Access token TTL: 5 minutes</li>
                <li>Refresh token TTL: 24 hours</li>
                <li>Server-side session storage only</li>
                <li>Automatic refresh — transparent to user</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200 space-y-1.5">
              <p className="text-[10px] font-bold text-purple-900 flex items-center gap-1.5">
                <Icon icon="map-pin" className="w-3 h-3" /> Data Residency
              </p>
              <ul className="text-[9px] text-purple-800 space-y-0.5 pl-4 list-disc">
                <li>PHI never leaves VUMC network boundary</li>
                <li>VPC peering / AWS PrivateLink</li>
                <li>No PHI in logs, traces, or analytics</li>
                <li>HIPAA audit log retained 7 years</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Accordion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
              <Icon icon="message-circle-question" className="w-3.5 h-3.5 text-amber-700" />
            </div>
            Implementation Readiness FAQ
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Common questions from leadership, InfoSec, and engineering teams about taking this demo to production.
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-border last:border-0">
                <AccordionTrigger className="py-3 text-left hover:no-underline">
                  <div className="flex items-center gap-2 pr-2">
                    <Badge variant="outline" className={`text-[8px] h-4 px-1.5 shrink-0 ${CATEGORY_COLORS[item.category]}`}>
                      {CATEGORY_LABELS[item.category]}
                    </Badge>
                    <span className="text-[11px] font-medium text-foreground">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
