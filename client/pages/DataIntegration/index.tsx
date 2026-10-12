import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IconName } from "lucide-react/dynamic";
import { useNavigate } from "react-router";
import PythonCodeViewer from "@/components/shared/PythonCodeViewer";

const EPIC_FHIR_SAMPLE = `GET /api/FHIR/R4/MedicationRequest?patient={patientId}&status=active
Authorization: Bearer {access_token}
Accept: application/fhir+json

// Response (abbreviated)
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 3,
  "entry": [
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "eRx-2024-88421",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                       "code": "311989",
                       "display": "Tacrolimus 1 MG Oral Capsule" }]
        },
        "dosageInstruction": [{ "text": "1 cap PO BID" }]
      }
    }
  ]
}`;

const FHIR_ENDPOINTS: { resource: string; description: string; icon: IconName }[] = [
  { resource: "MedicationRequest", description: "Active prescriptions, orders, and e-prescribing events", icon: "pill" },
  { resource: "MedicationDispense", description: "Dispensing records, fill status, and pharmacy events", icon: "package-check" },
  { resource: "Patient", description: "Demographics (de-identified for analytics), identifiers", icon: "user" },
  { resource: "Task", description: "Exception routing, workflow tasks, clinical reminders", icon: "list-todo" },
  { resource: "Communication", description: "In-Basket messaging, provider notifications", icon: "message-circle" },
  { resource: "Subscription", description: "Real-time push notifications for pharmacy events", icon: "bell-ring" },
];

const SNOWFLAKE_READ = `SELECT
    pharmacy_location,
    service_date,
    prescription_volume,
    average_turnaround_minutes,
    open_exception_count,
    service_level_pct
FROM ANALYTICS.PHARMACY.OPERATIONAL_DAILY_METRICS
WHERE service_date BETWEEN :start_date AND :end_date;`;

const SNOWFLAKE_WRITE = `INSERT INTO OPERATIONS.PHARMACY.OPERATIONAL_EXCEPTIONS
(
    exception_id,
    pharmacy_location,
    issue_category,
    priority,
    status,
    description,
    assigned_owner,
    created_at
)
VALUES
(
    :exception_id,
    :pharmacy_location,
    :issue_category,
    :priority,
    :status,
    :description,
    :assigned_owner,
    CURRENT_TIMESTAMP
);`;

const DATABRICKS_READ = `SELECT
    pharmacy_location,
    service_date,
    prescription_volume,
    average_turnaround_minutes,
    open_exception_count,
    service_level_pct
FROM pharmacy_analytics.operations.operational_daily_metrics
WHERE service_date BETWEEN :start_date AND :end_date;`;

const SOURCES = [
  { name: "Epic Clarity", desc: "Clinical dispensing, patient encounters, medication records" },
  { name: "Pharmacy Dispensing Systems", desc: "McKesson EnterpriseRx (Hub REST API), Epic Willow Ambulatory / WAM (FHIR R4)" },
  { name: "Claims Switch / ePA", desc: "CoverMyMeds / RelayHealth — real-time adjudication responses, PA status sync (NCPDP Telecom)" },
  { name: "Inventory Management", desc: "Cardinal Health, McKesson — on-hand, order status" },
  { name: "Specialty Pharmacy Platforms", desc: "Patient enrollment, PA status, clinical milestones" },
  { name: "Central Fill Systems", desc: "Automation throughput, batch status, error rates" },
  { name: "Shipping & Logistics", desc: "FedEx, UPS, USPS — package tracking, cold chain" },
  { name: "Workforce Management", desc: "Kronos, UKG — scheduling, overtime, absences" },
  { name: "Vendor & Wholesaler Feeds", desc: "AmerisourceBergen, McKesson — pricing, availability" },
];

export default function DataIntegration() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground">Data Integration Architecture</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Future-state architecture showing how production data sources would connect to the Vanderbilt Health Bridge platform
        </p>
      </div>

      {/* Architecture flow */}
      <div className="px-6 pb-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {[
                { label: "Enterprise Systems", icon: "building-2" as const, desc: "Epic, Dispensing, Inventory" },
                { label: "arrow", icon: "arrow-right" as const, desc: "" },
                { label: "Data Platform", icon: "database" as const, desc: "Snowflake / Databricks" },
                { label: "arrow", icon: "arrow-right" as const, desc: "" },
                { label: "Governed APIs", icon: "server" as const, desc: "Superblocks SDK" },
                { label: "arrow", icon: "arrow-right" as const, desc: "" },
                { label: "Health Bridge Platform", icon: "layout-dashboard" as const, desc: "This Application" },
              ].map((item, i) =>
                item.label === "arrow" ? (
                  <Icon key={i} icon={item.icon} className="w-6 h-6 text-muted-foreground shrink-0" />
                ) : (
                  <div key={i} className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg border bg-muted/30 min-w-[140px]">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon icon={item.icon} className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-center">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center">{item.desc}</span>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise sources */}
      <div className="px-6 pb-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Potential Enterprise Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {SOURCES.map((s) => (
                <div key={s.name} className="flex items-start gap-2.5 p-3 rounded-lg border bg-background">
                  <Icon icon="plug" className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Epic FHIR / My Health at Vanderbilt */}
      <div className="px-6 pb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center">
                <Icon icon="pill" className="w-3.5 h-3.5 text-orange-700" />
              </div>
              Dispensing System Integration Paths
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Three integration options for feeding prescription fill data, PA exceptions, and workflow events into the platform.
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* McKesson EnterpriseRx */}
              <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Icon icon="box" className="w-3.5 h-3.5 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-orange-900">McKesson EnterpriseRx</p>
                    <p className="text-[9px] text-orange-600">Pharmacy Management System</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">REST</span>
                    <span className="text-[9px] text-muted-foreground">McKesson Hub API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-300 text-green-700 bg-green-50">🔒 TLS 1.3</Badge>
                    <span className="text-[9px] text-muted-foreground">~100–300ms latency</span>
                  </div>
                </div>
                <div className="text-[9px] text-orange-800 leading-relaxed">
                  Fill status, PA denials, claim rejections, inventory data, and workflow events via McKesson's middleware API layer.
                </div>
                <div className="mt-2 p-2 rounded bg-amber-100/60 border border-amber-300">
                  <p className="text-[9px] text-amber-900 font-medium flex items-center gap-1">
                    <Icon icon="info" className="w-3 h-3" /> Integration Status
                  </p>
                  <p className="text-[9px] text-amber-800 mt-0.5">
                    This path is not currently established — would require partnership with McKesson to enable API access.
                  </p>
                </div>
              </div>

              {/* Epic Willow Ambulatory */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon icon="heart-pulse" className="w-3.5 h-3.5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-900">Epic Willow Ambulatory (WAM)</p>
                    <p className="text-[9px] text-blue-600">Ambulatory Pharmacy Module</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">FHIR R4</span>
                    <span className="text-[9px] text-muted-foreground">MedicationDispense / Task</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-300 text-green-700 bg-green-50">🔒 TLS 1.3 + OAuth 2.0</Badge>
                    <span className="text-[9px] text-muted-foreground">~100–200ms latency</span>
                  </div>
                </div>
                <div className="text-[9px] text-blue-800 leading-relaxed">
                  Prescription orders, dispense events, refill requests, and pharmacy task management via Epic's standard FHIR R4 APIs.
                </div>
                <div className="mt-2 p-2 rounded bg-green-100/60 border border-green-300">
                  <p className="text-[9px] text-green-900 font-medium flex items-center gap-1">
                    <Icon icon="check-circle" className="w-3 h-3" /> Standard Approach
                  </p>
                  <p className="text-[9px] text-green-800 mt-0.5">
                    This is a standard, well-documented integration approach used by health systems with Epic deployments.
                  </p>
                </div>
              </div>

              {/* CoverMyMeds / RelayHealth Switch */}
              <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <Icon icon="radio-tower" className="w-3.5 h-3.5 text-violet-700" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-violet-900">CoverMyMeds / RelayHealth</p>
                    <p className="text-[9px] text-violet-600">Pharmacy Claims Switch</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">NCPDP</span>
                    <span className="text-[9px] text-muted-foreground">Pharmacy API (Telecom Std)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-300 text-green-700 bg-green-50">🔒 TLS 1.3</Badge>
                    <span className="text-[9px] text-muted-foreground">~2–5s (real-time adjudication)</span>
                  </div>
                </div>
                <div className="text-[9px] text-violet-800 leading-relaxed">
                  Switch-level integration — captures all inbound/outbound adjudication responses regardless of dispensing system (WAM or ERx), enabling PA rejection detection without relying on either system to expose an API.
                </div>
                <div className="mt-2 p-2 rounded bg-violet-100/60 border border-violet-300">
                  <p className="text-[9px] text-violet-900 font-medium flex items-center gap-1">
                    <Icon icon="zap" className="w-3 h-3" /> Alternative Approach
                  </p>
                  <p className="text-[9px] text-violet-800 mt-0.5">
                    Dispensing-system-agnostic — all NCPDP transactions already route through this switch. Does not replace WAM or ERx paths but offers a single interception point.
                  </p>
                </div>
              </div>
            </div>

            {/* Convergence note */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Icon icon="git-merge" className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-slate-800">Unified Exception Queue</p>
                <p className="text-[9px] text-slate-600">
                  All three paths converge into the Superblocks orchestration layer, feeding a single exception work queue regardless of data source. The CoverMyMeds/RelayHealth path is particularly compelling as it captures rejections at the network level before either dispensing system would surface them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Epic FHIR / My Health at Vanderbilt */}
      <div className="px-6 pb-4">
        <Card className="border-green-300 bg-green-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center">
                  <Icon icon="heart-pulse" className="w-4 h-4 text-green-700" />
                </div>
                Epic FHIR R4 — My Health at Vanderbilt
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Connected
                </span>
                <Badge className="bg-green-600 text-white text-[10px]">Active</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time bidirectional integration with Epic via FHIR R4 APIs. Supports medication ordering, dispensing events, patient communication, and workflow task management.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Details */}
            <div className="text-xs bg-white/80 rounded-md p-3 border space-y-2">
              <p className="font-semibold text-foreground text-xs mb-2">Connection Configuration</p>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium text-foreground">FHIR Base URL:</span> <code className="text-[10px] bg-muted px-1 rounded">https://epic-fhir.vumc.org/api/FHIR/R4</code></div>
                <div><span className="font-medium text-foreground">Auth:</span> OAuth 2.0 Client Credentials</div>
                <div><span className="font-medium text-foreground">Tenant:</span> VUMC Production</div>
                <div><span className="font-medium text-foreground">Client ID:</span> <code className="text-[10px] bg-muted px-1 rounded">vumc-pharmacy-ops-****</code></div>
                <div><span className="font-medium text-foreground">Epic Version:</span> November 2024 (R4)</div>
                <div><span className="font-medium text-foreground">Scopes:</span> system/*.read, system/Task.write</div>
              </div>
            </div>

            {/* FHIR Endpoints */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Available FHIR Resources</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {FHIR_ENDPOINTS.map((ep) => (
                  <div key={ep.resource} className="flex items-center gap-2 px-3 py-2 rounded border bg-white/80">
                    <Icon icon={ep.icon} className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-foreground">{ep.resource}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight">{ep.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample API Call */}
            <div>
              <p className="text-xs font-semibold mb-1">Sample FHIR API Call — Active Medications</p>
              <pre className="text-[10px] bg-slate-900 text-green-300 p-3 rounded-md overflow-x-auto whitespace-pre max-h-[240px] overflow-y-auto">{EPIC_FHIR_SAMPLE}</pre>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded bg-green-100/60 border border-green-200">
              <Icon icon="info" className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
              <p className="text-[10px] text-green-800">
                <strong>HIPAA Compliant:</strong> All FHIR requests are authenticated via OAuth 2.0 with SMART on FHIR scopes.
                Patient data is accessed only within the scope of pharmacy operations and logged to the immutable audit trail.
                PHI never leaves the VUMC network boundary per the hybrid deployment model.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection cards */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Snowflake */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="snowflake" className="w-4 h-4 text-blue-500" />
                Snowflake
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">Demo Only</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium text-foreground">Account:</span> xy12345.us-east-1</div>
                <div><span className="font-medium text-foreground">Warehouse:</span> PHARMACY_WH</div>
                <div><span className="font-medium text-foreground">Database:</span> ANALYTICS</div>
                <div><span className="font-medium text-foreground">Schema:</span> PHARMACY</div>
                <div><span className="font-medium text-foreground">Role:</span> PHARMACY_READER</div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-1">Sample Read Query:</p>
              <pre className="text-[11px] bg-slate-900 text-green-300 p-3 rounded-md overflow-x-auto whitespace-pre">{SNOWFLAKE_READ}</pre>
            </div>

            <div>
              <p className="text-xs font-medium mb-1">Sample Write-Back Pattern:</p>
              <pre className="text-[11px] bg-slate-900 text-green-300 p-3 rounded-md overflow-x-auto whitespace-pre">{SNOWFLAKE_WRITE}</pre>
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              * All SQL statements above are examples only. Actual table names, schemas, and
              credentials would be configured during production implementation.
            </p>
          </CardContent>
        </Card>

        {/* Databricks */}
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="zap" className="w-4 h-4 text-orange-500" />
                Databricks
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">Demo Only</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 border space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="font-medium text-foreground">SQL Warehouse:</span> pharmacy_wh</div>
                <div><span className="font-medium text-foreground">Catalog:</span> pharmacy_analytics</div>
                <div><span className="font-medium text-foreground">Schema:</span> operations</div>
                <div><span className="font-medium text-foreground">Auth:</span> Service Principal</div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-1">Sample Unity Catalog Query:</p>
              <pre className="text-[11px] bg-slate-900 text-green-300 p-3 rounded-md overflow-x-auto whitespace-pre">{DATABRICKS_READ}</pre>
            </div>

            <Separator className="my-2" />

            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong className="text-foreground">Write-Back Architecture:</strong> Production write-back data (new exceptions,
                status updates, notes) would be stored in a governed operational table
                (e.g., <code className="bg-muted px-1 rounded">operations.pharmacy_exceptions</code>)
                while analytical and metric data remains sourced from enterprise reporting tables.
              </p>
              <p>
                This separation ensures that transactional and analytical workloads do not compete
                for the same resources and that write operations go through proper data governance.
              </p>
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              * All configurations and queries above are examples only.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Source Query Editor Link */}
      <div className="px-6 pb-4">
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 dark:from-violet-950/20 dark:to-indigo-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <Icon iconName="database" className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Source Query Editor
                    <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-600">Interactive</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                    View the underlying Snowflake &amp; Databricks SQL queries that power each KPI and data point. 
                    Edit queries in a live code editor, test changes, and manage version history with instant rollback.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon iconName="table-2" className="h-3 w-3" /> Entity Relationship Diagram
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon iconName="code-2" className="h-3 w-3" /> 6 Active Queries
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon iconName="history" className="h-3 w-3" /> Version Control
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => navigate("/app/integration/queries")}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Icon iconName="code-2" className="h-4 w-4 mr-2" />
                Open Query Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Python Data Export */}
      <div className="px-6 pb-6">
        <PythonCodeViewer />
      </div>
    </div>
  );
}
