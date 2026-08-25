import { useState, useMemo, useCallback } from "react";
import {
  ComposableMap, Geographies, Geography, Annotation,
} from "react-simple-maps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/data/locations";
import {
  SALES_PERIODS, getStateDataForLocation, getOptimizationRecommendations,
  US_STATES, STATE_LICENSES, getLocationCoords,
  type StateShippingData, type OptimizationRecommendation,
} from "@/data/shipping";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS code to state abbreviation mapping
const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

function volumeColor(volume: number, maxVol: number): string {
  if (volume === 0) return "#e5e7eb";
  const pct = Math.min(volume / Math.max(maxVol, 1), 1);
  // Blue gradient: lighter to deeper
  const lightness = Math.round(92 - pct * 50);
  return `hsl(215, 70%, ${lightness}%)`;
}

export default function ShippingLicensing() {
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].id);
  const [selectedPeriod, setSelectedPeriod] = useState("2026-Q3");
  const [showVolumes, setShowVolumes] = useState(true);
  const [recsExpanded, setRecsExpanded] = useState(true);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const stateData = useMemo(
    () => getStateDataForLocation(selectedLocation, selectedPeriod),
    [selectedLocation, selectedPeriod]
  );

  const recommendations = useMemo(
    () => getOptimizationRecommendations(selectedLocation, selectedPeriod),
    [selectedLocation, selectedPeriod]
  );

  const stateDataMap = useMemo(() => {
    const m: Record<string, StateShippingData> = {};
    stateData.forEach((s) => { m[s.stateCode] = s; });
    return m;
  }, [stateData]);

  const maxVolume = useMemo(
    () => Math.max(...stateData.map((s) => s.volume), 1),
    [stateData]
  );

  const licensedStates = useMemo(
    () => STATE_LICENSES[selectedLocation] ?? [],
    [selectedLocation]
  );

  const locationHomeState = useMemo(() => {
    const coords = getLocationCoords(selectedLocation);
    return coords?.state ?? "—";
  }, [selectedLocation]);

  const topRecommendation = useMemo(() => {
    if (recommendations.length === 0) return null;
    return recommendations[0]; // Already sorted by monthlySavings desc
  }, [recommendations]);

  const totalVolume = useMemo(() => stateData.reduce((s, d) => s + d.volume, 0), [stateData]);
  const totalShippingCost = useMemo(() => stateData.reduce((s, d) => s + d.totalCost, 0), [stateData]);
  const totalPotentialSavings = useMemo(() => recommendations.reduce((s, r) => s + r.monthlySavings, 0), [recommendations]);
  const avgCostPerRx = totalVolume > 0 ? totalShippingCost / totalVolume : 0;

  const hoveredData = hoveredState ? stateDataMap[hoveredState] : null;

  const handleLocationChange = useCallback((v: string) => setSelectedLocation(v), []);
  const handlePeriodChange = useCallback((v: string) => setSelectedPeriod(v), []);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b bg-background">
        <h1 className="text-xl font-bold text-foreground">Shipping & Licensing Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          State licensing, shipping volumes, cost analysis, and optimization recommendations
        </p>
      </div>

      <div className="flex-1 px-6 py-5 space-y-5">
        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Pharmacy Location</Label>
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
              <SelectTrigger className="h-9 text-xs w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => {
                  const st = getLocationCoords(l.id)?.state ?? "";
                  return (
                    <SelectItem key={l.id} value={l.id} className="text-xs">{l.name} — {st}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-0.5">Home state: <span className="font-semibold text-foreground">{locationHomeState}</span></p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Sales Period</Label>
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="h-9 text-xs w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="header-q" disabled className="text-xs font-semibold text-muted-foreground">Quarterly</SelectItem>
                {SALES_PERIODS.filter((p) => p.key.includes("Q")).map((p) => (
                  <SelectItem key={p.key} value={p.key} className="text-xs">{p.label}</SelectItem>
                ))}
                <SelectItem value="header-m" disabled className="text-xs font-semibold text-muted-foreground">Monthly</SelectItem>
                {SALES_PERIODS.filter((p) => !p.key.includes("Q")).map((p) => (
                  <SelectItem key={p.key} value={p.key} className="text-xs">{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch id="vol-toggle" checked={showVolumes} onCheckedChange={setShowVolumes} />
            <Label htmlFor="vol-toggle" className="text-xs cursor-pointer">Show Volumes</Label>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiMini label="Licensed States" value={licensedStates.length} suffix="/ 51" />
          <KpiMini label="Total Rx Volume" value={totalVolume.toLocaleString()} />
          <KpiMini label="Total Shipping Cost" value={`$${totalShippingCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
          <KpiMini label="Avg Cost / Rx" value={`$${avgCostPerRx.toFixed(2)}`} />
          <KpiMini
            label="Potential Savings"
            value={`$${totalPotentialSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            highlight={totalPotentialSavings > 0}
          />
        </div>

        {/* Top Savings Recommendation */}
        {topRecommendation ? (
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
            <Icon icon="trending-down" className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-900">Top Savings Opportunity</p>
              <p className="text-xs text-orange-800 mt-0.5">
                Move <span className="font-semibold">{topRecommendation.monthlyVolume.toLocaleString()} Rx</span> for
                <span className="font-semibold"> {topRecommendation.stateName} ({topRecommendation.stateCode})</span> to
                <span className="font-semibold"> {topRecommendation.recommendedLocName}</span>
              </p>
              <div className="flex flex-wrap gap-4 mt-1.5 text-xs">
                <span className="text-orange-700">Savings/Rx: <span className="font-bold text-green-700">${topRecommendation.savingsPerRx.toFixed(2)}</span></span>
                <span className="text-orange-700">Period Savings: <span className="font-bold text-green-700">${topRecommendation.monthlySavings.toLocaleString()}</span></span>
                <span className="text-orange-700">Transit Reduction: <span className="font-bold text-amber-800">{topRecommendation.transitReduction > 0 ? `-${topRecommendation.transitReduction} days` : "—"}</span></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Icon icon="check-circle" className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-800 font-medium">Fully optimized — this location is the best option for all its licensed states.</p>
          </div>
        )}

        {/* Map */}
        <Card>
          <CardContent className="p-0 relative">
            <ComposableMap projection="geoAlbersUsa" className="w-full h-auto" style={{ maxHeight: 480 }}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const fips = geo.id as string;
                    const stateCode = FIPS_TO_STATE[fips];
                    if (!stateCode) return null;
                    const sd = stateDataMap[stateCode];
                    const isLicensed = licensedStates.includes(stateCode);
                    const hasOpt = sd?.hasBetterOption ?? false;

                    let fill = "#f3f4f6"; // unlicensed default
                    if (isLicensed) {
                      fill = showVolumes
                        ? volumeColor(sd?.volume ?? 0, maxVolume)
                        : "#bfdbfe";
                    }

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={hoveredState === stateCode ? "#fbbf24" : fill}
                        stroke={hasOpt ? "#f97316" : isLicensed ? "#3b82f6" : "#d1d5db"}
                        strokeWidth={hasOpt ? 1.5 : 0.5}
                        onMouseEnter={() => setHoveredState(stateCode)}
                        onMouseLeave={() => setHoveredState(null)}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", cursor: "pointer" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              {/* Volume annotations for licensed states with significant volume */}
              {showVolumes && stateData
                .filter((s) => s.licensed && s.volume > maxVolume * 0.15)
                .map((s) => {
                  const coords = US_STATES.find((st) => st.code === s.stateCode);
                  if (!coords) return null;
                  return (
                    <Annotation
                      key={s.stateCode}
                      subject={[coords.lng, coords.lat]}
                      dx={0}
                      dy={0}
                      connectorProps={{}}
                    >
                      <text
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        className="fill-foreground text-[8px] font-semibold pointer-events-none"
                      >
                        {s.volume > 999 ? `${(s.volume / 1000).toFixed(1)}k` : s.volume}
                      </text>
                    </Annotation>
                  );
                })}
            </ComposableMap>

            {/* Hover tooltip */}
            {hoveredData && (
              <div className="absolute top-3 right-3 bg-background border shadow-lg rounded-lg p-3 text-xs min-w-48 z-10">
                <div className="font-semibold text-sm mb-1.5">{hoveredData.stateName} ({hoveredData.stateCode})</div>
                <div className="space-y-0.5 text-muted-foreground">
                  <p>Status: <span className={`font-medium ${hoveredData.licensed ? "text-green-600" : "text-red-500"}`}>
                    {hoveredData.licensed ? "Licensed" : "Not Licensed"}
                  </span></p>
                  {hoveredData.licensed && (
                    <>
                      <p>Volume: <span className="font-medium text-foreground">{hoveredData.volume.toLocaleString()} Rx</span></p>
                      <p>Cost/Rx: <span className="font-medium text-foreground">${hoveredData.costPerRx.toFixed(2)}</span></p>
                      <p>Total Cost: <span className="font-medium text-foreground">${hoveredData.totalCost.toLocaleString()}</span></p>
                      <p>Transit: <span className="font-medium text-foreground">{hoveredData.transitDays} days</span></p>
                      {hoveredData.hasBetterOption && (
                        <p className="text-orange-600 font-medium mt-1">
                          ⚡ Savings opportunity: ${hoveredData.savingsPerRx.toFixed(2)}/Rx
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur border rounded px-3 py-2 text-[10px] space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border" style={{ background: "#bfdbfe", borderColor: "#3b82f6" }} />
                <span>Licensed (low volume)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border" style={{ background: "hsl(215, 70%, 52%)", borderColor: "#3b82f6" }} />
                <span>Licensed (high volume)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border" style={{ background: "#f3f4f6", borderColor: "#d1d5db" }} />
                <span>Not Licensed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#f3f4f6", border: "2px solid #f97316" }} />
                <span className="text-orange-600 font-medium">Savings opportunity</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Recommendations */}
        <Card>
          <CardHeader className="pb-2 cursor-pointer" onClick={() => setRecsExpanded((v) => !v)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="lightbulb" className="w-4 h-4 text-orange-500" />
                Optimization Recommendations
                {recommendations.length > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                    {recommendations.length} opportunities
                  </span>
                )}
              </CardTitle>
              <Icon icon={recsExpanded ? "chevron-up" : "chevron-down"} className="w-4 h-4 text-muted-foreground" />
            </div>
            {totalPotentialSavings > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Estimated annual savings if all recommendations adopted: <span className="font-semibold text-green-600">${(totalPotentialSavings * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </p>
            )}
          </CardHeader>
          {recsExpanded && (
            <CardContent className="pt-0 pb-4">
              {recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  <Icon icon="check-circle" className="w-5 h-5 inline mr-1.5 text-green-500" />
                  No optimization opportunities — this location is already the most cost-effective option for all its licensed states.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-2 py-2 font-semibold text-muted-foreground">State</th>
                        <th className="text-left px-2 py-2 font-semibold text-muted-foreground">Recommended Facility</th>
                        <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Current Cost</th>
                        <th className="text-right px-2 py-2 font-semibold text-muted-foreground">New Cost</th>
                        <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Savings/Rx</th>
                        <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Transit Δ</th>
                        <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Volume</th>
                        <th className="text-right px-2 py-2 font-semibold text-muted-foreground">Period Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((rec) => (
                        <tr key={rec.stateCode} className="border-b border-border/50 hover:bg-accent/30">
                          <td className="px-2 py-2 font-medium">{rec.stateName} ({rec.stateCode})</td>
                          <td className="px-2 py-2 text-muted-foreground max-w-[160px] truncate" title={rec.recommendedLocName}>
                            {rec.recommendedLocName}
                          </td>
                          <td className="px-2 py-2 text-right">${rec.currentCostPerRx.toFixed(2)}</td>
                          <td className="px-2 py-2 text-right text-green-600 font-medium">${rec.recommendedCostPerRx.toFixed(2)}</td>
                          <td className="px-2 py-2 text-right text-green-600 font-semibold">${rec.savingsPerRx.toFixed(2)}</td>
                          <td className="px-2 py-2 text-right text-amber-700">
                            {rec.transitReduction > 0 ? `-${rec.transitReduction}d` : "—"}
                          </td>
                          <td className="px-2 py-2 text-right">{rec.monthlyVolume.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right font-semibold text-green-700">${rec.monthlySavings.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30">
                        <td colSpan={6} className="px-2 py-2 font-semibold text-right">Total Period Savings:</td>
                        <td className="px-2 py-2 text-right font-medium">{recommendations.reduce((s, r) => s + r.monthlyVolume, 0).toLocaleString()}</td>
                        <td className="px-2 py-2 text-right font-bold text-green-700">${totalPotentialSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

// Small KPI component for this page
function KpiMini({ label, value, suffix, highlight }: { label: string; value: string | number; suffix?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${highlight ? "border-green-300 bg-green-50/50" : "bg-background"}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-green-700" : "text-foreground"}`}>
        {value}
        {suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
