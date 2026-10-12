import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router";
import GlobalFilters from "@/components/shared/GlobalFilters";
import KpiCard from "@/components/shared/KpiCard";
import { useAppContext } from "@/context/AppContext";
import { getAggregatedDailyMetrics, DAILY_METRICS } from "@/data/metrics";
import { getExceptions, getExceptionsByCategory, getExceptionsByStatus } from "@/data/exceptions";
import { LOCATIONS } from "@/data/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { generateInsights } from "@/lib/insightEngine";
import type { KpiSnapshot } from "@/lib/insightEngine";
import InsightsReportModal from "@/components/shared/InsightsReportModal";
import DemoStoryPresentation from "@/components/shared/DemoStoryPresentation";

const CHART_COLORS = [
  "#946E24", "#8BA18E", "#CFAE70", "#B3C9CD", "#ECB748",
  "#6B5B3E", "#A8C5A0", "#D4B86A", "#7A9B9E", "#BF9B30",
];

function useOverviewData(filters: ReturnType<typeof useAppContext>["filters"]) {
  const { locationId, region, serviceType, priority, issueCategory } = filters;

  const filteredLocations = useMemo(() =>
    LOCATIONS.filter((l) => {
      if (locationId && l.id !== locationId) return false;
      if (region && l.region !== region) return false;
      if (serviceType && !l.serviceTypes.includes(serviceType)) return false;
      return true;
    }), [locationId, region, serviceType]);

  const locationIds = useMemo(() => filteredLocations.map((l) => l.id), [filteredLocations]);

  const allExceptions = useMemo(() => {
    let ex = getExceptions();
    if (locationId) ex = ex.filter((e) => e.locationId === locationId);
    if (region) {
      const regionLocs = LOCATIONS.filter((l) => l.region === region).map((l) => l.id);
      ex = ex.filter((e) => regionLocs.includes(e.locationId));
    }
    if (serviceType) ex = ex.filter((e) => e.serviceType === serviceType);
    if (priority) ex = ex.filter((e) => e.priority === priority);
    if (issueCategory) ex = ex.filter((e) => e.issueCategory === issueCategory);
    return ex;
  }, [locationId, region, serviceType, priority, issueCategory]);

  const openExceptions = useMemo(
    () => allExceptions.filter((e) => e.status !== "Resolved" && e.status !== "Closed"),
    [allExceptions]
  );

  const criticalExceptions = useMemo(
    () => openExceptions.filter((e) => e.priority === "Critical"),
    [openExceptions]
  );

  const resolvedToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return allExceptions.filter((e) =>
      (e.status === "Resolved" || e.status === "Closed") &&
      e.lastUpdatedAt.startsWith(todayStr)
    ).length;
  }, [allExceptions]);

  // Today's metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMetrics = useMemo(() =>
    DAILY_METRICS.filter(
      (m) => m.date === todayStr && locationIds.includes(m.locationId)
    ), [todayStr, locationIds]);

  const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; })();
  const yesterdayMetrics = useMemo(() =>
    DAILY_METRICS.filter(
      (m) => m.date === yesterdayStr && locationIds.includes(m.locationId)
    ), [yesterdayStr, locationIds]);

  const todayVolume = useMemo(() => todayMetrics.reduce((s, m) => s + m.prescriptionVolume, 0), [todayMetrics]);
  const yesterdayVolume = useMemo(() => yesterdayMetrics.reduce((s, m) => s + m.prescriptionVolume, 0), [yesterdayMetrics]);

  const todayDelayed = useMemo(() => todayMetrics.reduce((s, m) => s + m.delayedPrescriptions, 0), [todayMetrics]);
  const yesterdayDelayed = useMemo(() => yesterdayMetrics.reduce((s, m) => s + m.delayedPrescriptions, 0), [yesterdayMetrics]);

  const avgTAT = useMemo(() => {
    if (!todayMetrics.length) return 0;
    return Math.round(todayMetrics.reduce((s, m) => s + m.averageTurnaroundMinutes, 0) / todayMetrics.length);
  }, [todayMetrics]);

  const avgSvcLevel = useMemo(() => {
    if (!todayMetrics.length) return 0;
    return Math.round(todayMetrics.reduce((s, m) => s + m.serviceLevelPct, 0) / todayMetrics.length);
  }, [todayMetrics]);

  const locationsNeedingAttention = useMemo(() =>
    filteredLocations.filter((l) => {
      const locMetrics = todayMetrics.filter((m) => m.locationId === l.id);
      const hasLowSvc = locMetrics.some((m) => m.serviceLevelPct < 85);
      const hasCritical = openExceptions.some((e) => e.locationId === l.id && e.priority === "Critical");
      return hasLowSvc || hasCritical || l.operatingStatus !== "Active";
    }).length, [filteredLocations, todayMetrics, openExceptions]);

  // 30-day volume chart
  const aggregatedDaily = useMemo(() => {
    const agg = getAggregatedDailyMetrics();
    if (!locationId && !region) return agg;
    // Filter by location
    const byDate: Record<string, { vol: number; exc: number; res: number; svcSum: number; count: number }> = {};
    for (const m of DAILY_METRICS.filter((m) => locationIds.includes(m.locationId))) {
      if (!byDate[m.date]) byDate[m.date] = { vol: 0, exc: 0, res: 0, svcSum: 0, count: 0 };
      byDate[m.date].vol += m.prescriptionVolume;
      byDate[m.date].exc += m.openExceptionCount;
      byDate[m.date].res += m.resolvedExceptions;
      byDate[m.date].svcSum += m.serviceLevelPct;
      byDate[m.date].count += 1;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        prescriptionVolume: d.vol,
        openExceptions: d.exc,
        resolvedExceptions: d.res,
        serviceLevelPct: Math.round(d.svcSum / d.count),
      }));
  }, [locationId, region, locationIds]);

  // By-location metrics
  const locationSummary = useMemo(() =>
    filteredLocations.map((loc) => {
      const m = todayMetrics.find((m) => m.locationId === loc.id);
      const excCount = openExceptions.filter((e) => e.locationId === loc.id).length;
      return {
        name: loc.name.replace(" Pharmacy", "").replace(" Medical Center", "").replace(" Campus", ""),
        fullName: loc.name,
        id: loc.id,
        serviceLevelPct: m?.serviceLevelPct ?? 0,
        averageTurnaroundMinutes: m?.averageTurnaroundMinutes ?? 0,
        openExceptions: excCount,
      };
    }).sort((a, b) => a.serviceLevelPct - b.serviceLevelPct), [filteredLocations, todayMetrics, openExceptions]);

  const exceptionsByCategory = useMemo(() => {
    const open = openExceptions;
    const counts: Record<string, number> = {};
    for (const e of open) {
      counts[e.issueCategory] = (counts[e.issueCategory] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [openExceptions]);

  const exceptionsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allExceptions) {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allExceptions]);

  return {
    todayVolume, yesterdayVolume, todayDelayed, yesterdayDelayed,
    avgTAT, avgSvcLevel, locationsNeedingAttention,
    openExceptions: openExceptions.length,
    criticalExceptions: criticalExceptions.length,
    resolvedToday,
    aggregatedDaily,
    locationSummary,
    exceptionsByCategory,
    exceptionsByStatus,
  };
}

function pctChange(current: number, previous: number): { value: string; trend: "up" | "down" | "neutral" } {
  if (!previous) return { value: "—", trend: "neutral" };
  const diff = ((current - previous) / previous) * 100;
  return {
    value: `${Math.abs(diff).toFixed(1)}%`,
    trend: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
  };
}

export default function ExecutiveOverview() {
  const { filters, exceptionRefreshKey } = useAppContext();
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);
  const [showDemoStory, setShowDemoStory] = useState(false);
  void exceptionRefreshKey; // reactive
  const data = useOverviewData(filters);

  const volChange = pctChange(data.todayVolume, data.yesterdayVolume);
  const delayedChange = pctChange(data.todayDelayed, data.yesterdayDelayed);

  // Generate AI insights based on current KPI snapshot
  const kpiSnapshot: KpiSnapshot = useMemo(() => ({
    prescriptionsProcessed: data.todayVolume,
    prescriptionsDelayed: data.todayDelayed,
    openExceptions: data.openExceptions,
    criticalExceptions: data.criticalExceptions,
    avgTurnaroundMin: data.avgTAT,
    serviceLevelPct: data.avgSvcLevel,
    locationsNeedingAttention: data.locationsNeedingAttention,
    resolvedToday: data.resolvedToday,
  }), [data]);

  const insights = useMemo(() => generateInsights(kpiSnapshot), [kpiSnapshot]);

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Global filters */}
      <GlobalFilters />

      {/* Page header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Executive Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowDemoStory(true)}
              className="text-xs bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-sm border border-slate-600"
            >
              <Icon icon="presentation" className="w-3.5 h-3.5 mr-1.5" />
              Demo Story
            </Button>
            <Button
              size="sm"
              onClick={() => setShowReport(true)}
              className="text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm"
            >
              <Icon icon="sparkles" className="w-3.5 h-3.5 mr-1.5" />
              Generate AI Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/queue")}
              className="text-xs"
            >
              <Icon icon="list-checks" className="w-3.5 h-3.5 mr-1.5" />
              View Work Queue
            </Button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="px-6 pb-4 grid grid-cols-4 gap-3">
        <KpiCard
          label="Prescriptions Processed Today"
          value={data.todayVolume.toLocaleString()}
          icon="pill"
          iconColor="text-primary"
          trend={volChange.trend === "up" ? "up" : volChange.trend === "down" ? "down" : "neutral"}
          trendValue={volChange.value}
          trendLabel="vs yesterday"
          tooltip="Total prescriptions entered, filled, and dispensed across all locations today"
          insight={insights[0]}
        />
        <KpiCard
          label="Prescriptions Currently Delayed"
          value={data.todayDelayed.toLocaleString()}
          icon="clock"
          iconColor="text-orange-600"
          alert={data.todayDelayed > 200}
          trend={delayedChange.trend === "up" ? "down" : delayedChange.trend === "down" ? "up" : "neutral"}
          trendValue={delayedChange.value}
          trendLabel="vs yesterday"
          tooltip="Prescriptions with turnaround time exceeding the service-level target"
          insight={insights[1]}
        />
        <KpiCard
          label="Open Operational Exceptions"
          value={data.openExceptions.toLocaleString()}
          icon="alert-triangle"
          iconColor="text-amber-600"
          alert={data.openExceptions > 80}
          tooltip="Exceptions in any status other than Resolved or Closed"
          insight={insights[2]}
        />
        <KpiCard
          label="Critical Exceptions"
          value={data.criticalExceptions}
          icon="shield-alert"
          iconColor="text-red-600"
          alert={data.criticalExceptions > 0}
          tooltip="Exceptions flagged Critical — require immediate attention"
          insight={insights[3]}
        />
        <KpiCard
          label="Avg Turnaround Time"
          value={`${data.avgTAT} min`}
          icon="timer"
          iconColor="text-primary"
          alert={data.avgTAT > 45}
          subtext="Target: 35 min"
          tooltip="Average time from prescription intake to dispense/ship across all locations today"
          insight={insights[4]}
        />
        <KpiCard
          label="Within Service Target"
          value={`${data.avgSvcLevel}%`}
          icon="circle-check-big"
          iconColor={data.avgSvcLevel >= 90 ? "text-green-600" : "text-amber-600"}
          alert={data.avgSvcLevel < 85}
          subtext="Target: ≥95%"
          tooltip="Percentage of prescriptions fulfilled within the defined service-level window"
          insight={insights[5]}
        />
        <KpiCard
          label="Locations Requiring Attention"
          value={data.locationsNeedingAttention}
          icon="map-pin"
          iconColor="text-amber-600"
          alert={data.locationsNeedingAttention > 3}
          tooltip="Locations with service level <85%, a Critical exception, or non-Active operating status"
          insight={insights[6]}
        />
        <KpiCard
          label="Exceptions Resolved Today"
          value={data.resolvedToday}
          icon="check-circle"
          iconColor="text-green-600"
          tooltip="Exceptions moved to Resolved or Closed status today"
          insight={insights[7]}
        />

        {/* AI Insights Report Modal */}
        <InsightsReportModal
          open={showReport}
          onOpenChange={setShowReport}
          insights={insights}
        />
      </div>

      {/* Charts row 1 */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-4">
        {/* 30-day volume */}
        <Card className="col-span-2 gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Prescription Volume — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.aggregatedDaily.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => format(parseISO(d), "M/d")}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 10 }} width={45} />
                <Tooltip
                  labelFormatter={(d) => format(parseISO(d as string), "MMM d, yyyy")}
                  formatter={(v: number) => [v.toLocaleString(), "Prescriptions"]}
                />
                <Area
                  type="monotone"
                  dataKey="prescriptionVolume"
                  stroke="#946E24"
                  fill="#946E2420"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Open exceptions by category */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Open Exceptions by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.exceptionsByCategory.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={90} />
                <Tooltip formatter={(v: number) => [v, "Exceptions"]} />
                <Bar dataKey="value" fill="#946E24" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-4">
        {/* Service level by location */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Service Level % by Location</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.locationSummary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Service Level"]} />
                <Bar dataKey="serviceLevelPct" radius={[0, 3, 3, 0]}>
                  {data.locationSummary.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.serviceLevelPct >= 90 ? "#10a37f" : entry.serviceLevelPct >= 80 ? "#f39c12" : "#e74c3c"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Exceptions opened vs resolved */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Exceptions Opened vs. Resolved (30d)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.aggregatedDaily.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => format(parseISO(d), "M/d")}
                  interval={5}
                />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip labelFormatter={(d) => format(parseISO(d as string), "MMM d")} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="openExceptions" stroke="#e74c3c" strokeWidth={2} name="Opened" dot={false} />
                <Line type="monotone" dataKey="resolvedExceptions" stroke="#10a37f" strokeWidth={2} name="Resolved" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Current workload by status */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Current Workload by Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.exceptionsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${(name ?? "").split(" ")[0]} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={9}
                >
                  {data.exceptionsByStatus.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Exceptions"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Avg TAT by location */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Avg Turnaround Time by Location (min)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[...data.locationSummary].sort((a, b) => b.averageTurnaroundMinutes - a.averageTurnaroundMinutes)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v} min`, "Avg TAT"]} />
                <Bar dataKey="averageTurnaroundMinutes" radius={[3, 3, 0, 0]}>
                  {data.locationSummary.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.averageTurnaroundMinutes > 45 ? "#e74c3c" : entry.averageTurnaroundMinutes > 35 ? "#f39c12" : "#10a37f"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Location attention table */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Locations Requiring Attention</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => navigate("/app/location")}>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-2 pb-0">
            <div className="space-y-2">
              {data.locationSummary
                .filter((l) => l.serviceLevelPct < 90 || l.openExceptions > 5)
                .slice(0, 5)
                .map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between py-1.5 border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 rounded px-1 transition-colors"
                    onClick={() => navigate("/app/location")}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">{loc.fullName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        TAT: {loc.averageTurnaroundMinutes}m &bull; {loc.openExceptions} open exceptions
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${loc.serviceLevelPct >= 90 ? "text-green-700 bg-green-50" : loc.serviceLevelPct >= 80 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"}`}
                    >
                      {loc.serviceLevelPct}%
                    </span>
                  </div>
                ))}
              {data.locationSummary.filter((l) => l.serviceLevelPct < 90 || l.openExceptions > 5).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">All locations operating within targets</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Story Presentation */}
      <DemoStoryPresentation open={showDemoStory} onClose={() => setShowDemoStory(false)} />
    </div>
  );
}
