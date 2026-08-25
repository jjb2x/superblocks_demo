import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import KpiCard from "@/components/shared/KpiCard";
import { PriorityBadge, StatusBadge } from "@/components/shared/StatusBadges";
import { LOCATIONS, getLocationName } from "@/data/locations";
import { DAILY_METRICS, WORKFLOW_METRICS } from "@/data/metrics";
import { getExceptions } from "@/data/exceptions";
import { APP_USERS } from "@/data/users";
import { useAppContext } from "@/context/AppContext";

const CHART_COLORS = ["#946E24", "#8BA18E", "#CFAE70", "#B3C9CD", "#ECB748", "#6B5B3E", "#A8C5A0"];

export default function LocationDetail() {
  const { selectedLocationId, setSelectedLocationId, setSelectedExceptionId } = useAppContext();
  const navigate = useNavigate();

  const locationId = selectedLocationId ?? "loc-01";
  const location = LOCATIONS.find((l) => l.id === locationId);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayMetric = DAILY_METRICS.find((m) => m.date === todayStr && m.locationId === locationId);

  // 30-day metrics for this location
  const dailyData = useMemo(() =>
    DAILY_METRICS.filter((m) => m.locationId === locationId).sort((a, b) => a.date.localeCompare(b.date)),
    [locationId]);

  // Workflow stages
  const workflowData = useMemo(() =>
    WORKFLOW_METRICS.filter((m) => m.locationId === locationId),
    [locationId]);

  // Open exceptions
  const openExceptions = useMemo(() =>
    getExceptions().filter((e) => e.locationId === locationId && e.status !== "Resolved" && e.status !== "Closed"),
    [locationId]);

  const criticalCount = openExceptions.filter((e) => e.priority === "Critical").length;

  const exceptionsByPriority = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of openExceptions) counts[e.priority] = (counts[e.priority] ?? 0) + 1;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [openExceptions]);

  const handleExceptionClick = (id: string) => {
    setSelectedExceptionId(id);
    navigate("/app/queue");
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header + location selector */}
      <div className="px-6 pt-5 pb-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Location Detail</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{location?.name ?? "Select a location"}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locationId} onValueChange={(v) => setSelectedLocationId(v)}>
              <SelectTrigger className="h-8 text-xs w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => { setSelectedLocationId(locationId); navigate("/app/new-issue"); }}>
              <Icon icon="circle-plus" className="w-3.5 h-3.5 mr-1" /> New Issue
            </Button>
          </div>
        </div>

        {/* Location info badges */}
        {location && (
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-muted border">{location.region}</span>
            <span className="px-2 py-0.5 rounded bg-muted border">{location.pharmacyType}</span>
            <span className={`px-2 py-0.5 rounded border font-medium ${location.operatingStatus === "Active" ? "bg-green-100 text-green-800 border-green-200" : location.operatingStatus === "Limited" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
              {location.operatingStatus}
            </span>
            <span className="text-muted-foreground">Services: {location.serviceTypes.join(", ")}</span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="px-6 pt-4 pb-3 grid grid-cols-4 gap-3">
        <KpiCard label="Today's Volume" value={todayMetric?.prescriptionVolume.toLocaleString() ?? "0"} icon="pill" iconColor="text-primary" />
        <KpiCard label="Current Backlog" value={Math.round((todayMetric?.prescriptionVolume ?? 0) * 0.08)} icon="clock" iconColor="text-amber-600" />
        <KpiCard label="Avg Turnaround" value={`${todayMetric?.averageTurnaroundMinutes ?? 0} min`} icon="timer" iconColor={todayMetric && todayMetric.averageTurnaroundMinutes > 45 ? "text-red-600" : "text-primary"} alert={todayMetric ? todayMetric.averageTurnaroundMinutes > 45 : false} />
        <KpiCard label="Service Level" value={`${todayMetric?.serviceLevelPct ?? 0}%`} icon="circle-check-big" iconColor={todayMetric && todayMetric.serviceLevelPct >= 90 ? "text-green-600" : "text-amber-600"} />
      </div>
      <div className="px-6 pb-4 grid grid-cols-4 gap-3">
        <KpiCard label="Open Exceptions" value={openExceptions.length} icon="alert-triangle" iconColor="text-amber-600" alert={openExceptions.length > 10} />
        <KpiCard label="Critical" value={criticalCount} icon="shield-alert" iconColor="text-red-600" alert={criticalCount > 0} />
        <KpiCard label="Staffing Level" value={`${location?.staffingLevel ?? 0}%`} icon="users" iconColor={location && location.staffingLevel < 80 ? "text-amber-600" : "text-green-600"} alert={location ? location.staffingLevel < 70 : false} />
        <KpiCard label="Capacity Utilization" value={`${location?.capacityUtilization ?? 0}%`} icon="gauge" iconColor={location && location.capacityUtilization > 90 ? "text-red-600" : "text-primary"} alert={location ? location.capacityUtilization > 90 : false} />
      </div>

      {/* Charts */}
      <div className="px-6 pb-4 grid grid-cols-3 gap-4">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">30-Day Rx Volume</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => format(parseISO(d), "M/d")} interval={5} />
                <YAxis tick={{ fontSize: 10 }} width={40} />
                <Tooltip labelFormatter={(d) => format(parseISO(d as string), "MMM d")} />
                <Area type="monotone" dataKey="prescriptionVolume" stroke="#946E24" fill="#946E2420" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Turnaround Time Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => format(parseISO(d), "M/d")} interval={5} />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip labelFormatter={(d) => format(parseISO(d as string), "MMM d")} />
                <Area type="monotone" dataKey="averageTurnaroundMinutes" stroke="#e67e22" fill="#e67e2220" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Issues by Priority</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={exceptionsByPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                  {exceptionsByPriority.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 pb-4 grid grid-cols-2 gap-4">
        {/* Service level trend */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Service Level % Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => format(parseISO(d), "M/d")} interval={5} />
                <YAxis tick={{ fontSize: 10 }} domain={[50, 100]} width={30} />
                <Tooltip labelFormatter={(d) => format(parseISO(d as string), "MMM d")} />
                <Area type="monotone" dataKey="serviceLevelPct" stroke="#10a37f" fill="#10a37f20" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workflow stage */}
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Current Volume by Workflow Stage</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={workflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip />
                <Bar dataKey="currentCount" fill="#9b59b6" radius={[3, 3, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Open exceptions table */}
      <div className="px-6 pb-6">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-2 pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Open Exceptions ({openExceptions.length})</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => navigate("/app/queue")}>
                View full queue
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">ID</th>
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Category</th>
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Priority</th>
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-2 pr-2 font-semibold text-muted-foreground">Owner</th>
                    <th className="text-right py-2 font-semibold text-muted-foreground">Rx</th>
                  </tr>
                </thead>
                <tbody>
                  {openExceptions.slice(0, 10).map((ex) => (
                    <tr key={ex.id} className="border-b border-border/50 hover:bg-muted/40 cursor-pointer" onClick={() => handleExceptionClick(ex.id)}>
                      <td className="py-2 pr-2 font-medium text-primary">{ex.id}</td>
                      <td className="py-2 pr-2">{ex.issueCategory}</td>
                      <td className="py-2 pr-2"><PriorityBadge priority={ex.priority} /></td>
                      <td className="py-2 pr-2"><StatusBadge status={ex.status} /></td>
                      <td className="py-2 pr-2">{APP_USERS.find((u) => u.id === ex.assignedOwner)?.name.split(" ")[0] ?? "—"}</td>
                      <td className="py-2 text-right font-medium">{ex.prescriptionsAffected}</td>
                    </tr>
                  ))}
                  {openExceptions.length === 0 && (
                    <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No open exceptions for this location</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
