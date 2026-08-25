/**
 * Shipping & Licensing Intelligence — synthetic data module.
 * Provides state licensing, volume, cost, and optimization data per location.
 */

import { LOCATIONS } from "./locations.js";

// All 50 US states + DC
export const US_STATES: { code: string; name: string; lat: number; lng: number }[] = [
  { code: "AL", name: "Alabama", lat: 32.8, lng: -86.8 },
  { code: "AK", name: "Alaska", lat: 64.2, lng: -152.5 },
  { code: "AZ", name: "Arizona", lat: 34.0, lng: -111.1 },
  { code: "AR", name: "Arkansas", lat: 35.0, lng: -92.4 },
  { code: "CA", name: "California", lat: 36.8, lng: -119.4 },
  { code: "CO", name: "Colorado", lat: 39.1, lng: -105.4 },
  { code: "CT", name: "Connecticut", lat: 41.6, lng: -72.7 },
  { code: "DE", name: "Delaware", lat: 38.9, lng: -75.5 },
  { code: "FL", name: "Florida", lat: 27.8, lng: -81.7 },
  { code: "GA", name: "Georgia", lat: 32.7, lng: -83.5 },
  { code: "HI", name: "Hawaii", lat: 19.9, lng: -155.6 },
  { code: "ID", name: "Idaho", lat: 44.2, lng: -114.4 },
  { code: "IL", name: "Illinois", lat: 40.3, lng: -89.0 },
  { code: "IN", name: "Indiana", lat: 40.3, lng: -86.1 },
  { code: "IA", name: "Iowa", lat: 41.9, lng: -93.1 },
  { code: "KS", name: "Kansas", lat: 38.5, lng: -98.8 },
  { code: "KY", name: "Kentucky", lat: 37.8, lng: -84.3 },
  { code: "LA", name: "Louisiana", lat: 30.5, lng: -91.9 },
  { code: "ME", name: "Maine", lat: 45.3, lng: -69.4 },
  { code: "MD", name: "Maryland", lat: 39.0, lng: -76.6 },
  { code: "MA", name: "Massachusetts", lat: 42.4, lng: -71.4 },
  { code: "MI", name: "Michigan", lat: 43.3, lng: -84.5 },
  { code: "MN", name: "Minnesota", lat: 46.4, lng: -94.6 },
  { code: "MS", name: "Mississippi", lat: 32.3, lng: -89.4 },
  { code: "MO", name: "Missouri", lat: 38.6, lng: -92.6 },
  { code: "MT", name: "Montana", lat: 46.8, lng: -110.4 },
  { code: "NE", name: "Nebraska", lat: 41.1, lng: -98.3 },
  { code: "NV", name: "Nevada", lat: 38.8, lng: -116.4 },
  { code: "NH", name: "New Hampshire", lat: 43.5, lng: -71.6 },
  { code: "NJ", name: "New Jersey", lat: 40.1, lng: -74.5 },
  { code: "NM", name: "New Mexico", lat: 34.8, lng: -106.2 },
  { code: "NY", name: "New York", lat: 43.3, lng: -74.9 },
  { code: "NC", name: "North Carolina", lat: 35.6, lng: -79.8 },
  { code: "ND", name: "North Dakota", lat: 47.5, lng: -100.5 },
  { code: "OH", name: "Ohio", lat: 40.4, lng: -82.9 },
  { code: "OK", name: "Oklahoma", lat: 35.0, lng: -97.1 },
  { code: "OR", name: "Oregon", lat: 43.8, lng: -120.6 },
  { code: "PA", name: "Pennsylvania", lat: 41.2, lng: -77.2 },
  { code: "RI", name: "Rhode Island", lat: 41.7, lng: -71.5 },
  { code: "SC", name: "South Carolina", lat: 33.8, lng: -81.2 },
  { code: "SD", name: "South Dakota", lat: 43.9, lng: -99.9 },
  { code: "TN", name: "Tennessee", lat: 36.2, lng: -86.6 },
  { code: "TX", name: "Texas", lat: 31.1, lng: -97.6 },
  { code: "UT", name: "Utah", lat: 39.3, lng: -111.1 },
  { code: "VT", name: "Vermont", lat: 44.0, lng: -72.7 },
  { code: "VA", name: "Virginia", lat: 37.8, lng: -78.2 },
  { code: "WA", name: "Washington", lat: 47.4, lng: -120.7 },
  { code: "WV", name: "West Virginia", lat: 38.5, lng: -80.5 },
  { code: "WI", name: "Wisconsin", lat: 43.8, lng: -89.5 },
  { code: "WY", name: "Wyoming", lat: 43.1, lng: -107.6 },
  { code: "DC", name: "District of Columbia", lat: 38.9, lng: -77.0 },
];

// Simulated geographic coordinates for each location (for distance-based cost)
const LOCATION_COORDS: Record<string, { lat: number; lng: number; state: string }> = {
  "loc-01": { lat: 40.7, lng: -74.0, state: "NJ" },    // Meridian Health Main Campus (NE)
  "loc-02": { lat: 33.4, lng: -84.4, state: "GA" },    // Riverside Medical Center (SE)
  "loc-03": { lat: 42.4, lng: -71.1, state: "MA" },    // Northgate Specialty (NE)
  "loc-04": { lat: 41.9, lng: -87.6, state: "IL" },    // Westfield Central Fill (MW)
  "loc-05": { lat: 29.8, lng: -95.4, state: "TX" },    // Lakewood Outpatient (SW)
  "loc-06": { lat: 45.5, lng: -122.7, state: "OR" },   // Summit Health (NW)
  "loc-07": { lat: 36.2, lng: -86.8, state: "TN" },    // Brookdale Community (SE)
  "loc-08": { lat: 34.1, lng: -118.2, state: "CA" },   // Cedar Valley (W)
  "loc-09": { lat: 39.1, lng: -76.6, state: "MD" },    // Heritage Transplant (NE)
  "loc-10": { lat: 25.8, lng: -80.2, state: "FL" },    // Pinecrest Mail-Order (SE)
  "loc-11": { lat: 39.7, lng: -104.9, state: "CO" },   // Mountain View (W)
  "loc-12": { lat: 35.8, lng: -78.6, state: "NC" },    // Clearwater Regional (SE)
};

// Seeded random for determinism
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Generate state licenses for each location (8–25 states, biased toward nearby states)
function generateLicenses(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const stateCodes = US_STATES.map((s) => s.code);

  LOCATIONS.forEach((loc, locIdx) => {
    const rng = seededRandom(locIdx * 1000 + 42);
    const coords = LOCATION_COORDS[loc.id];
    if (!coords) { result[loc.id] = []; return; }

    // Always licensed in home state
    const licensed = new Set<string>([coords.state]);

    // Sort states by distance, then pick nearby ones first
    const sortedStates = [...US_STATES]
      .filter((s) => s.code !== coords.state)
      .map((s) => ({
        code: s.code,
        dist: Math.sqrt((s.lat - coords.lat) ** 2 + (s.lng - coords.lng) ** 2),
      }))
      .sort((a, b) => a.dist - b.dist);

    // Pick 8–25 states total, heavily biased toward nearby ones
    const targetCount = Math.floor(rng() * 18) + 8;
    for (let i = 0; i < sortedStates.length && licensed.size < targetCount; i++) {
      // High probability for nearby, lower for far
      const prob = i < 10 ? 0.85 : i < 20 ? 0.55 : 0.25;
      if (rng() < prob) licensed.add(sortedStates[i].code);
    }

    result[loc.id] = Array.from(licensed);
  });

  return result;
}

export const STATE_LICENSES = generateLicenses();

// Distance in "shipping units" between a location and a state centroid
function calcDistance(locId: string, stateCode: string): number {
  const lCoords = LOCATION_COORDS[locId];
  const sCoords = US_STATES.find((s) => s.code === stateCode);
  if (!lCoords || !sCoords) return 50;
  return Math.sqrt((lCoords.lat - sCoords.lat) ** 2 + (lCoords.lng - sCoords.lng) ** 2);
}

// Shipping cost model: base $4.50 + $0.18/distance unit
function shippingCost(locId: string, stateCode: string): number {
  const dist = calcDistance(locId, stateCode);
  return Math.round((4.5 + dist * 0.18) * 100) / 100;
}

// Transit time model: 1 day + 0.08 days per distance unit (capped 1–7)
function transitDays(locId: string, stateCode: string): number {
  const dist = calcDistance(locId, stateCode);
  return Math.min(7, Math.max(1, Math.round(1 + dist * 0.08)));
}

// Sales periods
export type SalesPeriod = { label: string; key: string; months: number[] };

export const SALES_PERIODS: SalesPeriod[] = [
  // Monthly
  { label: "Jan 2026", key: "2026-01", months: [1] },
  { label: "Feb 2026", key: "2026-02", months: [2] },
  { label: "Mar 2026", key: "2026-03", months: [3] },
  { label: "Apr 2026", key: "2026-04", months: [4] },
  { label: "May 2026", key: "2026-05", months: [5] },
  { label: "Jun 2026", key: "2026-06", months: [6] },
  { label: "Jul 2026", key: "2026-07", months: [7] },
  { label: "Aug 2026", key: "2026-08", months: [8] },
  { label: "Sep 2026", key: "2026-09", months: [9] },
  { label: "Oct 2026", key: "2026-10", months: [10] },
  { label: "Nov 2026", key: "2026-11", months: [11] },
  { label: "Dec 2026", key: "2026-12", months: [12] },
  // Quarterly
  { label: "Q1 2026", key: "2026-Q1", months: [1, 2, 3] },
  { label: "Q2 2026", key: "2026-Q2", months: [4, 5, 6] },
  { label: "Q3 2026", key: "2026-Q3", months: [7, 8, 9] },
  { label: "Q4 2026", key: "2026-Q4", months: [10, 11, 12] },
];

// Generate volumes: each location×state×month has a volume (or 0 if not licensed)
function generateVolumes(): Record<string, Record<string, number[]>> {
  // result[locId][stateCode] = array of 12 monthly volumes
  const result: Record<string, Record<string, number[]>> = {};

  LOCATIONS.forEach((loc, locIdx) => {
    const rng = seededRandom(locIdx * 5000 + 7);
    const licenses = STATE_LICENSES[loc.id] ?? [];
    const stateVols: Record<string, number[]> = {};

    licenses.forEach((stateCode) => {
      const dist = calcDistance(loc.id, stateCode);
      // Base volume inversely proportional to distance + some randomness
      const baseVol = Math.max(5, Math.round(300 / (1 + dist * 0.1) + rng() * 80));
      const months: number[] = [];
      for (let m = 0; m < 12; m++) {
        // Seasonal variance ±20%
        const seasonal = 1 + 0.2 * Math.sin((m / 12) * Math.PI * 2 - Math.PI / 2);
        months.push(Math.max(1, Math.round(baseVol * seasonal * (0.8 + rng() * 0.4))));
      }
      stateVols[stateCode] = months;
    });

    result[loc.id] = stateVols;
  });

  return result;
}

const VOLUMES = generateVolumes();

export interface StateShippingData {
  stateCode: string;
  stateName: string;
  licensed: boolean;
  volume: number;
  costPerRx: number;
  totalCost: number;
  transitDays: number;
  hasBetterOption: boolean;
  bestAlternativeLocId: string | null;
  bestAlternativeCost: number | null;
  bestAlternativeTransit: number | null;
  savingsPerRx: number;
  savingsTotal: number;
}

export interface OptimizationRecommendation {
  stateCode: string;
  stateName: string;
  currentLocId: string;
  currentLocName: string;
  recommendedLocId: string;
  recommendedLocName: string;
  currentCostPerRx: number;
  recommendedCostPerRx: number;
  savingsPerRx: number;
  currentTransitDays: number;
  recommendedTransitDays: number;
  transitReduction: number;
  monthlyVolume: number;
  monthlySavings: number;
}

export function getStateDataForLocation(locId: string, periodKey: string): StateShippingData[] {
  const period = SALES_PERIODS.find((p) => p.key === periodKey);
  if (!period) return [];

  const licenses = STATE_LICENSES[locId] ?? [];
  const locVols = VOLUMES[locId] ?? {};

  return US_STATES.map((state) => {
    const licensed = licenses.includes(state.code);
    // Sum volumes for the selected period months
    const monthlyVols = locVols[state.code] ?? [];
    const volume = licensed
      ? period.months.reduce((sum, m) => sum + (monthlyVols[m - 1] ?? 0), 0)
      : 0;
    const cost = shippingCost(locId, state.code);
    const transit = transitDays(locId, state.code);
    const totalCost = Math.round(volume * cost * 100) / 100;

    // Find better option: another location that is licensed in this state and closer
    let bestAltLocId: string | null = null;
    let bestAltCost: number | null = null;
    let bestAltTransit: number | null = null;

    if (licensed && volume > 0) {
      LOCATIONS.forEach((otherLoc) => {
        if (otherLoc.id === locId) return;
        const otherLicenses = STATE_LICENSES[otherLoc.id] ?? [];
        if (!otherLicenses.includes(state.code)) return;
        const otherCost = shippingCost(otherLoc.id, state.code);
        if (otherCost < cost && (bestAltCost === null || otherCost < bestAltCost)) {
          bestAltLocId = otherLoc.id;
          bestAltCost = otherCost;
          bestAltTransit = transitDays(otherLoc.id, state.code);
        }
      });
    }

    const hasBetterOption = bestAltLocId !== null && bestAltCost !== null && (cost - bestAltCost) > 0.50;
    const savingsPerRx = hasBetterOption && bestAltCost !== null ? Math.round((cost - bestAltCost) * 100) / 100 : 0;
    const savingsTotal = Math.round(savingsPerRx * volume * 100) / 100;

    return {
      stateCode: state.code,
      stateName: state.name,
      licensed,
      volume,
      costPerRx: cost,
      totalCost,
      transitDays: transit,
      hasBetterOption,
      bestAlternativeLocId: hasBetterOption ? bestAltLocId : null,
      bestAlternativeCost: hasBetterOption ? bestAltCost : null,
      bestAlternativeTransit: hasBetterOption ? bestAltTransit : null,
      savingsPerRx,
      savingsTotal,
    };
  });
}

export function getOptimizationRecommendations(locId: string, periodKey: string): OptimizationRecommendation[] {
  const stateData = getStateDataForLocation(locId, periodKey);
  const currentLoc = LOCATIONS.find((l) => l.id === locId);

  return stateData
    .filter((s) => s.hasBetterOption && s.bestAlternativeLocId)
    .map((s) => {
      const recLoc = LOCATIONS.find((l) => l.id === s.bestAlternativeLocId);
      return {
        stateCode: s.stateCode,
        stateName: s.stateName,
        currentLocId: locId,
        currentLocName: currentLoc?.name ?? locId,
        recommendedLocId: s.bestAlternativeLocId!,
        recommendedLocName: recLoc?.name ?? s.bestAlternativeLocId!,
        currentCostPerRx: s.costPerRx,
        recommendedCostPerRx: s.bestAlternativeCost!,
        savingsPerRx: s.savingsPerRx,
        currentTransitDays: s.transitDays,
        recommendedTransitDays: s.bestAlternativeTransit!,
        transitReduction: s.transitDays - (s.bestAlternativeTransit ?? s.transitDays),
        monthlyVolume: s.volume,
        monthlySavings: s.savingsTotal,
      };
    })
    .sort((a, b) => b.monthlySavings - a.monthlySavings);
}

export function getLocationCoords(locId: string) {
  return LOCATION_COORDS[locId] ?? null;
}
