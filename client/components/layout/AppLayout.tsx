import { useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "lucide-react/dynamic";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

const NAV_ITEMS_TOP: { label: string; path: string; icon: IconName }[] = [
  { label: "Executive Overview", path: "/app", icon: "layout-dashboard" },
  { label: "Operations Dashboard", path: "/app/operations", icon: "activity" },
  { label: "Location Detail", path: "/app/location", icon: "map-pin" },
  { label: "Exception Work Queue", path: "/app/queue", icon: "list-checks" },
  { label: "Add New Issue", path: "/app/new-issue", icon: "circle-plus" },
  { label: "Shipping & Licensing", path: "/app/shipping", icon: "truck" },
  { label: "My Health at Vanderbilt", path: "/app/mhav", icon: "heart-pulse" },
  { label: "Data Integration", path: "/app/integration", icon: "database" },
  { label: "Security & Compliance", path: "/app/security", icon: "shield-check" },
];

const NAV_ITEMS_BOTTOM: { label: string; path: string; icon: IconName }[] = [
  { label: "Administration", path: "/app/admin", icon: "settings" },
];

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const [showAbout, setShowAbout] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showJira, setShowJira] = useState(false);
  const navigate = useNavigate();
  const { currentUserRole, userName } = useAppContext();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border">
        {/* Logo / Identity */}
        <div className="flex flex-col px-4 pt-5 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
              <div className="absolute inset-0 rounded-full border-[1.5px] border-sidebar-primary/70" />
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/95 flex items-center justify-center">
                <img src="https://www.vanderbilthealth.com/img/vh_logo.png" alt="Vanderbilt Health" className="w-5.5 h-5.5 object-contain" />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sidebar-foreground font-semibold text-[13px] leading-tight tracking-tight">Vanderbilt Health</span>
              <span className="text-sidebar-foreground font-semibold text-[13px] leading-tight tracking-tight">Bridge</span>
              <span className="text-sidebar-primary/80 text-[10px] font-medium leading-tight mt-0.5 tracking-wide uppercase">Enterprise Operations Platform</span>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS_TOP.slice(0, 7).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {/* JIRA nav button (opens dialog) */}
          <button
            onClick={() => setShowJira(true)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
            )}
          >
            <Icon icon="ticket" className="w-4 h-4 shrink-0" />
            JIRA
          </button>

          {NAV_ITEMS_TOP.slice(7).map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          {NAV_ITEMS_BOTTOM.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                )}
              >
                <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-3 border-t border-sidebar-border flex flex-col gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <Icon icon="user" className="w-3 h-3 text-sidebar-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sidebar-foreground text-xs font-medium truncate">{userName}</span>
              <span className="text-sidebar-foreground/40 text-[10px] truncate">{currentUserRole}</span>
            </div>
          </div>
          <button
            onClick={() => setShowUserGuide(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-xs transition-colors"
          >
            <Icon icon="book-open" className="w-3.5 h-3.5" />
            App User Guide
          </button>
          <Link
            to="/app/security"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-xs transition-colors"
          >
            <Icon icon="shield-check" className="w-3.5 h-3.5" />
            Security & Technical Specs
          </Link>
          <button
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-xs transition-colors"
          >
            <Icon icon="life-buoy" className="w-3.5 h-3.5" />
            About this demo
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 text-xs transition-colors"
          >
            <Icon icon="log-out" className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        {/* Session & Auth Indicator */}
        <div className="px-3 py-2 border-t border-sidebar-border bg-sidebar-accent/20">
          <div className="flex items-center gap-1.5 text-[10px] text-sidebar-foreground/50">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>Okta SSO</span>
            <span className="mx-1 opacity-30">|</span>
            <Icon icon="clock" className="w-2.5 h-2.5" />
            <span>Session: 28m</span>
            <span className="mx-1 opacity-30">|</span>
            <span>TLS 1.3</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Demo banner */}
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5 shrink-0">
          <Icon icon="flask-conical" className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-amber-800 text-xs font-medium">
            Demonstration Environment — Synthetic Data Only
          </span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-background">
          {children}
        </div>
      </div>

      {/* About Dialog */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="info" className="w-5 h-5 text-primary" />
              About This Prototype
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-foreground">
            <p className="text-muted-foreground">
              This prototype demonstrates how pharmacy operational data, workflow management,
              and user-entered information could be combined into a governed internal application.
            </p>
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-semibold text-foreground">Production implementation would require:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Approved integrations (Snowflake, Databricks, Epic Clarity)</li>
                <li>Security review and penetration testing</li>
                <li>Role-based access control aligned to organizational policy</li>
                <li>Appropriate handling of protected health information (PHI)</li>
                <li>HIPAA Business Associate Agreement</li>
                <li>Validated deployment through IT change management</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-amber-50 border-amber-200 p-4">
              <p className="text-amber-800 font-medium">All data in this application is entirely synthetic.</p>
              <p className="text-amber-700 text-xs mt-1">
                No real patients, employees, or protected health information is used.
                Pharmacy names, user names, and operational data are fictional.
              </p>
            </div>
            <div className="text-muted-foreground">
              <strong>Version:</strong> Demo v1.0 &nbsp;|&nbsp; <strong>Platform:</strong> Superblocks
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowAbout(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* App User Guide Dialog */}
      <Dialog open={showUserGuide} onOpenChange={setShowUserGuide}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="book-open" className="w-5 h-5 text-primary" />
              App User Guide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm">
            {/* Overview */}
            <div>
              <h3 className="font-semibold text-foreground mb-1.5">Overview</h3>
              <p className="text-muted-foreground">
                Vanderbilt Health Bridge is an enterprise platform for monitoring, managing, and
                optimizing pharmacy operations across multiple locations. It provides real-time visibility into
                prescription workflows, exception management, and operational performance.
              </p>
            </div>

            <Separator />

            {/* Page Breakdown */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Pages &amp; Features</h3>
              <div className="space-y-3">
                <GuideItem icon="layout-dashboard" title="Executive Overview">
                  High-level KPIs, 30-day trend charts, exception breakdowns by category, service level performance,
                  and a list of locations requiring immediate attention.
                </GuideItem>
                <GuideItem icon="activity" title="Operations Dashboard">
                  Hourly volume trends, workflow stage analysis, backlog tracking, and a location comparison table
                  with conditional formatting. Click any location row to navigate to its detail page.
                </GuideItem>
                <GuideItem icon="list-checks" title="Exception Work Queue">
                  Searchable, sortable, and filterable table of all exceptions with Open/Resolved/Closed tabs.
                  Click any exception ID to open the detail drawer. Use "Shift to IG" for a spreadsheet-style
                  editable grid view. Share issues via Teams or Email directly from the drawer.
                </GuideItem>
                <GuideItem icon="circle-plus" title="Add New Issue">
                  Dynamic form that adapts based on issue category (Inventory, Staffing, Technology, etc.).
                  Includes priority suggestions and escalation warnings for high-impact issues.
                </GuideItem>
                <GuideItem icon="map-pin" title="Location Detail">
                  Deep-dive into a specific pharmacy location with KPIs, performance charts, and a list of
                  open exceptions for that site.
                </GuideItem>
                <GuideItem icon="truck" title="Shipping &amp; Licensing">
                  Interactive US map showing state licensing, shipping volumes, and cost analysis. Identifies
                  optimization opportunities where shifting fills to a closer facility would reduce cost and transit time.
                </GuideItem>
                <GuideItem icon="database" title="Data Integration">
                  Architecture diagram showing how data flows from source systems (EHR, dispensing, inventory)
                  through Snowflake/Databricks into the application.
                </GuideItem>
                <GuideItem icon="settings" title="Administration">
                  User preferences, role switching (demo), service-level targets, category management,
                  and assignment configuration.
                </GuideItem>
              </div>
            </div>

            <Separator />

            {/* Quick Tips */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Quick Tips</h3>
              <div className="space-y-2">
                <TipItem title="Resolve an exception">
                  Open the drawer → click "Resolve" → confirm. The issue moves to the Resolved tab.
                </TipItem>
                <TipItem title="Reopen a resolved issue">
                  Switch to the Resolved or Closed tab → click the issue → click "Reopen" in the drawer.
                </TipItem>
                <TipItem title="Bulk-edit in Interactive Grid">
                  Click "Shift to IG" → edit status, priority, owner, or add notes directly in cells.
                  Changes save instantly on selection change or blur.
                </TipItem>
                <TipItem title="Find shipping savings">
                  Go to Shipping &amp; Licensing → select a location → check the "Top Savings Opportunity" banner
                  and the recommendations panel below the map.
                </TipItem>
                <TipItem title="Export data">
                  On the Exception Work Queue, click "Export CSV" to download the current filtered view.
                </TipItem>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowUserGuide(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* JIRA Create Request Dialog */}
      <JiraCreateRequestDialog open={showJira} onOpenChange={setShowJira} reporterName={userName} />

    </div>
  );
}

/* ===== Sub-components for readability ===== */

function GuideItem({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon icon={icon} className="w-3.5 h-3.5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function TipItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      <Icon icon="lightbulb" className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-muted-foreground"><span className="font-medium text-foreground">{title}:</span> {children}</p>
    </div>
  );
}

/* ===== JIRA Create Request Dialog ===== */

function JiraCreateRequestDialog({
  open,
  onOpenChange,
  reporterName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reporterName: string;
}) {
  const [space, setSpace] = useState("pharmacy-rsm");
  const [workType, setWorkType] = useState("request");
  const [status, setStatus] = useState("to-do");
  const [activeTab, setActiveTab] = useState<"fields" | "completion">("fields");
  const [summary, setSummary] = useState("");
  const [component, setComponent] = useState("");
  const [description, setDescription] = useState("");
  const [createAnother, setCreateAnother] = useState(false);
  const [summaryTouched, setSummaryTouched] = useState(false);
  const [completionDate, setCompletionDate] = useState("");
  const seqRef = useRef(300);

  // Format reporter name as "Last, First"
  const nameParts = reporterName.trim().split(" ");
  const formattedReporter =
    nameParts.length >= 2
      ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(" ")}`
      : reporterName;

  const { run: createJiraRequest, loading: creating } = useApi("CreateJiraRequest");

  const handleCreate = useCallback(async () => {
    if (!summary.trim()) {
      setSummaryTouched(true);
      return;
    }
    const prefix = space === "pharmacy-rsm" ? "RSM" : "OPS";
    const id = `${prefix}-${seqRef.current++}`;
    try {
      await createJiraRequest({
        id,
        space,
        work_type: workType,
        status,
        summary: summary.trim(),
        reporter: formattedReporter,
        component: component || null,
        description: description.trim() || null,
        requested_completion_date: completionDate || null,
      });
      toast.success("Request created successfully", {
        description: `"${summary}" has been added as ${id}.`,
      });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);
      toast.error("Failed to create request: " + message);
      return;
    }
    if (createAnother) {
      setSummary("");
      setComponent("");
      setDescription("");
      setCompletionDate("");
      setSummaryTouched(false);
    } else {
      setSummary("");
      setComponent("");
      setDescription("");
      setCompletionDate("");
      setSummaryTouched(false);
      onOpenChange(false);
    }
  }, [summary, space, workType, status, component, description, completionDate, createAnother, onOpenChange, createJiraRequest, formattedReporter]);

  const handleCancel = useCallback(() => {
    setSummary("");
    setComponent("");
    setDescription("");
    setCompletionDate("");
    setSummaryTouched(false);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create Request</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Required fields are marked with an asterisk <span className="text-destructive">*</span>
        </p>

        <div className="space-y-4 mt-2">
          {/* Space */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Space <span className="text-destructive">*</span>
            </Label>
            <Select value={space} onValueChange={setSpace}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pharmacy-rsm">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-700 flex items-center justify-center">
                      <Icon icon="box" className="w-3 h-3 text-white" />
                    </span>
                    Pharmacy RSM (RSM)
                  </span>
                </SelectItem>
                <SelectItem value="pharmacy-ops">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center">
                      <Icon icon="box" className="w-3 h-3 text-white" />
                    </span>
                    Pharmacy Ops (OPS)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Work type <span className="text-destructive">*</span>
            </Label>
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="request">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center">
                      <Icon icon="hash" className="w-2.5 h-2.5 text-white" />
                    </span>
                    Request
                  </span>
                </SelectItem>
                <SelectItem value="bug">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-500 flex items-center justify-center">
                      <Icon icon="bug" className="w-2.5 h-2.5 text-white" />
                    </span>
                    Bug
                  </span>
                </SelectItem>
                <SelectItem value="task">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-amber-600 flex items-center justify-center">
                      <Icon icon="check" className="w-2.5 h-2.5 text-white" />
                    </span>
                    Task
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <a href="#" className="text-xs text-amber-700 hover:underline">
              Learn about work types
            </a>
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to-do">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              This is the initial status upon creation
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b">
            <button
              onClick={() => setActiveTab("fields")}
              className={cn(
                "pb-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === "fields"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Field Tab
          </button>
          <button
            onClick={() => setActiveTab("completion")}
            className={cn(
              "pb-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === "completion"
                ? "border-amber-600 text-amber-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Requested Completion Date
            </button>
          </div>

          {activeTab === "fields" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Summary <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  onBlur={() => setSummaryTouched(true)}
                  className={cn(
                    summaryTouched && !summary.trim() && "border-red-500 ring-1 ring-red-500"
                  )}
                  placeholder=""
                />
                {summaryTouched && !summary.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <Icon icon="diamond" className="w-3 h-3 text-amber-500" />
                    Summary is required
                  </p>
                )}
              </div>

              {/* Reporter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Reporter <span className="text-destructive">*</span>
                </Label>
                <Input value={formattedReporter} disabled className="max-w-[200px] bg-muted/50" />
                <p className="text-[11px] text-muted-foreground">(Migrated on 28 Apr 2025 19:42 UTC)</p>
              </div>

              {/* Components */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Components</Label>
                <Select value={component} onValueChange={setComponent}>
                  <SelectTrigger className="max-w-[240px]">
                    <SelectValue placeholder="Select Component" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dispensing">Dispensing</SelectItem>
                    <SelectItem value="inventory">Inventory Management</SelectItem>
                    <SelectItem value="shipping">Shipping & Distribution</SelectItem>
                    <SelectItem value="compliance">Compliance & Licensing</SelectItem>
                    <SelectItem value="integrations">System Integrations</SelectItem>
                    <SelectItem value="reporting">Reporting & Analytics</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">(Migrated on 28 Apr 2025 19:42 UTC)</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the request in detail..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-[11px] text-muted-foreground">(Migrated on 28 Apr 2025 19:42 UTC)</p>
              </div>
            </div>
          )}

          {activeTab === "completion" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Requested Completion Date</Label>
                <Input type="date" className="max-w-[200px]" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">
                  Optional: specify when this request should be completed by.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t mt-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="create-another"
              checked={createAnother}
              onCheckedChange={(v) => setCreateAnother(v === true)}
            />
            <label htmlFor="create-another" className="text-sm text-muted-foreground cursor-pointer">
              Create another
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
