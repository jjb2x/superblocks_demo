/**
 * AI Insight Engine
 *
 * Generates dynamic, contextual recommendations based on current KPI values.
 * Simulates an AI advisory system by comparing metrics against targets and
 * producing professional, actionable guidance for pharmacy operations leadership.
 */

export interface KpiSnapshot {
  prescriptionsProcessed: number;
  prescriptionsDelayed: number;
  openExceptions: number;
  criticalExceptions: number;
  avgTurnaroundMin: number;
  serviceLevelPct: number;
  locationsNeedingAttention: number;
  resolvedToday: number;
}

export interface Insight {
  kpiLabel: string;
  icon: string;
  severity: "success" | "warning" | "critical" | "info";
  observation: string;
  recommendation: string;
}

// Targets
const TARGETS = {
  turnaroundMin: 35,
  serviceLevelPct: 95,
  maxDelayed: 150,
  maxOpenExceptions: 60,
  maxCritical: 0,
  maxAttentionLocations: 2,
  minResolvedDaily: 15,
};

export function generateInsights(data: KpiSnapshot): Insight[] {
  const insights: Insight[] = [];

  // 1. Prescriptions Processed
  if (data.prescriptionsProcessed > 2500) {
    insights.push({
      kpiLabel: "Prescriptions Processed Today",
      icon: "pill",
      severity: "success",
      observation: `Volume of ${data.prescriptionsProcessed.toLocaleString()} prescriptions today indicates strong throughput capacity.`,
      recommendation: "Consider reallocating surplus capacity to reduce the delayed queue. Review if high volume correlates with increased error rates in the Exception Queue.",
    });
  } else if (data.prescriptionsProcessed > 1500) {
    insights.push({
      kpiLabel: "Prescriptions Processed Today",
      icon: "pill",
      severity: "info",
      observation: `Processing volume of ${data.prescriptionsProcessed.toLocaleString()} is within the expected daily range for current staffing levels.`,
      recommendation: "Monitor afternoon throughput trends — historically, 60% of volume arrives between 10 AM–2 PM. Ensure break coverage during peak hours to maintain consistent output.",
    });
  } else {
    insights.push({
      kpiLabel: "Prescriptions Processed Today",
      icon: "pill",
      severity: "warning",
      observation: `Volume of ${data.prescriptionsProcessed.toLocaleString()} is below the typical daily average, potentially indicating staffing gaps or system delays.`,
      recommendation: "Investigate whether intake volume is lower than expected (demand-side) or processing is bottlenecked (supply-side). Cross-reference with staffing schedule and any system downtime events.",
    });
  }

  // 2. Prescriptions Delayed
  if (data.prescriptionsDelayed > TARGETS.maxDelayed * 1.5) {
    insights.push({
      kpiLabel: "Prescriptions Currently Delayed",
      icon: "clock",
      severity: "critical",
      observation: `${data.prescriptionsDelayed.toLocaleString()} prescriptions are currently delayed — ${Math.round((data.prescriptionsDelayed / TARGETS.maxDelayed) * 100 - 100)}% above the operational threshold of ${TARGETS.maxDelayed}.`,
      recommendation: "Activate overflow protocols: redeploy verification pharmacists from lower-volume sites, enable remote verification queues, and escalate to Ops Director. Prioritize delayed critical/high-priority scripts to prevent patient safety impacts.",
    });
  } else if (data.prescriptionsDelayed > TARGETS.maxDelayed) {
    insights.push({
      kpiLabel: "Prescriptions Currently Delayed",
      icon: "clock",
      severity: "warning",
      observation: `${data.prescriptionsDelayed.toLocaleString()} delayed prescriptions exceeds the ${TARGETS.maxDelayed} threshold. This backlog risks service-level deterioration if not addressed within the next 2 hours.`,
      recommendation: "Deploy focused sprint processing for the oldest delayed items. Consider temporarily suspending non-urgent workflow tasks (inventory counts, training modules) to redirect staff to clearance.",
    });
  } else {
    insights.push({
      kpiLabel: "Prescriptions Currently Delayed",
      icon: "clock",
      severity: "success",
      observation: `Delayed queue at ${data.prescriptionsDelayed.toLocaleString()} is within the acceptable range (target: <${TARGETS.maxDelayed}).`,
      recommendation: "Maintain current workflow cadence. Use this operational headroom to address any Prior Authorization follow-ups or refill requests awaiting pharmacist review.",
    });
  }

  // 3. Open Exceptions
  if (data.openExceptions > TARGETS.maxOpenExceptions * 1.3) {
    insights.push({
      kpiLabel: "Open Operational Exceptions",
      icon: "alert-triangle",
      severity: "critical",
      observation: `${data.openExceptions} open exceptions is significantly above the target ceiling of ${TARGETS.maxOpenExceptions}. Exception aging will compound if the backlog grows further.`,
      recommendation: "Schedule a targeted exception blitz — allocate 2 senior pharmacists for a focused 90-minute sprint on the oldest open items. Triage by category: resolve Documentation issues first (typically fastest), then escalate Regulatory items to compliance.",
    });
  } else if (data.openExceptions > TARGETS.maxOpenExceptions) {
    insights.push({
      kpiLabel: "Open Operational Exceptions",
      icon: "alert-triangle",
      severity: "warning",
      observation: `${data.openExceptions} open exceptions slightly exceeds the ${TARGETS.maxOpenExceptions} target. The trend should be monitored over the next shift change.`,
      recommendation: "Assign ownership for the top 10 oldest exceptions. Implement a daily stand-up exception review to prevent aging beyond 72 hours. Consider whether recurring categories indicate a systemic process gap.",
    });
  } else {
    insights.push({
      kpiLabel: "Open Operational Exceptions",
      icon: "alert-triangle",
      severity: "success",
      observation: `Open exceptions at ${data.openExceptions} are within the target range — indicating healthy resolution velocity.`,
      recommendation: "Continue current resolution cadence. Use surplus capacity to review recently-resolved exceptions for root cause patterns that could enable preventive workflow changes.",
    });
  }

  // 4. Critical Exceptions
  if (data.criticalExceptions > 3) {
    insights.push({
      kpiLabel: "Critical Exceptions",
      icon: "shield-alert",
      severity: "critical",
      observation: `${data.criticalExceptions} critical exceptions require immediate leadership attention. Each carries potential regulatory, safety, or financial risk exposure.`,
      recommendation: "Initiate Critical Exception Protocol: assign a dedicated pharmacist-in-charge per exception, notify the relevant Site Director, and document interim mitigation actions within 30 minutes. Target zero critical exceptions by end of shift.",
    });
  } else if (data.criticalExceptions > 0) {
    insights.push({
      kpiLabel: "Critical Exceptions",
      icon: "shield-alert",
      severity: "warning",
      observation: `${data.criticalExceptions} critical exception${data.criticalExceptions > 1 ? "s" : ""} detected. While manageable, these must not age beyond the 4-hour SLA.`,
      recommendation: "Verify each critical exception has an assigned owner and documented action plan. Escalate any that have been open >2 hours to the pharmacy operations manager for direct intervention.",
    });
  } else {
    insights.push({
      kpiLabel: "Critical Exceptions",
      icon: "shield-alert",
      severity: "success",
      observation: "Zero critical exceptions — all operations are within safe parameters.",
      recommendation: "Excellent operational posture. Conduct a brief retrospective on how critical exceptions from last week were resolved to reinforce best practices across the team.",
    });
  }

  // 5. Average Turnaround Time
  if (data.avgTurnaroundMin > TARGETS.turnaroundMin * 1.3) {
    insights.push({
      kpiLabel: "Avg Turnaround Time",
      icon: "timer",
      severity: "critical",
      observation: `Average TAT of ${data.avgTurnaroundMin} minutes is ${Math.round(((data.avgTurnaroundMin - TARGETS.turnaroundMin) / TARGETS.turnaroundMin) * 100)}% above the ${TARGETS.turnaroundMin}-minute target. Patient wait times are likely exceeding satisfaction thresholds.`,
      recommendation: "Identify the top 3 bottleneck locations and deploy targeted support. Common drivers: verification queue backups, missing clinical information, or prior-auth pending holds. Consider activating the remote verification pool for the next 2 hours.",
    });
  } else if (data.avgTurnaroundMin > TARGETS.turnaroundMin) {
    insights.push({
      kpiLabel: "Avg Turnaround Time",
      icon: "timer",
      severity: "warning",
      observation: `TAT of ${data.avgTurnaroundMin} minutes exceeds the ${TARGETS.turnaroundMin}-minute target by ${data.avgTurnaroundMin - TARGETS.turnaroundMin} minutes.`,
      recommendation: "Review which step in the fill process is adding latency — data entry, clinical review, or will-call staging. Focus process improvement on the longest-duration step at the 2–3 slowest locations.",
    });
  } else {
    insights.push({
      kpiLabel: "Avg Turnaround Time",
      icon: "timer",
      severity: "success",
      observation: `TAT of ${data.avgTurnaroundMin} minutes is within the ${TARGETS.turnaroundMin}-minute target — operations are running efficiently.`,
      recommendation: "Strong performance. Document current staffing model and workflow sequence as a benchmark. Consider whether this efficiency can be replicated at lower-performing sites.",
    });
  }

  // 6. Service Level %
  if (data.serviceLevelPct < 85) {
    insights.push({
      kpiLabel: "Within Service Target",
      icon: "circle-check-big",
      severity: "critical",
      observation: `Service level at ${data.serviceLevelPct}% is critically below the ${TARGETS.serviceLevelPct}% target. This represents a material gap in patient service delivery.`,
      recommendation: "Escalate to pharmacy leadership immediately. Conduct a rapid root-cause analysis: check for Epic system slowdowns, staffing callouts, or supply chain stockouts. Implement real-time queue monitoring with 15-minute checkpoint reviews until recovery above 90%.",
    });
  } else if (data.serviceLevelPct < TARGETS.serviceLevelPct) {
    insights.push({
      kpiLabel: "Within Service Target",
      icon: "circle-check-big",
      severity: "warning",
      observation: `Service level of ${data.serviceLevelPct}% is ${TARGETS.serviceLevelPct - data.serviceLevelPct} points below the ${TARGETS.serviceLevelPct}% target.`,
      recommendation: "Investigate the trailing locations pulling the average down. Prioritize workflow optimization at sites below 85% — often a single bottleneck (e.g., short-staffed verification) drags the entire metric. Cross-train technicians for verification support.",
    });
  } else {
    insights.push({
      kpiLabel: "Within Service Target",
      icon: "circle-check-big",
      severity: "success",
      observation: `Service level at ${data.serviceLevelPct}% meets or exceeds the ${TARGETS.serviceLevelPct}% target. Patient experience is strong.`,
      recommendation: "Maintain current operational rigor. Consider raising the internal target to 97% to drive continuous improvement and build additional buffer against demand spikes.",
    });
  }

  // 7. Locations Needing Attention
  if (data.locationsNeedingAttention > TARGETS.maxAttentionLocations * 2) {
    insights.push({
      kpiLabel: "Locations Requiring Attention",
      icon: "map-pin",
      severity: "critical",
      observation: `${data.locationsNeedingAttention} locations require attention — this systemic pattern suggests a network-wide issue rather than isolated site problems.`,
      recommendation: "Convene a cross-site operations call to identify common root causes. Check for system-wide issues (Epic interface delays, wholesaler delivery failures, staffing shortages across the region). Prioritize the 2 highest-volume impacted sites for immediate intervention.",
    });
  } else if (data.locationsNeedingAttention > TARGETS.maxAttentionLocations) {
    insights.push({
      kpiLabel: "Locations Requiring Attention",
      icon: "map-pin",
      severity: "warning",
      observation: `${data.locationsNeedingAttention} locations are flagged — slightly above the threshold of ${TARGETS.maxAttentionLocations}.`,
      recommendation: "Review each flagged location's specific issue: is it service-level driven, exception-count driven, or operating-status? Assign site leads to submit corrective action plans within 24 hours.",
    });
  } else {
    insights.push({
      kpiLabel: "Locations Requiring Attention",
      icon: "map-pin",
      severity: "success",
      observation: `Only ${data.locationsNeedingAttention} location${data.locationsNeedingAttention !== 1 ? "s" : ""} require attention — the network is operating healthily.`,
      recommendation: "Good network health. Use this stability window to conduct proactive quality audits at 2–3 high-performing sites to identify and document best practices for broader adoption.",
    });
  }

  // 8. Exceptions Resolved Today
  if (data.resolvedToday >= TARGETS.minResolvedDaily * 2) {
    insights.push({
      kpiLabel: "Exceptions Resolved Today",
      icon: "check-circle",
      severity: "success",
      observation: `${data.resolvedToday} exceptions resolved today indicates excellent resolution velocity — well above the ${TARGETS.minResolvedDaily}/day benchmark.`,
      recommendation: "Outstanding throughput. Recognize the team's effort and investigate what drove the spike — was it a focused blitz, process improvement, or increased staffing? Capture and replicate the approach.",
    });
  } else if (data.resolvedToday >= TARGETS.minResolvedDaily) {
    insights.push({
      kpiLabel: "Exceptions Resolved Today",
      icon: "check-circle",
      severity: "info",
      observation: `${data.resolvedToday} resolutions today is on pace with the ${TARGETS.minResolvedDaily}/day target.`,
      recommendation: "Steady progress. To accelerate, consider implementing batch resolution workflows for common exception categories (e.g., documentation issues that follow a standard correction pattern).",
    });
  } else {
    insights.push({
      kpiLabel: "Exceptions Resolved Today",
      icon: "check-circle",
      severity: "warning",
      observation: `Only ${data.resolvedToday} exceptions resolved today — below the ${TARGETS.minResolvedDaily}/day target. At this pace, the open backlog will grow.`,
      recommendation: "Allocate dedicated exception resolution time in the next shift. If resolution is blocked by external dependencies (awaiting vendor response, regulatory clarification), escalate those blockers to management for expedited follow-up.",
    });
  }

  return insights;
}

/**
 * Generates a formatted report date/time string for PDF exports
 */
export function getReportTimestamp(): string {
  return new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
