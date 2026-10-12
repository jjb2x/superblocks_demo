import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import { useNavigate } from "react-router";
import GlobalFilters from "@/components/shared/GlobalFilters";
import { useAppContext } from "@/context/AppContext";
import { HOURLY_METRICS, DAILY_METRICS, WORKFLOW_METRICS } from "@/data/metrics";
import { getExceptions } from "@/data/exceptions";
import { LOCATIONS } from "@/data/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

import type { ServiceType } from "@/data/types";

const SERVICE_COLORS: Record<string, string> = {
  "Retail Pharmacy": "#946E24",
  "Specialty Pharmacy": "#8BA18E",
  "Central Fill": "#CFAE70",
  "Mail Order": "#B3C9CD",
  "Transplant Pharmacy": "#6B5B3E",
  "Clinic Pharmacy": "#A8C5A0",
  "Medication Access Services": "#ECB748",
};

export default function OperationsDashboard() {
  const { filters, setSelectedLocationId } = useAppContext();
  const navigate = useNavigate();

  const filteredLocIds = useMemo(() => {
    return LOCATIONS.filter((l) => {
      if (filters.locationId && l.id !== filters.locationId) return false;
      if (filters.region && l.region !== filters.region) return false;
      if (filters.serviceType && !l.serviceTypes.includes(filters.serviceType)) return false;
      return true;
    }).map((l) => l.id);
  }, [filters]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Hourly volume (aggregated across filtered locs)
  const hourlyData = useMemo(() => {
    const byHour: Record<number, number> = {};
    for (const m of HOURLY_METRICS.filter((m) => filteredLocIds.includes(m.locationId))) {
      byHour[m.hour] = (byHour[m.hour] ?? 0) + m.prescriptionVolume;
    }
    return Array.from({ length: Math.max(...Object.keys(byHour).map(Number)) + 1 }, (_, h) => ({
      hour: `${h}:00`,
      volume: byHour[h] ?? 0,
    }));
  }, [filteredLocIds]);

  // Volume by location (today)
  const locationVolume = useMemo(() =>
    filteredLocIds.map((id) => {
      const loc = LOCATIONS.find((l) => l.id === id)!;
      const m = DAILY_METRICS.find((m) => m.date === todayStr && m.locationId === id);
      return {
        id,
        name: loc.name.replace(" Pharmacy", "").replace(" Medical Center", "").replace(" Center", "").slice(0, 18),
        volume: m?.prescriptionVolume ?? 0,
        backlog: m ? Math.round(m.prescriptionVolume * 0.08) : 0,
        serviceLevelPct: m?.serviceLevelPct ?? 0,
        tat: m?.averageTurnaroundMinutes ?? 0,
      };
    }).sort((a, b) => b.volume - a.volume), [filteredLocIds, todayStr]);

  // Volume by service type
  const serviceTypeVolume = useMemo(() => {
    const totals: Record<ServiceType, number> = {} as Record<ServiceType, number>;
    for (const loc of LOCATIONS.filter((l) => filteredLocIds.includes(l.id))) {
      const m = DAILY_METRICS.find((m) => m.date === todayStr && m.locationId === loc.id);
      if (!m) continue;
      const perType = Math.round(m.prescriptionVolume / loc.serviceTypes.length);
      for (const st of loc.serviceTypes) {
        totals[st] = (totals[st] ?? 0) + perType;
      }
    }
    return Object.entries(totals).map(([name, volume]) => ({ name, volume })).sort((a, b) => b.volume - a.volume);
  }, [filteredLocIds, todayStr]);

  // Workflow stage metrics (aggregated)
  const workflowData = useMemo(() => {
    const stages = ["Intake", "Data Entry", "Insurance Processing", "Pharmacist Verification", "Filling", "Packing", "Final Verification", "Ready for Pickup", "Shipped"];
    return stages.map((stage) => {
      const mList = WORKFLOW_METRICS.filter((m) => m.stage === stage && filteredLocIds.includes(m.locationId));
      const totalCount = mList.reduce((s, m) => s + m.currentCount, 0);
      const avgTime = mList.length ? Math.round(mList.reduce((s, m) => s + m.averageProcessingMinutes, 0) / mList.length) : 0;
      return { stage: stage.replace("Insurance Processing", "Ins. Processing").replace("Pharmacist Verification", "Ph. Verification").replace("Final Verification", "Final Verify"), count: totalCount, avgTime };
    });
  }, [filteredLocIds]);

  // Backlog by location
  const backlogData = useMemo(() =>
    locationVolume.map((l) => ({ name: l.name, backlog: l.backlog, estHours: parseFloat((l.backlog / 12).toFixed(1)) })), [locationVolume]);

  // Total backlog
  const totalBacklog = useMemo(() => backlogData.reduce((s, l) => s + l.backlog, 0), [backlogData]);
  const totalEstHours = useMemo(() => parseFloat(backlogData.reduce((s, l) => s + l.estHours, 0).toFixed(1)), [backlogData]);

  // Top operational constraints (locations with issues)
  const topConstraints = useMemo(() => {
    const openExc = getExceptions().filter((e) => e.status !== "Resolved" && e.status !== "Closed");
    return filteredLocIds.map((id) => {
      const loc = LOCATIONS.find((l) => l.id === id)!;
      const m = DAILY_METRICS.find((m) => m.date === todayStr && m.locationId === id);
      const excCount = openExc.filter((e) => e.locationId === id).length;
      const critical = openExc.filter((e) => e.locationId === id && e.priority === "Critical").length;
      const score = excCount * 2 + critical * 5 + Math.max(0, (m?.averageTurnaroundMinutes ?? 0) - 35);
      return { id, name: loc.name, tat: m?.averageTurnaroundMinutes ?? 0, svc: m?.serviceLevelPct ?? 0, excCount, critical, score, status: loc.operatingStatus };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [filteredLocIds, todayStr]);

  // Location comparison table
  const locationComparison = useMemo(() => {
    const baseline: Record<string, { tat: number; svc: number }> = {};
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    for (const id of filteredLocIds) {
      const wkMetrics = DAILY_METRICS.filter((m) => m.locationId === id && new Date(m.date) >= sevenDaysAgo && new Date(m.date) < new Date());
      if (wkMetrics.length) {
        baseline[id] = {
          tat: Math.round(wkMetrics.reduce((s, m) => s + m.averageTurnaroundMinutes, 0) / wkMetrics.length),
          svc: Math.round(wkMetrics.reduce((s, m) => s + m.serviceLevelPct, 0) / wkMetrics.length),
        };
      }
    }
    return locationVolume.map((l) => {
      const b = baseline[l.id] ?? { tat: l.tat, svc: l.serviceLevelPct };
      const tatChange = l.tat - b.tat;
      const svcChange = l.serviceLevelPct - b.svc;
      return { ...l, tatChange, svcChange };
    });
  }, [locationVolume, filteredLocIds]);

  const handleLocationClick = (locId: string) => {
    setSelectedLocationId(locId);
    navigate("/app/location");
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <GlobalFilters />

      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Operations Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time operational metrics — Today</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md border">
            <Icon icon="circle" className="w-2.5 h-2.5 text-green-500 fill-green-500" />
            Live — Updates on filter change
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="px-6 pb-4 grid grid-cols-4 gap-3">
        <div className="bg-card rounded-lg border px-4 py-3 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-muted-foreground">Total Backlog</span>
          <span className="text-2xl font-bold">{totalBacklog.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">prescriptions pending</span>
        </div>
        <div className="bg-card rounded-lg border px-4 py-3 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-muted-foreground">Est. Hours to Clear</span>
          <span className="text-2xl font-bold">{totalEstHours}</span>
          <span className="text-xs text-muted-foreground">at current throughput</span>
        </div>
        <div className="bg-card rounded-lg border px-4 py-3 flex flex-col gap-1 shadow-sm">
          <span className="text-xs text-muted-foreground">Active Locations</span>
          <span className="text-2xl font-bold">{LOCATIONS.filter((l) => filteredLocIds.includes(l.id) && l.operatingStatus === "Active").length}</span>
          <span className="text-xs text-muted-foreground">of {filteredLocIds.length} in filter</span>
        </div>
        <div className={`bg-card rounded-lg border px-4 py-3 flex flex-col gap-1 shadow-sm ${topConstraints.filter((c) => c.critical > 0).length > 0 ? "border-red-300 bg-red-50/40" : ""}`}>
          <span className="text-xs text-muted-foreground">Critical Constraints</span>
          <span className={`text-2xl font-bold ${topConstraints.filter((c) => c.critical > 0).length > 0 ? "text-red-700" : ""}`}>
            {topConstraints.filter((c) => c.critical > 0).length}
          </span>
          <span className="text-xs text-muted-foreground">locations with critical issues</span>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="px-6 pb-4 grid grid-cols-2 gap-4">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Hourly Prescription Volume (Today)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} width={40} />
                <Tooltip />
                <Bar dataKey="volume" fill="#946E24" radius={[2, 2, 0, 0]} name="Prescriptions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Volume by Service Type (Today)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={serviceTypeVolume} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={105} />
                <Tooltip />
                <Bar dataKey="volume" radius={[0, 3, 3, 0]} name="Volume">
                  {serviceTypeVolume.map((entry) => (
                    <Cell key={entry.name} fill={SERVICE_COLORS[entry.name] ?? "#946E24"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="px-6 pb-4 grid grid-cols-2 gap-4">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Avg Processing Time by Workflow Stage (min)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={workflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="avgTime" fill="#9b59b6" radius={[3, 3, 0, 0]} name="Avg Time (min)">
                  {workflowData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.avgTime > 10 ? "#e74c3c" : entry.avgTime > 6 ? "#f39c12" : "#10a37f"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-0 pt-0">
            <CardTitle className="text-sm font-semibold">Current Backlog by Location</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={backlogData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={(v: number) => [v, "Pending Rx"]} />
                <Bar dataKey="backlog" fill="#e67e22" radius={[0, 3, 3, 0]} name="Backlog" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location comparison table */}
      <div className="px-6 pb-6">
        <Card className="gap-2 py-4">
          <CardHeader className="px-4 pb-2 pt-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Location Comparison — Click a Row to View Detail</CardTitle>
              <span className="text-xs text-muted-foreground">Compared to 7-day average</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Location</th>
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Status</th>
                    <th className="text-right py-2 pr-3 font-semibold text-muted-foreground">Volume</th>
                    <th className="text-right py-2 pr-3 font-semibold text-muted-foreground">Backlog</th>
                    <th className="text-right py-2 pr-3 font-semibold text-muted-foreground">TAT</th>
                    <th className="text-right py-2 pr-3 font-semibold text-muted-foreground">vs 7d</th>
                    <th className="text-right py-2 pr-3 font-semibold text-muted-foreground">Svc %</th>
                    <th className="text-right py-2 font-semibold text-muted-foreground">vs 7d</th>
                  </tr>
                </thead>
                <tbody>
                  {locationComparison.map((loc) => {
                    const locInfo = LOCATIONS.find((l) => l.id === loc.id);
                    return (
                      <tr
                        key={loc.id}
                        className="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => handleLocationClick(loc.id)}
                      >
                        <td className="py-2 pr-3 font-medium text-foreground">{locInfo?.name}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{locInfo?.pharmacyType}</td>
                        <td className="py-2 pr-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${locInfo?.operatingStatus === "Active" ? "bg-green-100 text-green-800" : locInfo?.operatingStatus === "Limited" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"}`}>
                            {locInfo?.operatingStatus}
                          </span>
                        </td>
                        <td className="text-right py-2 pr-3">{loc.volume.toLocaleString()}</td>
                        <td className={`text-right py-2 pr-3 ${loc.backlog > 40 ? "text-red-600 font-semibold" : loc.backlog > 25 ? "text-amber-600" : ""}`}>
                          {loc.backlog}
                        </td>
                        <td className={`text-right py-2 pr-3 font-medium ${loc.tat > 45 ? "text-red-600" : loc.tat > 35 ? "text-amber-600" : "text-green-700"}`}>
                          {loc.tat}m
                        </td>
                        <td className={`text-right py-2 pr-3 ${loc.tatChange > 0 ? "text-red-600" : loc.tatChange < 0 ? "text-green-700" : "text-muted-foreground"}`}>
                          {loc.tatChange > 0 ? "+" : ""}{loc.tatChange}m
                        </td>
                        <td className={`text-right py-2 pr-3 font-medium ${loc.serviceLevelPct >= 90 ? "text-green-700" : loc.serviceLevelPct >= 80 ? "text-amber-600" : "text-red-600"}`}>
                          {loc.serviceLevelPct}%
                        </td>
                        <td className={`text-right py-2 ${loc.svcChange > 0 ? "text-green-700" : loc.svcChange < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                          {loc.svcChange > 0 ? "+" : ""}{loc.svcChange}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
