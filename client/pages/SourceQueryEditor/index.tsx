import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import QueryWorkbench from "@/components/shared/QueryWorkbench";

// --- Data Types ---

interface TableNode {
  name: string;
  schema: string;
  columns: string[];
  primaryKey: string;
}

interface Relationship {
  from: string;
  to: string;
  fromKey: string;
  toKey: string;
  cardinality: "1:1" | "1:N" | "N:1" | "N:N";
}

interface QueryVersion {
  id: string;
  sql: string;
  timestamp: string;
  label: string;
}

interface QueryDefinition {
  id: string;
  name: string;
  description: string;
  powers: string;
  sourceTables: string[];
  joinConditions: string[];
  versions: QueryVersion[];
}

// --- ERD Data ---

const TABLES: TableNode[] = [
  {
    name: "PHARMACY_LOCATIONS",
    schema: "ANALYTICS.PHARMACY",
    columns: ["location_id", "name", "region", "pharmacy_type", "operating_status", "staffing_level_pct", "capacity_utilization_pct"],
    primaryKey: "location_id",
  },
  {
    name: "OPERATIONAL_DAILY_METRICS",
    schema: "ANALYTICS.PHARMACY",
    columns: ["metric_date", "location_id", "prescription_volume", "avg_turnaround_min", "open_exception_count", "service_level_pct", "delayed_prescriptions", "resolved_exceptions"],
    primaryKey: "metric_date, location_id",
  },
  {
    name: "OPERATIONAL_EXCEPTIONS",
    schema: "OPERATIONS.PHARMACY",
    columns: ["exception_id", "location_id", "issue_category", "priority", "status", "assigned_owner", "created_at", "days_open", "prescriptions_affected"],
    primaryKey: "exception_id",
  },
  {
    name: "HOURLY_METRICS",
    schema: "ANALYTICS.PHARMACY",
    columns: ["metric_hour", "metric_date", "location_id", "prescription_volume"],
    primaryKey: "metric_hour, metric_date, location_id",
  },
  {
    name: "SHIPPING_RECORDS",
    schema: "OPERATIONS.PHARMACY",
    columns: ["shipment_id", "location_id", "carrier", "tracking_number", "status", "shipped_date", "estimated_delivery", "temperature_controlled"],
    primaryKey: "shipment_id",
  },
];

const RELATIONSHIPS: Relationship[] = [
  { from: "OPERATIONAL_DAILY_METRICS", to: "PHARMACY_LOCATIONS", fromKey: "location_id", toKey: "location_id", cardinality: "N:1" },
  { from: "OPERATIONAL_EXCEPTIONS", to: "PHARMACY_LOCATIONS", fromKey: "location_id", toKey: "location_id", cardinality: "N:1" },
  { from: "HOURLY_METRICS", to: "PHARMACY_LOCATIONS", fromKey: "location_id", toKey: "location_id", cardinality: "N:1" },
  { from: "SHIPPING_RECORDS", to: "PHARMACY_LOCATIONS", fromKey: "location_id", toKey: "location_id", cardinality: "N:1" },
  { from: "HOURLY_METRICS", to: "OPERATIONAL_DAILY_METRICS", fromKey: "metric_date, location_id", toKey: "metric_date, location_id", cardinality: "N:1" },
];

// --- Query Definitions ---

const INITIAL_QUERIES: QueryDefinition[] = [
  {
    id: "q1",
    name: "Daily KPI Aggregation",
    description: "Aggregates daily prescription volume, turnaround time, service level, and exception counts across all locations.",
    powers: "Executive Overview KPI cards, 30-day volume trend chart",
    sourceTables: ["OPERATIONAL_DAILY_METRICS", "PHARMACY_LOCATIONS"],
    joinConditions: ["OPERATIONAL_DAILY_METRICS.location_id = PHARMACY_LOCATIONS.location_id"],
    versions: [
      {
        id: "v1-1",
        sql: `SELECT\n  pl.name AS pharmacy_name,\n  pl.region,\n  odm.metric_date,\n  SUM(odm.prescription_volume) AS total_volume,\n  AVG(odm.avg_turnaround_min) AS avg_tat,\n  AVG(odm.service_level_pct) AS avg_service_level,\n  SUM(odm.delayed_prescriptions) AS total_delayed,\n  SUM(odm.open_exception_count) AS total_open_exceptions,\n  SUM(odm.resolved_exceptions) AS total_resolved\nFROM ANALYTICS.PHARMACY.OPERATIONAL_DAILY_METRICS odm\nJOIN ANALYTICS.PHARMACY.PHARMACY_LOCATIONS pl\n  ON odm.location_id = pl.location_id\nWHERE odm.metric_date BETWEEN :start_date AND :end_date\n  AND (:location_id IS NULL OR pl.location_id = :location_id)\n  AND (:region IS NULL OR pl.region = :region)\nGROUP BY pl.name, pl.region, odm.metric_date\nORDER BY odm.metric_date DESC;`,
        timestamp: "2025-07-15T09:30:00Z",
        label: "Initial version",
      },
    ],
  },
  {
    id: "q2",
    name: "Exception Summary by Category",
    description: "Groups open exceptions by category with priority breakdown for charts.",
    powers: "Executive Overview exception charts, Exception Queue filters",
    sourceTables: ["OPERATIONAL_EXCEPTIONS", "PHARMACY_LOCATIONS"],
    joinConditions: ["OPERATIONAL_EXCEPTIONS.location_id = PHARMACY_LOCATIONS.location_id"],
    versions: [
      {
        id: "v2-1",
        sql: `SELECT\n  oe.issue_category,\n  oe.priority,\n  oe.status,\n  COUNT(*) AS exception_count,\n  AVG(oe.days_open) AS avg_days_open,\n  SUM(oe.prescriptions_affected) AS total_rx_affected,\n  pl.name AS pharmacy_name,\n  pl.region\nFROM OPERATIONS.PHARMACY.OPERATIONAL_EXCEPTIONS oe\nJOIN ANALYTICS.PHARMACY.PHARMACY_LOCATIONS pl\n  ON oe.location_id = pl.location_id\nWHERE oe.status NOT IN ('Resolved', 'Closed')\n  AND (:location_id IS NULL OR pl.location_id = :location_id)\n  AND (:region IS NULL OR pl.region = :region)\n  AND (:priority IS NULL OR oe.priority = :priority)\nGROUP BY oe.issue_category, oe.priority, oe.status, pl.name, pl.region\nORDER BY exception_count DESC;`,
        timestamp: "2025-07-15T09:30:00Z",
        label: "Initial version",
      },
    ],
  },
  {
    id: "q3",
    name: "Location Service Levels",
    description: "Calculates per-location service level, TAT, and exceptions for ranking.",
    powers: "Executive Overview service level chart, Location Detail page",
    sourceTables: ["OPERATIONAL_DAILY_METRICS", "PHARMACY_LOCATIONS", "OPERATIONAL_EXCEPTIONS"],
    joinConditions: [
      "OPERATIONAL_DAILY_METRICS.location_id = PHARMACY_LOCATIONS.location_id",
      "OPERATIONAL_EXCEPTIONS.location_id = PHARMACY_LOCATIONS.location_id",
    ],
    versions: [
      {
        id: "v3-1",
        sql: `SELECT\n  pl.location_id,\n  pl.name AS pharmacy_name,\n  pl.region,\n  pl.pharmacy_type,\n  pl.operating_status,\n  pl.staffing_level_pct,\n  odm.service_level_pct,\n  odm.avg_turnaround_min,\n  odm.prescription_volume,\n  COALESCE(exc.open_count, 0) AS open_exceptions,\n  COALESCE(exc.critical_count, 0) AS critical_exceptions\nFROM ANALYTICS.PHARMACY.PHARMACY_LOCATIONS pl\nLEFT JOIN ANALYTICS.PHARMACY.OPERATIONAL_DAILY_METRICS odm\n  ON pl.location_id = odm.location_id\n  AND odm.metric_date = CURRENT_DATE\nLEFT JOIN (\n  SELECT\n    location_id,\n    COUNT(*) AS open_count,\n    SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) AS critical_count\n  FROM OPERATIONS.PHARMACY.OPERATIONAL_EXCEPTIONS\n  WHERE status NOT IN ('Resolved', 'Closed')\n  GROUP BY location_id\n) exc ON pl.location_id = exc.location_id\nWHERE (:region IS NULL OR pl.region = :region)\nORDER BY odm.service_level_pct ASC NULLS LAST;`,
        timestamp: "2025-07-15T09:30:00Z",
        label: "Initial version",
      },
    ],
  },
  {
    id: "q4",
    name: "Turnaround Time Trends",
    description: "Hourly and daily TAT data for trend analysis and bottleneck identification.",
    powers: "Executive Overview TAT chart, Location Detail hourly breakdown",
    sourceTables: ["HOURLY_METRICS", "OPERATIONAL_DAILY_METRICS", "PHARMACY_LOCATIONS"],
    joinConditions: [
      "HOURLY_METRICS.location_id = PHARMACY_LOCATIONS.location_id",
      "HOURLY_METRICS.metric_date = OPERATIONAL_DAILY_METRICS.metric_date",
    ],
    versions: [
      {
        id: "v4-1",
        sql: `SELECT\n  hm.metric_date,\n  hm.metric_hour,\n  pl.name AS pharmacy_name,\n  pl.location_id,\n  hm.prescription_volume AS hourly_volume,\n  odm.avg_turnaround_min AS daily_avg_tat,\n  odm.service_level_pct\nFROM ANALYTICS.PHARMACY.HOURLY_METRICS hm\nJOIN ANALYTICS.PHARMACY.PHARMACY_LOCATIONS pl\n  ON hm.location_id = pl.location_id\nJOIN ANALYTICS.PHARMACY.OPERATIONAL_DAILY_METRICS odm\n  ON hm.location_id = odm.location_id\n  AND hm.metric_date = odm.metric_date\nWHERE hm.metric_date BETWEEN :start_date AND :end_date\n  AND (:location_id IS NULL OR pl.location_id = :location_id)\nORDER BY hm.metric_date, hm.metric_hour;`,
        timestamp: "2025-07-15T09:30:00Z",
        label: "Initial version",
      },
    ],
  },
  {
    id: "q5",
    name: "Shipping & Cold Chain Status",
    description: "Tracks active shipments, delivery status, and temperature-controlled logistics.",
    powers: "Shipping & Licensing page, Location Detail shipping panel",
    sourceTables: ["SHIPPING_RECORDS", "PHARMACY_LOCATIONS"],
    joinConditions: ["SHIPPING_RECORDS.location_id = PHARMACY_LOCATIONS.location_id"],
    versions: [
      {
        id: "v5-1",
        sql: `SELECT\n  sr.shipment_id,\n  sr.carrier,\n  sr.tracking_number,\n  sr.status AS shipment_status,\n  sr.shipped_date,\n  sr.estimated_delivery,\n  sr.temperature_controlled,\n  pl.name AS destination_pharmacy,\n  pl.region,\n  DATEDIFF('day', sr.shipped_date, COALESCE(sr.estimated_delivery, CURRENT_DATE)) AS transit_days\nFROM OPERATIONS.PHARMACY.SHIPPING_RECORDS sr\nJOIN ANALYTICS.PHARMACY.PHARMACY_LOCATIONS pl\n  ON sr.location_id = pl.location_id\nWHERE sr.status IN ('In Transit', 'Out for Delivery', 'Pending')\n  AND (:location_id IS NULL OR pl.location_id = :location_id)\n  AND (:carrier IS NULL OR sr.carrier = :carrier)\nORDER BY sr.estimated_delivery ASC;`,
        timestamp: "2025-07-15T09:30:00Z",
        label: "Initial version",
      },
    ],
  },
  {
    id: "q6",
    name: "Exception Resolution Velocity",
    description: "Tracks resolution rate over time (opened vs resolved) for trend lines.",
    powers: "Executive Overview Opened vs Resolved chart, Operations Dashboard",
    sourceTables: ["OPERATIONAL_EXCEPTIONS", "OPERATIONAL_DAILY_METRICS"],
    joinConditions: ["Correlated on metric_date = DATE(created_at) and location_id"],
    versions: [
      {
        id: "v6-1",
        sql: `WITH daily_opened AS (\n  SELECT\n    DATE(created_at) AS event_date,\n    COUNT(*) AS opened_count\n  FROM OPERATIONS.PHARMACY.OPERATIONAL_EXCEPTIONS\n  WHERE created_at >= DATEADD('day', -30, CURRENT_DATE)\n  GROUP BY DATE(created_at)\n),\ndaily_resolved AS (\n  SELECT\n    metric_date AS event_date,\n    SUM(resolved_exceptions) AS resolved_count\n  FROM ANALYTICS.PHARMACY.OPERATIONAL_DAILY_METRICS\n  WHERE metric_date >= DATEADD('day', -30, CURRENT_DATE)\n  GROUP BY metric_date\n)\nSELECT\n  COALESCE(o.event_date, r.event_date) AS report_date,\n  COALESCE(o.opened_count, 0) AS exceptions_opened,\n  COALESCE(r.resolved_count, 0) AS exceptions_resolved,\n  COALESCE(r.resolved_count, 0) - COALESCE(o.opened_count, 0) AS net_resolution\nFROM daily_opened o\nFULL OUTER JOIN daily_resolved r\n  ON o.event_date = r.event_date\nORDER BY report_date;`,
        timestamp: "2025-07-15T09:30:00Z",
        label: "Initial version",
      },
    ],
  },
];

// --- localStorage Persistence ---

const STORAGE_KEY = "vumc_pharmacy_query_versions";

function loadQueries(): QueryDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QueryDefinition[];
      if (Array.isArray(parsed) && parsed.length === INITIAL_QUERIES.length) {
        return parsed;
      }
    }
  } catch {
    // fallback to defaults
  }
  return INITIAL_QUERIES;
}

function saveQueries(queries: QueryDefinition[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
  } catch {
    // ignore quota errors
  }
}

// --- Component ---

export default function SourceQueryEditor() {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<QueryDefinition[]>(loadQueries);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_QUERIES[0].id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<string>("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState(false);

  // Persist to localStorage whenever queries change
  useEffect(() => {
    saveQueries(queries);
  }, [queries]);

  const selectedQuery = useMemo(
    () => queries.find((q) => q.id === selectedId) ?? queries[0],
    [queries, selectedId]
  );

  const activeVersion = selectedQuery.versions[selectedQuery.versions.length - 1];

  // ERD: Filter tables and relationships relevant to the selected query
  const relevantTables = useMemo(
    () => TABLES.filter((t) => selectedQuery.sourceTables.includes(t.name)),
    [selectedQuery]
  );

  const relevantRelationships = useMemo(
    () => RELATIONSHIPS.filter(
      (r) => selectedQuery.sourceTables.includes(r.from) && selectedQuery.sourceTables.includes(r.to)
    ),
    [selectedQuery]
  );

  const handleEdit = useCallback(() => {
    setEditBuffer(activeVersion.sql);
    setEditingId(selectedQuery.id);
  }, [activeVersion, selectedQuery]);

  const handleSave = useCallback(() => {
    setQueries((prev) => prev.map((q) => {
      if (q.id !== selectedQuery.id) return q;
      const newVersion: QueryVersion = {
        id: `${q.id}-v${q.versions.length + 1}`,
        sql: editBuffer,
        timestamp: new Date().toISOString(),
        label: `Version ${q.versions.length + 1}`,
      };
      return { ...q, versions: [...q.versions, newVersion] };
    }));
    setEditingId(null);
    setEditBuffer("");
    toast.success("Query saved", { description: "New version created and persisted" });
  }, [editBuffer, selectedQuery.id]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditBuffer("");
  }, []);

  const handleRevert = useCallback((versionId: string) => {
    setQueries((prev) => prev.map((q) => {
      if (q.id !== selectedQuery.id) return q;
      const version = q.versions.find((v) => v.id === versionId);
      if (!version) return q;
      const revertVersion: QueryVersion = {
        id: `${q.id}-v${q.versions.length + 1}`,
        sql: version.sql,
        timestamp: new Date().toISOString(),
        label: `Reverted to ${version.label}`,
      };
      return { ...q, versions: [...q.versions, revertVersion] };
    }));
    toast.success("Query reverted", { description: "Previous version restored as new active version" });
  }, [selectedQuery.id]);

  const handleRunPreview = useCallback(() => {
    toast.success("Query executed", { description: "Preview results generated (simulated — 12 rows returned in 340ms)" });
  }, []);

  const isEditing = editingId === selectedQuery.id;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/app/integration")} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon="arrow-left" className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Source Query Editor</h1>
              <p className="text-xs text-muted-foreground">
                View and edit SQL queries powering dashboards
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Snowflake</Badge>
            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">Databricks</Badge>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Query Selector */}
        <aside className="w-72 border-r border-border bg-muted/30 flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reports & KPIs</p>
          </div>
          <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
            {queries.map((q) => {
              const isActive = q.id === selectedId && !workbenchMode;
              const versionCount = q.versions.length;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedId(q.id);
                    setEditingId(null);
                    setEditBuffer("");
                    setShowVersionHistory(false);
                    setWorkbenchMode(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary/10 border border-primary/20 shadow-sm"
                      : "hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="file-code"
                      className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className={`text-xs font-medium leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {q.name}
                    </span>
                  </div>
                  <div className="mt-1 ml-5.5 flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground">{q.sourceTables.length} tables</span>
                    {versionCount > 1 && (
                      <Badge variant="secondary" className="text-[8px] h-3.5 px-1">
                        v{versionCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* + New Query Button */}
          <div className="px-2 pb-3 pt-2 border-t border-border">
            <button
              onClick={() => setWorkbenchMode(true)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium text-xs transition-all ${
                workbenchMode
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
              }`}
            >
              <Icon icon="plus" className="w-3.5 h-3.5" />
              New Query
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {workbenchMode ? (
            <QueryWorkbench />
          ) : (
          <div className="p-5 space-y-5">
            {/* Query Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Icon icon="file-code" className="w-4 h-4 text-primary" />
                  {selectedQuery.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedQuery.description}</p>
                <p className="text-[10px] text-primary/80 mt-1 font-medium">
                  Powers: {selectedQuery.powers}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleRunPreview}>
                      <Icon icon="play" className="w-3.5 h-3.5 mr-1.5" /> Run Preview
                    </Button>
                    <Button variant="default" size="sm" className="text-xs h-8" onClick={handleEdit}>
                      <Icon icon="pencil" className="w-3.5 h-3.5 mr-1.5" /> Edit Query
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="default" size="sm" className="text-xs h-8" onClick={handleSave}>
                      <Icon icon="save" className="w-3.5 h-3.5 mr-1.5" /> Save Version
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Source Tables & Joins Metadata */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-medium">Tables:</span>
                {selectedQuery.sourceTables.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[9px] h-5 px-2 font-mono">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-medium">Joins:</span>
                {selectedQuery.joinConditions.map((j, i) => (
                  <span key={i} className="text-[9px] font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                    {j.length > 55 ? j.slice(0, 55) + "…" : j}
                  </span>
                ))}
              </div>
            </div>

            <Separator />

            {/* ERD Section — relevant tables only */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
                    <Icon icon="git-merge" className="w-3.5 h-3.5 text-violet-700" />
                  </div>
                  Entity Relationships
                  <Badge variant="outline" className="text-[9px] ml-1">{relevantTables.length} tables</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-3 mb-3 ${
                  relevantTables.length <= 2 ? "grid-cols-2" :
                  relevantTables.length <= 3 ? "grid-cols-3" : "grid-cols-4"
                }`}>
                  {relevantTables.map((table) => (
                    <div key={table.name} className="rounded-lg border-2 border-slate-200 bg-slate-50 overflow-hidden">
                      <div className="bg-slate-700 text-white px-2.5 py-1.5">
                        <p className="text-[10px] font-bold truncate">{table.name}</p>
                        <p className="text-[8px] text-slate-300">{table.schema}</p>
                      </div>
                      <div className="px-2.5 py-2 space-y-0.5">
                        {table.columns.map((col) => (
                          <p key={col} className={`text-[9px] font-mono ${
                            table.primaryKey.includes(col) ? "text-violet-700 font-bold" : "text-slate-600"
                          }`}>
                            {table.primaryKey.includes(col) && <span className="text-amber-500">🔑 </span>}
                            {col}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {relevantRelationships.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <p className="text-[10px] font-bold text-foreground mb-1.5">Join Paths</p>
                    <div className="space-y-1.5">
                      {relevantRelationships.map((rel, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[9px] text-muted-foreground">
                          <span className="font-mono font-medium text-foreground">{rel.from}</span>
                          <span className="text-violet-600 font-bold">.{rel.fromKey.split(",")[0]}</span>
                          <span className="text-[8px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">{rel.cardinality}</span>
                          <Icon icon="arrow-right" className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono font-medium text-foreground">{rel.to}</span>
                          <span className="text-violet-600 font-bold">.{rel.toKey.split(",")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SQL Editor */}
            <Card className={isEditing ? "ring-2 ring-primary/30" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon icon="code-2" className="w-4 h-4 text-primary" />
                    SQL Query
                  </CardTitle>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Active: <span className="font-medium text-foreground">{activeVersion.label}</span></span>
                    <span>• {new Date(activeVersion.timestamp).toLocaleDateString()}</span>
                    {selectedQuery.versions.length > 1 && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5">
                        {selectedQuery.versions.length} versions
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={editBuffer}
                    onChange={(e) => setEditBuffer(e.target.value)}
                    className="w-full h-72 bg-slate-900 text-green-300 text-[11px] font-mono p-4 rounded-md border-0 focus:ring-2 focus:ring-primary/50 resize-y leading-relaxed"
                    spellCheck={false}
                  />
                ) : (
                  <pre className="bg-slate-900 text-green-300 text-[11px] font-mono p-4 rounded-md overflow-x-auto whitespace-pre max-h-[320px] overflow-y-auto leading-relaxed">
                    {activeVersion.sql}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader className="pb-2">
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="flex items-center justify-between w-full"
                >
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon icon="history" className="w-4 h-4 text-primary" />
                    Version History
                    <Badge variant="secondary" className="text-[9px] ml-1">
                      {selectedQuery.versions.length}
                    </Badge>
                  </CardTitle>
                  <Icon icon={showVersionHistory ? "chevron-up" : "chevron-down"} className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardHeader>
              {showVersionHistory && (
                <CardContent>
                  <div className="divide-y rounded-lg border overflow-hidden">
                    {[...selectedQuery.versions].reverse().map((version, idx) => (
                      <div key={version.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] h-5">Active</Badge>
                          )}
                          <span className="text-xs font-medium text-foreground">{version.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(version.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {idx !== 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-7 text-primary"
                            onClick={() => handleRevert(version.id)}
                          >
                            <Icon icon="undo-2" className="w-3 h-3 mr-1" /> Revert
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
          )}
        </main>
      </div>
    </div>
  );
}
