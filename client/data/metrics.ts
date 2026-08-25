import type { DailyMetric, HourlyMetric, WorkflowStageMetric } from "./types.js";
import { LOCATIONS } from "./locations.js";

// Generate 30 days of daily metrics for each location
function generateDailyMetrics(): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const today = new Date();

  const baseVolumeByLocation: Record<string, number> = {
    "loc-01": 420, "loc-02": 310, "loc-03": 180, "loc-04": 550,
    "loc-05": 95, "loc-06": 75, "loc-07": 280, "loc-08": 140,
    "loc-09": 260, "loc-10": 60, "loc-11": 155, "loc-12": 130,
  };

  const baseTurnaroundByLocation: Record<string, number> = {
    "loc-01": 38, "loc-02": 29, "loc-03": 52, "loc-04": 24,
    "loc-05": 18, "loc-06": 61, "loc-07": 44, "loc-08": 21,
    "loc-09": 33, "loc-10": 58, "loc-11": 48, "loc-12": 26,
  };

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split("T")[0];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    for (const loc of LOCATIONS) {
      const baseVol = baseVolumeByLocation[loc.id] ?? 200;
      const baseTAT = baseTurnaroundByLocation[loc.id] ?? 35;

      // Add realistic variance + weekend reduction
      const dayFactor = isWeekend ? 0.65 : 1.0;
      const randomFactor = 0.85 + Math.random() * 0.3;
      const trendFactor = 1 + (29 - daysAgo) * 0.002; // slight growth trend

      // Technology outage scenario: loc-04 had issues 7-9 days ago
      const outageImpact = loc.id === "loc-04" && daysAgo >= 7 && daysAgo <= 9 ? 0.4 : 1.0;
      // Staffing shortage: loc-01 past 3 days
      const staffingImpact = loc.id === "loc-01" && daysAgo <= 2 ? 0.75 : 1.0;

      const vol = Math.round(baseVol * dayFactor * randomFactor * trendFactor * outageImpact * staffingImpact);
      const tat = Math.round(baseTAT * (1 / randomFactor) * (1 / outageImpact) * (daysAgo <= 2 && loc.id === "loc-01" ? 1.4 : 1.0));

      // Service level drops when TAT is high or during outage
      const svcLevel = Math.min(99, Math.max(55, 97 - Math.max(0, tat - 35) * 0.8 - (outageImpact < 1 ? 15 : 0)));
      const openExceptions = Math.round((5 + Math.random() * 8) * (outageImpact < 1 ? 3 : 1) * (staffingImpact < 1 ? 1.5 : 1));
      const delayed = Math.round(vol * (1 - svcLevel / 100) * 1.2);

      metrics.push({
        date: dateStr,
        locationId: loc.id,
        prescriptionVolume: vol,
        averageTurnaroundMinutes: tat,
        openExceptionCount: openExceptions,
        serviceLevelPct: Math.round(svcLevel),
        delayedPrescriptions: delayed,
        resolvedExceptions: Math.max(0, openExceptions - Math.round(Math.random() * 3)),
        criticalExceptions: loc.id === "loc-01" && daysAgo <= 2 ? 3 : loc.id === "loc-04" && daysAgo <= 5 ? 2 : Math.round(Math.random() * 1.2),
      });
    }
  }
  return metrics;
}

// Today's hourly metrics
function generateHourlyMetrics(): HourlyMetric[] {
  const metrics: HourlyMetric[] = [];
  const today = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours();

  const baseByHour: Record<number, number> = {
    0: 0.02, 1: 0.01, 2: 0.01, 3: 0.01, 4: 0.02, 5: 0.04,
    6: 0.08, 7: 0.14, 8: 0.18, 9: 0.22, 10: 0.24, 11: 0.26,
    12: 0.18, 13: 0.22, 14: 0.24, 15: 0.20, 16: 0.16, 17: 0.12,
    18: 0.08, 19: 0.06, 20: 0.04, 21: 0.03, 22: 0.02, 23: 0.02,
  };

  for (const loc of LOCATIONS) {
    const dailyBase: Record<string, number> = {
      "loc-01": 420, "loc-02": 310, "loc-03": 180, "loc-04": 550,
      "loc-05": 95, "loc-06": 75, "loc-07": 280, "loc-08": 140,
      "loc-09": 260, "loc-10": 60, "loc-11": 155, "loc-12": 130,
    };

    for (let h = 0; h < Math.min(currentHour + 1, 24); h++) {
      const base = dailyBase[loc.id] ?? 200;
      const hourFactor = baseByHour[h] ?? 0.05;
      const vol = Math.round(base * hourFactor * (0.9 + Math.random() * 0.2));
      metrics.push({ hour: h, locationId: loc.id, date: today, prescriptionVolume: vol });
    }
  }
  return metrics;
}

function generateWorkflowMetrics(): WorkflowStageMetric[] {
  const stages: WorkflowStageMetric["stage"][] = [
    "Intake", "Data Entry", "Insurance Processing", "Pharmacist Verification",
    "Filling", "Packing", "Final Verification", "Ready for Pickup", "Shipped"
  ];
  const avgTimes: Record<string, number> = {
    "Intake": 3, "Data Entry": 5, "Insurance Processing": 12,
    "Pharmacist Verification": 8, "Filling": 6, "Packing": 4,
    "Final Verification": 4, "Ready for Pickup": 0, "Shipped": 0,
  };
  const counts: Record<string, number> = {
    "Intake": 45, "Data Entry": 38, "Insurance Processing": 62,
    "Pharmacist Verification": 29, "Filling": 51, "Packing": 24,
    "Final Verification": 19, "Ready for Pickup": 87, "Shipped": 143,
  };

  const metrics: WorkflowStageMetric[] = [];
  for (const loc of LOCATIONS) {
    for (const stage of stages) {
      const locFactor = 0.4 + Math.random() * 1.2;
      // Tech outage inflates Insurance Processing for loc-04
      const outageFactor = loc.id === "loc-04" && stage === "Insurance Processing" ? 2.8 : 1.0;
      metrics.push({
        locationId: loc.id,
        stage,
        currentCount: Math.round((counts[stage] ?? 20) * locFactor * outageFactor),
        averageProcessingMinutes: Math.round((avgTimes[stage] ?? 5) * (0.7 + Math.random() * 0.6) * outageFactor),
      });
    }
  }
  return metrics;
}

export const DAILY_METRICS = generateDailyMetrics();
export const HOURLY_METRICS = generateHourlyMetrics();
export const WORKFLOW_METRICS = generateWorkflowMetrics();

export function getMetricsForLocation(locationId: string): DailyMetric[] {
  return DAILY_METRICS.filter((m) => m.locationId === locationId);
}

export function getTodayMetrics(locationId?: string): DailyMetric[] {
  const today = new Date().toISOString().split("T")[0];
  return DAILY_METRICS.filter(
    (m) => m.date === today && (!locationId || m.locationId === locationId)
  );
}

export function getAggregatedDailyMetrics(): { date: string; prescriptionVolume: number; openExceptions: number; resolvedExceptions: number; serviceLevelPct: number }[] {
  const byDate: Record<string, { vol: number; exc: number; res: number; svcSum: number; count: number }> = {};
  for (const m of DAILY_METRICS) {
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
}
