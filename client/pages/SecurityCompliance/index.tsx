import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExceptions } from "@/data/exceptions";
import type { IconName } from "lucide-react/dynamic";

/* ===== Compliance Certifications ===== */
const CERTIFICATIONS = [
  { name: "SOC 2 Type II", status: "certified" as const, date: "2025-03-15", renewal: "2026-03-15", icon: "shield-check" as IconName, description: "Independent audit of security, availability, and confidentiality controls over 6-month observation period" },
  { name: "HIPAA", status: "certified" as const, date: "2025-01-20", renewal: "2026-01-20", icon: "heart-pulse" as IconName, description: "Full compliance with PHI handling requirements; BAA executed with all customers" },
  { name: "HITRUST CSF", status: "certified" as const, date: "2024-11-01", renewal: "2026-11-01", icon: "badge-check" as IconName, description: "HITRUST r2 certified — validated assessment covering 19 domains, 156 controls" },
  { name: "PCI DSS 4.0", status: "ready" as const, date: "2025-06-01", renewal: "—", icon: "credit-card" as IconName, description: "Architecture supports PCI-compliant deployments; SAQ-D eligible" },
  { name: "ISO 27001", status: "certified" as const, date: "2024-09-10", renewal: "2027-09-10", icon: "globe" as IconName, description: "Hosted on ISO 27001:2022 certified infrastructure (AWS GovCloud available)" },
  { name: "GDPR", status: "certified" as const, date: "2025-02-28", renewal: "—", icon: "flag" as IconName, description: "EU data residency, DPA, and privacy-by-design controls; Article 28 compliant" },
];

/* ===== RBAC Matrix ===== */
const ROLES = ["Pharmacy Admin", "Pharmacist", "Analyst", "Read-Only Viewer"];
const PERMISSIONS = [
  { label: "View Dashboards", key: "view_dash" },
  { label: "View Exceptions", key: "view_exc" },
  { label: "Edit Exceptions", key: "edit_exc" },
  { label: "Create Issues", key: "create_iss" },
  { label: "Manage Users", key: "manage_usr" },
  { label: "Export Data", key: "export" },
  { label: "Admin Settings", key: "admin" },
  { label: "Audit Log Access", key: "audit" },
  { label: "Integration Config", key: "integ" },
  { label: "Delete Records", key: "delete" },
];

const RBAC_MATRIX: Record<string, Record<string, "full" | "limited" | "none">> = {
  "Pharmacy Admin": { view_dash: "full", view_exc: "full", edit_exc: "full", create_iss: "full", manage_usr: "full", export: "full", admin: "full", audit: "full", integ: "full", delete: "full" },
  "Pharmacist": { view_dash: "full", view_exc: "full", edit_exc: "full", create_iss: "full", manage_usr: "none", export: "limited", admin: "none", audit: "limited", integ: "none", delete: "none" },
  "Analyst": { view_dash: "full", view_exc: "full", edit_exc: "limited", create_iss: "limited", manage_usr: "none", export: "full", admin: "none", audit: "full", integ: "none", delete: "none" },
  "Read-Only Viewer": { view_dash: "full", view_exc: "full", edit_exc: "none", create_iss: "none", manage_usr: "none", export: "none", admin: "none", audit: "none", integ: "none", delete: "none" },
};

export default function SecurityCompliance() {
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

  // Build consolidated audit trail from all exceptions
  const auditEntries = useMemo(() => {
    const exceptions = getExceptions();
    const entries = exceptions.flatMap((ex) =>
      ex.activityHistory.map((h) => ({
        ...h,
        exceptionId: ex.id,
        exceptionTitle: ex.issueCategory + " — " + ex.id,
      }))
    );
    return [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const filteredAudit = useMemo(() => {
    let items = auditEntries;
    if (auditFilter !== "all") {
      items = items.filter((e) => e.action.toLowerCase().includes(auditFilter));
    }
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      items = items.filter(
        (e) =>
          e.user.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.exceptionTitle.toLowerCase().includes(q)
      );
    }
    return items.slice(0, 50);
  }, [auditEntries, auditFilter, auditSearch]);

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Icon icon="shield-check" className="w-6 h-6 text-primary" />
          Security & Compliance
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enterprise security posture, compliance certifications, access controls, and audit trail
        </p>
      </div>

      {/* ===== SECTION 1: Architecture Diagram ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="network" className="w-4 h-4 text-primary" />
            Hybrid Deployment Architecture
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Superblocks hybrid model keeps credentials and data within VUMC's infrastructure boundary
          </p>
        </CardHeader>
        <CardContent>
          <ArchitectureDiagram />
        </CardContent>
      </Card>

      {/* ===== SECTION 2: Compliance Posture ===== */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon icon="award" className="w-5 h-5 text-primary" />
          Compliance Posture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CERTIFICATIONS.map((cert) => (
            <Card key={cert.name} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${cert.status === "certified" ? "bg-green-500" : "bg-amber-500"}`} />
              <CardContent className="pt-4 pb-3 pl-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon icon={cert.icon} className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{cert.name}</span>
                  </div>
                  <Badge variant={cert.status === "certified" ? "default" : "outline"} className="text-[10px] shrink-0">
                    {cert.status === "certified" ? "Certified" : "Ready"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{cert.description}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                  <span>Issued: {cert.date}</span>
                  <span>Renewal: {cert.renewal}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ===== SECTION 3: RBAC Matrix ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="users" className="w-4 h-4 text-primary" />
            Role-Based Access Control Matrix
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Principle of least privilege — each role receives only the permissions required for its function
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold text-muted-foreground w-36">Permission</th>
                  {ROLES.map((role) => (
                    <th key={role} className="text-center py-2 px-2 font-semibold text-foreground">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium text-foreground">{perm.label}</td>
                    {ROLES.map((role) => {
                      const access = RBAC_MATRIX[role][perm.key];
                      return (
                        <td key={role} className="text-center py-2 px-2">
                          {access === "full" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700">
                              <Icon icon="check" className="w-3 h-3" />
                            </span>
                          )}
                          {access === "limited" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700">
                              <Icon icon="minus" className="w-3 h-3" />
                            </span>
                          )}
                          {access === "none" && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-400">
                              <Icon icon="x" className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-100 inline-flex items-center justify-center"><Icon icon="check" className="w-2 h-2 text-green-700" /></span>
              Full Access
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-100 inline-flex items-center justify-center"><Icon icon="minus" className="w-2 h-2 text-amber-700" /></span>
              Limited (own records only)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-50 inline-flex items-center justify-center"><Icon icon="x" className="w-2 h-2 text-red-400" /></span>
              No Access
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 4: Audit Trail ===== */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon icon="scroll-text" className="w-4 h-4 text-primary" />
                Audit Trail
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete record of all user actions — {auditEntries.length} events captured
              </p>
            </div>
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Icon icon="download" className="w-3 h-3" />
              Export Log
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="Search by user, action, or details..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="max-w-xs h-8 text-xs"
            />
            <Select value={auditFilter} onValueChange={setAuditFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="status">Status Change</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 max-h-[400px] overflow-y-auto border rounded-md">
            {filteredAudit.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No matching audit entries</div>
            ) : (
              filteredAudit.map((entry, i) => (
                <div key={entry.id + i} className="flex items-start gap-3 px-3 py-2.5 border-b border-border/40 hover:bg-muted/20 last:border-b-0">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon={getActionIcon(entry.action)} className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-xs text-foreground">{entry.user}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{entry.action}</Badge>
                      <span className="text-[10px] text-muted-foreground">on {entry.exceptionId}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{entry.details}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
          {filteredAudit.length >= 50 && (
            <p className="text-[10px] text-muted-foreground text-center mt-2">Showing first 50 entries. Use filters to narrow results.</p>
          )}
        </CardContent>
      </Card>

      {/* ===== SECTION 5: Data Security Summary ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Icon icon="lock" className="w-4 h-4 text-primary" />
              Encryption & Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <SecurityRow icon="arrow-right-left" label="In Transit" value="TLS 1.2 / 1.3 enforced" />
            <SecurityRow icon="hard-drive" label="At Rest" value="AES-256-GCM encryption" />
            <SecurityRow icon="key" label="Key Management" value="AWS KMS with automatic rotation" />
            <SecurityRow icon="file-key" label="Secrets" value="HashiCorp Vault / AWS Secrets Manager" />
            <SecurityRow icon="database" label="Data Isolation" value="Tenant-isolated, encrypted databases" />
            <SecurityRow icon="eye-off" label="PHI Handling" value="Field-level encryption, audit logging" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Icon icon="scan" className="w-4 h-4 text-primary" />
              Continuous Security Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <SecurityRow icon="radar" label="Vulnerability Scanning" value="Daily automated scans (Snyk + Dependabot)" />
            <SecurityRow icon="bug" label="Penetration Testing" value="Annual third-party pentests (NCC Group)" />
            <SecurityRow icon="git-branch" label="Code Security" value="Static analysis on every PR (SAST/DAST)" />
            <SecurityRow icon="alert-triangle" label="Incident Response" value="< 1hr acknowledgment SLA" />
            <SecurityRow icon="bell" label="Alerting" value="Real-time anomaly detection via SIEM" />
            <SecurityRow icon="history" label="Log Retention" value="13-month immutable audit logs" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ===== Architecture Diagram Component ===== */
function ArchitectureDiagram() {
  return (
    <div className="relative">
      {/* Diagram Container */}
      <div className="grid grid-cols-3 gap-4 items-start">
        {/* Left: VUMC Network */}
        <div className="col-span-1 border-2 border-dashed border-green-300 rounded-xl p-4 bg-green-50/50 relative">
          <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-semibold text-green-700 uppercase tracking-wide">
            VUMC Private Network
          </div>
          <div className="space-y-3 mt-2">
            <ArchBox icon="database" label="Epic Clarity" sub="EHR Data" color="emerald" />
            <ArchBox icon="server" label="QS/1 NRx" sub="Dispensing" color="emerald" />
            <ArchBox icon="warehouse" label="Inventory Systems" sub="Cardinal/McKesson" color="emerald" />
            <ArchBox icon="hard-drive" label="Snowflake" sub="Data Warehouse" color="emerald" />
          </div>
          <div className="mt-3 px-2 py-1.5 rounded bg-green-100 border border-green-200">
            <p className="text-[9px] text-green-800 font-medium text-center">
              🔒 Credentials never leave this boundary
            </p>
          </div>
        </div>

        {/* Middle: Superblocks Data Plane (in VPC) */}
        <div className="col-span-1 border-2 border-amber-300 rounded-xl p-4 bg-amber-50/50 relative">
          <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
            Superblocks Data Plane (Your VPC)
          </div>
          <div className="space-y-3 mt-2">
            <ArchBox icon="cpu" label="On-Premise Agent" sub="Executes queries" color="amber" />
            <ArchBox icon="shield" label="Secrets Manager" sub="Vault / KMS" color="amber" />
            <ArchBox icon="refresh-cw" label="API Runtime" sub="Business logic" color="amber" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] text-amber-800">
              <Icon icon="lock" className="w-2.5 h-2.5" />
              <span>AES-256 at rest</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-amber-800">
              <Icon icon="shield-check" className="w-2.5 h-2.5" />
              <span>mTLS between services</span>
            </div>
          </div>

          {/* Connection arrows left */}
          <div className="absolute left-0 top-1/2 -translate-x-4 flex flex-col items-center">
            <div className="w-4 h-px bg-green-400" />
            <span className="text-[7px] text-green-600 mt-0.5">Private</span>
          </div>
        </div>

        {/* Right: Superblocks Control Plane (Cloud) */}
        <div className="col-span-1 border-2 border-sky-300 rounded-xl p-4 bg-sky-50/50 relative">
          <div className="absolute -top-3 left-4 bg-background px-2 text-[10px] font-semibold text-sky-700 uppercase tracking-wide">
            Superblocks Control Plane (Cloud)
          </div>
          <div className="space-y-3 mt-2">
            <ArchBox icon="layout-dashboard" label="App Builder" sub="UI & Logic" color="sky" />
            <ArchBox icon="users" label="Auth & SSO" sub="Okta / Azure AD" color="sky" />
            <ArchBox icon="activity" label="Observability" sub="Logs, Traces, Metrics" color="sky" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[9px] text-sky-800">
              <Icon icon="lock" className="w-2.5 h-2.5" />
              <span>TLS 1.3 in transit</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-sky-800">
              <Icon icon="globe" className="w-2.5 h-2.5" />
              <span>SOC 2 Type II audited</span>
            </div>
          </div>

          {/* Connection arrows left */}
          <div className="absolute left-0 top-1/2 -translate-x-4 flex flex-col items-center">
            <div className="w-4 h-px bg-sky-400" />
            <span className="text-[7px] text-sky-600 mt-0.5">TLS 1.3</span>
          </div>
        </div>
      </div>

      {/* Bottom: End Users */}
      <div className="flex justify-center mt-5">
        <div className="flex items-center gap-3 border rounded-lg px-5 py-2.5 bg-muted/30">
          <Icon icon="monitor" className="w-4 h-4 text-foreground" />
          <div>
            <p className="text-xs font-medium text-foreground">VUMC Staff (Browser)</p>
            <p className="text-[10px] text-muted-foreground">Authenticated via Okta SSO + MFA → Session-scoped JWT</p>
          </div>
        </div>
      </div>

      {/* Key Insight callout */}
      <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
        <Icon icon="info" className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-foreground">Key Security Insight</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            In the hybrid model, <strong>no database credentials, PHI, or query results ever transit the Superblocks cloud</strong>.
            All data operations execute within VUMC's VPC via the on-premise agent. The control plane only handles UI rendering,
            authentication orchestration, and observability metadata.
          </p>
        </div>
      </div>
    </div>
  );
}

function ArchBox({ icon, label, sub, color }: { icon: IconName; label: string; sub: string; color: "emerald" | "amber" | "sky" }) {
  const bgMap = { emerald: "bg-green-100", amber: "bg-amber-100", sky: "bg-sky-100" };
  const textMap = { emerald: "text-green-700", amber: "text-amber-700", sky: "text-sky-700" };
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border bg-white/80">
      <div className={`w-6 h-6 rounded flex items-center justify-center ${bgMap[color]}`}>
        <Icon icon={icon} className={`w-3 h-3 ${textMap[color]}`} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-foreground leading-tight">{label}</p>
        <p className="text-[9px] text-muted-foreground leading-tight">{sub}</p>
      </div>
    </div>
  );
}

function SecurityRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded border bg-muted/20">
      <Icon icon={icon} className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-xs font-medium text-foreground w-32 shrink-0">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function getActionIcon(action: string): IconName {
  const a = action.toLowerCase();
  if (a.includes("created")) return "plus-circle";
  if (a.includes("status")) return "refresh-cw";
  if (a.includes("resolved")) return "check-circle";
  if (a.includes("note")) return "message-square";
  if (a.includes("assigned") || a.includes("owner")) return "user-check";
  if (a.includes("priority")) return "alert-triangle";
  if (a.includes("reopened")) return "rotate-ccw";
  if (a.includes("closed")) return "archive";
  return "edit";
}

function formatTimestamp(ts: string): string {
  try {
    return format(parseISO(ts), "MMM d, h:mm a");
  } catch {
    return ts;
  }
}
