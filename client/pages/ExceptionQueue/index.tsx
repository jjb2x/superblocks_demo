import { useApi } from "@/hooks/useApi";
import { useState, useMemo, useCallback, useRef, useEffect, lazy, Suspense } from "react";
const AutoExceptionDemo = lazy(() => import("@/components/shared/AutoExceptionDemo"));
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge, StatusBadge } from "@/components/shared/StatusBadges";
import ExceptionDrawer from "./ExceptionDrawer";
import InteractiveGrid from "./InteractiveGrid";
import { getExceptions } from "@/data/exceptions";
import { getLocationName } from "@/data/locations";
import { APP_USERS } from "@/data/users";
import { useAppContext } from "@/context/AppContext";
import type { ExceptionRecord, ExceptionStatus, Priority, IssueCategory } from "@/data/types";

const PAGE_SIZE = 20;

type QueueTab = "open" | "resolved" | "closed";

const PRIORITY_ORDER: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const STATUS_OPTS: ExceptionStatus[] = ["New", "Under Review", "Assigned", "In Progress", "Waiting on External Party", "Resolved", "Closed"];
const PRIORITY_OPTS: Priority[] = ["Critical", "High", "Medium", "Low"];
const CATEGORIES: IssueCategory[] = [
  "Inventory", "Insurance", "Staffing", "Workflow Delay", "Technology",
  "Vendor", "Shipping", "Prescription Clarification", "Capacity", "Other",
];

type DatabricksExceptionRow = {
  ID: string;
  Created: string;
  Location: string;
  Service_Type: string;
  Category: string;
  Subtype: string;
  Priority: string;
  Status: string;
  Owner: string;
  Days_Open: number;
  Rx_Affected: number;
  Due_Date: string;
  Note: string | null;
};

function formatDate(ts: string): string {
  try { return format(parseISO(ts), "MM/dd/yy HH:mm"); } catch { return ts; }
}

function formatShort(ts: string): string {
  try { return format(parseISO(ts), "MM/dd/yy"); } catch { return ts; }
}

export default function ExceptionQueue() {
  const { exceptionRefreshKey, setSelectedExceptionId, selectedExceptionId } = useAppContext();
  const [activeTab, setActiveTab] = useState<QueueTab>("open");
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ExceptionStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterCategory, setFilterCategory] = useState<IssueCategory | "all">("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<keyof ExceptionRecord | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerException, setDrawerException] = useState<ExceptionRecord | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAutoDemo, setShowAutoDemo] = useState(false);
  const { run: runGetExceptions} = useApi("GetExceptions");

  const [databricksRows, setDatabricksRows] =
  useState<DatabricksExceptionRow[] | null>(null);

  const [databricksLoading, setDatabricksLoading] = useState(false);

  const loadDatabricksExceptions = useCallback(async () => {
  try {
    setDatabricksLoading(true);

    const result = await runGetExceptions({});

    if (!result) {
      console.error("GetExceptions returned no result");
      return;
    }

    setDatabricksRows(result as DatabricksExceptionRow[]);
  } catch (error) {
    console.error("Failed to load Databricks exceptions:", error);
    toast.error("Unable to load live exception data");
  } finally {
    setDatabricksLoading(false);
  }
}, [runGetExceptions]);


  
  const testDatabricks = async () => {
  try {
    const result = await runGetExceptions({});

    console.log("GetExceptions result:", result);

    if (!result) {
      toast.error("GetExceptions returned no result");
      return;
    }

    toast.success(`Databricks returned ${result.length} rows`);
  } catch (error) {
    console.error("GetExceptions failed:", error);
    toast.error("GetExceptions failed — check console");
  }
};

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(searchRaw), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchRaw]);

  // Load live Databricks data initially and whenever the app refresh key changes.
  useEffect(() => {
    void loadDatabricksExceptions();
  }, [loadDatabricksExceptions, exceptionRefreshKey]);

  // Preserve the existing ExceptionRecord shape while making Databricks
  // authoritative for the operational fields that are now stored there.
  const allExceptions = useMemo(() => {
    const mockExceptions = getExceptions();

    // Keep the existing queue visible while the initial Databricks request runs.
    if (!databricksRows) {
      return mockExceptions;
    }

    const mockById = new Map(
      mockExceptions.map((exception) => [exception.id, exception])
    );

    return databricksRows
      .map((row) => {
        const base = mockById.get(row.ID);

        if (!base) {
          console.warn(
            `Databricks exception ${row.ID} has no matching local base record`
          );
          return null;
        }

        const normalizedOwner = row.Owner.trim().toLowerCase();
        const ownerUser = APP_USERS.find(
          (user) => user.name.trim().toLowerCase() === normalizedOwner
        );

        return {
          ...base,
          createdAt: row.Created,
          serviceType: row.Service_Type as ExceptionRecord["serviceType"],
          issueCategory: row.Category as IssueCategory,
          issueSubtype: row.Subtype,
          priority: row.Priority as Priority,
          status: row.Status as ExceptionStatus,
          assignedOwner: ownerUser?.id ?? base.assignedOwner,
          daysOpen: row.Days_Open,
          prescriptionsAffected: row.Rx_Affected,
          resolutionDueDate: row.Due_Date,
        } as ExceptionRecord;
      })
      .filter((exception): exception is ExceptionRecord => exception !== null);
  }, [databricksRows, exceptionRefreshKey]);

  // Counts per tab (before filters)
  const tabCounts = useMemo(() => ({
    open: allExceptions.filter((e) => e.status !== "Resolved" && e.status !== "Closed").length,
    resolved: allExceptions.filter((e) => e.status === "Resolved").length,
    closed: allExceptions.filter((e) => e.status === "Closed").length,
  }), [allExceptions]);

  // Operational summary derived from the Databricks-backed exception records
const exceptionSummary = useMemo(() => {
  const openExceptions = allExceptions.filter(
    (e) => e.status !== "Resolved" && e.status !== "Closed"
  );

  const highPriority = openExceptions.filter(
    (e) => e.priority === "Critical" || e.priority === "High"
  ).length;

  const unassigned = openExceptions.filter(
    (e) => !e.assignedOwner
  ).length;

  const prescriptionsAffected = openExceptions.reduce(
    (total, e) => total + e.prescriptionsAffected,
    0
  );

  return {
    open: openExceptions.length,
    highPriority,
    unassigned,
    prescriptionsAffected,
  };
}, [allExceptions]);

  // Reset page & clear status filter when switching tabs
  const handleTabChange = useCallback((tab: QueueTab) => {
    setActiveTab(tab);
    setPage(0);
    setFilterStatus("all");
  }, []);

  const filtered = useMemo(() => {
    let list = allExceptions;
    // Tab filtering
    if (activeTab === "open") list = list.filter((e) => e.status !== "Resolved" && e.status !== "Closed");
    else if (activeTab === "resolved") list = list.filter((e) => e.status === "Resolved");
    else list = list.filter((e) => e.status === "Closed");

    if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
    if (filterPriority !== "all") list = list.filter((e) => e.priority === filterPriority);
    if (filterCategory !== "all") list = list.filter((e) => e.issueCategory === filterCategory);
    if (filterLocation !== "all") list = list.filter((e) => e.locationId === filterLocation);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.id.toLowerCase().includes(q) ||
        e.issueCategory.toLowerCase().includes(q) ||
        e.issueSubtype.toLowerCase().includes(q) ||
        getLocationName(e.locationId).toLowerCase().includes(q) ||
        (APP_USERS.find((u) => u.id === e.assignedOwner)?.name ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allExceptions, activeTab, filterStatus, filterPriority, filterCategory, filterLocation, search]);

  const sorted = useMemo(() => {
    let list = [...filtered];
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey as keyof ExceptionRecord] as string | number;
        const bv = b[sortKey as keyof ExceptionRecord] as string | number;
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    } else {
      list.sort((a, b) => {
        const po = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (po !== 0) return po;
        const dateDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (dateDiff !== 0) return dateDiff;
        return b.prescriptionsAffected - a.prescriptionsAffected;
      });
    }
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = useMemo(() => sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [sorted, page]);

  useEffect(() => setPage(0), [filtered.length]);

  const handleSort = useCallback((key: keyof ExceptionRecord) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  const handleRowClick = useCallback((ex: ExceptionRecord) => {
    setDrawerException(ex);
    setSelectedExceptionId(ex.id);
    setDrawerOpen(true);
  }, [setSelectedExceptionId]);

  // Auto-open if selectedExceptionId is set (e.g., from Add New Issue)
  useEffect(() => {
    if (selectedExceptionId && !drawerOpen) {
      const ex = allExceptions.find((e) => e.id === selectedExceptionId);
      if (ex) { setDrawerException(ex); setDrawerOpen(true); }
    }
  }, [selectedExceptionId, allExceptions]);

  // Keep drawer exception in sync when data refreshes (e.g., after adding a note)
  useEffect(() => {
    if (drawerOpen && drawerException) {
      const updated = allExceptions.find((e) => e.id === drawerException.id);
      if (updated) setDrawerException(updated);
    }
  }, [allExceptions]);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedExceptionId(null);
    if (drawerException) {
      setDrawerException(getExceptions().find((e) => e.id === drawerException.id) ?? null);
    }
  }, [drawerException, setSelectedExceptionId]);

  const handleExport = useCallback(() => {
    const header = ["ID", "Created", "Location", "Service Type", "Category", "Subtype", "Priority", "Status", "Owner", "Days Open", "Rx Affected", "Due Date"];
    const rows = sorted.map((e) => [
      e.id,
      formatDate(e.createdAt),
      getLocationName(e.locationId),
      e.serviceType,
      e.issueCategory,
      e.issueSubtype,
      e.priority,
      e.status,
      APP_USERS.find((u) => u.id === e.assignedOwner)?.name ?? e.assignedOwner,
      e.daysOpen,
      e.prescriptionsAffected,
      e.resolutionDueDate,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "exception_queue.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sorted.length} records to CSV`);
  }, [sorted]);

  // Unique locations for filter
  const uniqueLocations = useMemo(() => {
    const ids = [...new Set(allExceptions.map((e) => e.locationId))];
    return ids.map((id) => ({ id, name: getLocationName(id) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allExceptions]);

  const SortIcon = ({ k }: { k: string }) =>
    sortKey === k ? (
      <Icon icon={sortDir === "asc" ? "chevron-up" : "chevron-down"} className="w-3 h-3 ml-0.5 inline" />
    ) : (
      <Icon icon="chevrons-up-down" className="w-3 h-3 ml-0.5 inline text-muted-foreground/40" />
    );

  // Status filter options per tab
  const statusOptsForTab = useMemo(() => {
    if (activeTab === "open") return STATUS_OPTS.filter((s) => s !== "Resolved" && s !== "Closed");
    if (activeTab === "resolved") return ["Resolved"] as ExceptionStatus[];
    return ["Closed"] as ExceptionStatus[];
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Exception Work Queue</h1>
            <p className="text-sm text-muted-foreground">
              {databricksLoading ? "Loading live data…" : `${sorted.length} records`}
              {activeTab === "open" && <> &bull; {filtered.filter((e) => e.priority === "Critical").length} critical open</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAutoDemo((v) => !v)}
              variant={showAutoDemo ? "default" : "outline"}
              size="sm"
              className={`text-xs h-8 ${showAutoDemo ? "bg-violet-600 hover:bg-violet-700 text-white" : "border-violet-300 text-violet-700 hover:bg-violet-50"}`}
            >
              <Icon icon="zap" className="w-3.5 h-3.5 mr-1.5" />
              {showAutoDemo ? "Hide Demo" : "Real-Time Demo"}
            </Button>
            <Button
              onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
              variant="outline"
              size="sm"
              className="text-xs h-8"
            >
              <Icon icon={viewMode === "table" ? "grid-3x3" : "table"} className="w-3.5 h-3.5 mr-1.5" />
              {viewMode === "table" ? "Shift to IG" : "Shift to Default View"}
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" className="text-xs h-8">
              <Icon icon="download" className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>

            <Button
            onClick={testDatabricks}
            variant="outline"
            size="sm"
            className="text-xs h-8"
            >
            Test Databricks
          </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-3 border-b">
          {([
            { key: "open", label: "Open", count: tabCounts.open, icon: "alert-circle" },
            { key: "resolved", label: "Resolved", count: tabCounts.resolved, icon: "check-circle" },
            { key: "closed", label: "Closed", count: tabCounts.closed, icon: "archive" },
          ] as const).map(({ key, label, count, icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon icon={icon} className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Icon icon="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search ID, category, location, owner..."
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
              className="h-8 text-xs pl-8"
            />
          </div>
          {activeTab === "open" && (
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ExceptionStatus | "all")}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                {statusOptsForTab.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | "all")}>
            <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              {PRIORITY_OPTS.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as IssueCategory | "all")}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Locations</SelectItem>
              {uniqueLocations.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

            {/* Databricks-backed operational summary */}
      <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b bg-muted/20">
        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">Open Exceptions</p>
          <p className="text-2xl font-bold">{exceptionSummary.open}</p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">High / Critical</p>
          <p className="text-2xl font-bold">{exceptionSummary.highPriority}</p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">Unassigned</p>
          <p className="text-2xl font-bold">{exceptionSummary.unassigned}</p>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs text-muted-foreground">Rx Affected</p>
          <p className="text-2xl font-bold">
            {exceptionSummary.prescriptionsAffected.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Auto-Exception Real-Time Demo */}
      {showAutoDemo && (
        <Suspense fallback={null}>
          <AutoExceptionDemo onClose={() => setShowAutoDemo(false)} />
        </Suspense>
      )}

      {/* View Content */}
      {viewMode === "grid" ? (
        <div className="flex-1 overflow-hidden px-4 pb-2">
          <InteractiveGrid data={sorted} />
        </div>
      ) : (
      <>
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b">
            <tr>
              {([
                { key: "id", label: "ID" },
                { key: "createdAt", label: "Created" },
                { key: "locationId", label: "Location" },
                { key: "serviceType", label: "Service" },
                { key: "issueCategory", label: "Category" },
                { key: "priority", label: "Priority" },
                { key: "status", label: "Status" },
                { key: "assignedOwner", label: "Owner" },
                { key: "daysOpen", label: "Age" },
                { key: "prescriptionsAffected", label: "Rx" },
                { key: "resolutionDueDate", label: "Due" },
              ] as { key: keyof ExceptionRecord; label: string }[]).map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left px-3 py-2.5 font-semibold text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap"
                  onClick={() => handleSort(key)}
                >
                  {label}<SortIcon k={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((ex) => {
              const isOverdue = new Date(ex.resolutionDueDate) < new Date() && ex.status !== "Resolved" && ex.status !== "Closed";
              const owner = APP_USERS.find((u) => u.id === ex.assignedOwner);
              const isCritical = ex.priority === "Critical" && ex.status !== "Resolved" && ex.status !== "Closed";
              return (
                <tr
                  key={ex.id}
                  className={`border-b border-border/50 hover:bg-accent/40 cursor-pointer transition-colors ${isCritical ? "bg-red-50/40" : ""}`}
                  onClick={() => handleRowClick(ex)}
                >
                  <td className="px-3 py-2.5 font-medium text-primary">{ex.id}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(ex.createdAt)}</td>
                  <td className="px-3 py-2.5 max-w-[140px]">
                    <span className="truncate block" title={getLocationName(ex.locationId)}>
                      {getLocationName(ex.locationId).split(" ").slice(0, 2).join(" ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    {ex.serviceType.replace(" Pharmacy", "").replace("Medication Access Services", "Med Access")}
                  </td>
                  <td className="px-3 py-2.5">{ex.issueCategory}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><PriorityBadge priority={ex.priority} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={ex.status} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{owner?.name.split(" ")[0]} {owner?.name.split(" ")[1]?.[0]}.</td>
                  <td className={`px-3 py-2.5 ${ex.daysOpen > 7 ? "text-amber-600 font-medium" : ""}`}>{ex.daysOpen}d</td>
                  <td className={`px-3 py-2.5 font-medium ${ex.prescriptionsAffected > 25 ? "text-red-600" : ""}`}>{ex.prescriptionsAffected}</td>
                  <td className={`px-3 py-2.5 whitespace-nowrap ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                    {isOverdue && <Icon icon="alert-circle" className="w-3 h-3 inline mr-0.5 text-red-500" />}
                    {formatShort(ex.resolutionDueDate)}
                  </td>
                </tr>
              );
            })}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-12 text-muted-foreground">
                  <Icon icon="inbox" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>
                    {activeTab === "open" && "No open exceptions match your filters"}
                    {activeTab === "resolved" && "No resolved exceptions found"}
                    {activeTab === "closed" && "No closed exceptions found"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      );
      

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t bg-background shrink-0">
        <span className="text-xs text-muted-foreground">
          Page {page + 1} of {totalPages || 1} &bull; {sorted.length} total
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(0)}>
            <Icon icon="chevrons-left" className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            <Icon icon="chevron-left" className="w-3 h-3" />
          </Button>
          <span className="text-xs px-2">{page + 1}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            <Icon icon="chevron-right" className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
            <Icon icon="chevrons-right" className="w-3 h-3" />
          </Button>
        </div>
      </div>

      </>
      )}

      {/* Detail drawer */}
      <ExceptionDrawer
        exception={drawerException}
        open={drawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
