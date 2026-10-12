/**
 * Python code translations of the application's data layer.
 * Used in the Data Integration page's Python code viewer.
 */

export const PYTHON_MODELS = `"""
VUMC Pharmacy Intelligence — Data Models (Pydantic v2)
Equivalent of client/data/types.ts
"""
from enum import Enum
from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class ExceptionStatus(str, Enum):
    NEW = "New"
    UNDER_REVIEW = "Under Review"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    WAITING = "Waiting on External Party"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class IssueCategory(str, Enum):
    INVENTORY = "Inventory"
    INSURANCE = "Insurance"
    STAFFING = "Staffing"
    WORKFLOW_DELAY = "Workflow Delay"
    TECHNOLOGY = "Technology"
    VENDOR = "Vendor"
    SHIPPING = "Shipping"
    RX_CLARIFICATION = "Prescription Clarification"
    CAPACITY = "Capacity"
    OTHER = "Other"


class ServiceType(str, Enum):
    RETAIL = "Retail Pharmacy"
    SPECIALTY = "Specialty Pharmacy"
    CENTRAL_FILL = "Central Fill"
    MAIL_ORDER = "Mail Order"
    TRANSPLANT = "Transplant Pharmacy"
    CLINIC = "Clinic Pharmacy"
    MED_ACCESS = "Medication Access Services"


class WorkflowStage(str, Enum):
    INTAKE = "Intake"
    DATA_ENTRY = "Data Entry"
    INSURANCE = "Insurance Processing"
    VERIFICATION = "Pharmacist Verification"
    FILLING = "Filling"
    PACKING = "Packing"
    FINAL_VERIFY = "Final Verification"
    READY_PICKUP = "Ready for Pickup"
    SHIPPED = "Shipped"


class Region(str, Enum):
    NORTHEAST = "Northeast"
    SOUTHEAST = "Southeast"
    MIDWEST = "Midwest"
    WEST = "West"
    CENTRAL = "Central"


class PharmacyType(str, Enum):
    RETAIL = "Retail"
    SPECIALTY = "Specialty"
    CENTRAL_FILL = "Central Fill"
    MAIL_ORDER = "Mail Order"
    HOSPITAL = "Hospital"
    CLINIC = "Clinic"


class PharmacyLocation(BaseModel):
    id: str
    name: str
    region: Region
    pharmacy_type: PharmacyType
    operating_status: str = Field(pattern="^(Active|Limited|Maintenance)$")
    staffing_level: int  # percentage 0-100
    capacity_utilization: int  # percentage 0-100
    service_types: list[ServiceType]


class DailyMetric(BaseModel):
    date: date
    location_id: str
    prescription_volume: int
    average_turnaround_minutes: int
    open_exception_count: int
    service_level_pct: int
    delayed_prescriptions: int
    resolved_exceptions: int
    critical_exceptions: int


class ActivityEntry(BaseModel):
    id: str
    timestamp: datetime
    user: str
    action: str
    details: str


class ExceptionRecord(BaseModel):
    id: str
    created_at: datetime
    location_id: str
    service_type: ServiceType
    issue_category: IssueCategory
    issue_subtype: str
    priority: Priority
    status: ExceptionStatus
    assigned_owner: str
    days_open: int
    estimated_impact: str
    prescriptions_affected: int
    last_updated_at: datetime
    resolution_due_date: str
    description: str
    resolution_summary: str
    immediate_action_taken: str
    notes: list[str] = []
    activity_history: list[ActivityEntry] = []
    # Optional fields
    medication_name: Optional[str] = None
    vendor_name: Optional[str] = None
    system_affected: Optional[str] = None
    carrier: Optional[str] = None


class AppUser(BaseModel):
    id: str
    name: str
    email: str
    role: str
    default_location: str
    notification_preference: str = "Both"


class KpiSnapshot(BaseModel):
    """Input structure for the AI Insight Engine."""
    prescriptions_processed: int
    prescriptions_delayed: int
    open_exceptions: int
    critical_exceptions: int
    avg_turnaround_min: int
    service_level_pct: int
    locations_needing_attention: int
    resolved_today: int


class Insight(BaseModel):
    """Output from the AI Insight Engine."""
    kpi_label: str
    icon: str
    severity: str  # "success" | "warning" | "critical" | "info"
    observation: str
    recommendation: str
`;

export const PYTHON_DATA = `"""
VUMC Pharmacy Intelligence — Synthetic Data
Equivalent of client/data/locations.ts, exceptions.ts, metrics.ts
"""
from models import (
    PharmacyLocation, Region, PharmacyType, ServiceType,
    ExceptionRecord, Priority, ExceptionStatus, IssueCategory,
    DailyMetric, AppUser
)
from datetime import datetime, date, timedelta
import random


# ─── Pharmacy Locations ───────────────────────────────────────────────

LOCATIONS: list[PharmacyLocation] = [
    PharmacyLocation(
        id="loc-01",
        name="Meridian Health Main Campus",
        region=Region.NORTHEAST,
        pharmacy_type=PharmacyType.HOSPITAL,
        operating_status="Active",
        staffing_level=72,
        capacity_utilization=91,
        service_types=[ServiceType.RETAIL, ServiceType.SPECIALTY, ServiceType.CLINIC],
    ),
    PharmacyLocation(
        id="loc-02",
        name="Riverside Medical Center",
        region=Region.SOUTHEAST,
        pharmacy_type=PharmacyType.HOSPITAL,
        operating_status="Active",
        staffing_level=88,
        capacity_utilization=74,
        service_types=[ServiceType.RETAIL, ServiceType.CENTRAL_FILL, ServiceType.MED_ACCESS],
    ),
    PharmacyLocation(
        id="loc-03",
        name="Northgate Specialty Pharmacy",
        region=Region.NORTHEAST,
        pharmacy_type=PharmacyType.SPECIALTY,
        operating_status="Active",
        staffing_level=65,
        capacity_utilization=88,
        service_types=[ServiceType.SPECIALTY, ServiceType.MED_ACCESS, ServiceType.TRANSPLANT],
    ),
    PharmacyLocation(
        id="loc-04",
        name="Westfield Central Fill Center",
        region=Region.MIDWEST,
        pharmacy_type=PharmacyType.CENTRAL_FILL,
        operating_status="Limited",
        staffing_level=58,
        capacity_utilization=95,
        service_types=[ServiceType.CENTRAL_FILL, ServiceType.MAIL_ORDER],
    ),
    PharmacyLocation(
        id="loc-05",
        name="Summit View Retail Pharmacy",
        region=Region.WEST,
        pharmacy_type=PharmacyType.RETAIL,
        operating_status="Active",
        staffing_level=80,
        capacity_utilization=68,
        service_types=[ServiceType.RETAIL, ServiceType.CLINIC],
    ),
]


# ─── Application Users ────────────────────────────────────────────────

APP_USERS: list[AppUser] = [
    AppUser(
        id="user-01", name="Jake Bell",
        email="jacob.bell@vumc.org",
        role="Pharmacy Administrator",
        default_location="loc-01",
    ),
    AppUser(
        id="user-02", name="Dr. Samantha Reyes",
        email="samantha.reyes@vumc.org",
        role="Pharmacy Manager",
        default_location="loc-02",
    ),
    AppUser(
        id="user-03", name="Michael Chen",
        email="michael.chen@vumc.org",
        role="Pharmacy Staff",
        default_location="loc-03",
    ),
]


# ─── Sample Exception Records ─────────────────────────────────────────

def generate_exceptions(count: int = 50) -> list[ExceptionRecord]:
    """Generate synthetic exception records for demo purposes."""
    categories = list(IssueCategory)
    priorities = list(Priority)
    statuses = list(ExceptionStatus)
    service_types = list(ServiceType)
    owners = [u.name for u in APP_USERS]

    exceptions = []
    for i in range(count):
        days_open = random.randint(0, 14)
        created = datetime.now() - timedelta(days=days_open)
        exceptions.append(ExceptionRecord(
            id=f"EXC-{i + 151:04d}",
            created_at=created,
            location_id=random.choice([loc.id for loc in LOCATIONS]),
            service_type=random.choice(service_types),
            issue_category=random.choice(categories),
            issue_subtype="General",
            priority=random.choice(priorities),
            status=random.choice(statuses),
            assigned_owner=random.choice(owners),
            days_open=days_open,
            estimated_impact="Moderate",
            prescriptions_affected=random.randint(1, 200),
            last_updated_at=datetime.now() - timedelta(hours=random.randint(1, 48)),
            resolution_due_date=(datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            description=f"Synthetic exception #{i + 151} for demo purposes",
            resolution_summary="" if days_open > 0 else "Resolved per protocol",
            immediate_action_taken="Standard triage performed",
            notes=["Auto-generated for demonstration"],
        ))
    return exceptions


# ─── Daily Metrics Generator ──────────────────────────────────────────

def generate_daily_metrics(days: int = 30) -> list[DailyMetric]:
    """Generate 30 days of synthetic daily metrics per location."""
    metrics = []
    for loc in LOCATIONS:
        for d in range(days):
            metric_date = date.today() - timedelta(days=d)
            base_volume = random.randint(180, 450)
            metrics.append(DailyMetric(
                date=metric_date,
                location_id=loc.id,
                prescription_volume=base_volume,
                average_turnaround_minutes=random.randint(22, 55),
                open_exception_count=random.randint(2, 25),
                service_level_pct=random.randint(78, 99),
                delayed_prescriptions=random.randint(5, 80),
                resolved_exceptions=random.randint(3, 18),
                critical_exceptions=random.randint(0, 4),
            ))
    return metrics


# Quick access
EXCEPTIONS = generate_exceptions(50)
DAILY_METRICS = generate_daily_metrics(30)
`;

export const PYTHON_API = `"""
VUMC Pharmacy Intelligence — FastAPI Endpoints
Sample REST API serving pharmacy operations data
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import date

from models import (
    PharmacyLocation, ExceptionRecord, DailyMetric,
    KpiSnapshot, Insight, Priority, ExceptionStatus, Region
)
from data import LOCATIONS, EXCEPTIONS, DAILY_METRICS
from insight_engine import generate_insights

app = FastAPI(
    title="VUMC Pharmacy Intelligence API",
    description="Operational analytics for health-system pharmacy operations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Locations ────────────────────────────────────────────────────────

@app.get("/api/locations", response_model=list[PharmacyLocation])
def get_locations(
    region: Optional[Region] = None,
    status: Optional[str] = None,
):
    """Return all pharmacy locations, optionally filtered by region/status."""
    results = LOCATIONS
    if region:
        results = [loc for loc in results if loc.region == region]
    if status:
        results = [loc for loc in results if loc.operating_status == status]
    return results


@app.get("/api/locations/{location_id}", response_model=PharmacyLocation)
def get_location(location_id: str):
    """Return a single location by ID."""
    loc = next((l for l in LOCATIONS if l.id == location_id), None)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


# ─── Exceptions ───────────────────────────────────────────────────────

@app.get("/api/exceptions", response_model=list[ExceptionRecord])
def get_exceptions(
    priority: Optional[Priority] = None,
    status: Optional[ExceptionStatus] = None,
    location_id: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Return paginated exception records with optional filters."""
    results = EXCEPTIONS
    if priority:
        results = [e for e in results if e.priority == priority]
    if status:
        results = [e for e in results if e.status == status]
    if location_id:
        results = [e for e in results if e.location_id == location_id]
    return results[offset : offset + limit]


@app.get("/api/exceptions/{exception_id}", response_model=ExceptionRecord)
def get_exception(exception_id: str):
    """Return a single exception by ID."""
    exc = next((e for e in EXCEPTIONS if e.id == exception_id), None)
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")
    return exc


# ─── Metrics ──────────────────────────────────────────────────────────

@app.get("/api/metrics/daily", response_model=list[DailyMetric])
def get_daily_metrics(
    location_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """Return daily operational metrics, optionally filtered."""
    results = DAILY_METRICS
    if location_id:
        results = [m for m in results if m.location_id == location_id]
    if start_date:
        results = [m for m in results if m.date >= start_date]
    if end_date:
        results = [m for m in results if m.date <= end_date]
    return results


@app.get("/api/metrics/kpi", response_model=KpiSnapshot)
def get_kpi_snapshot(location_id: Optional[str] = None):
    """
    Compute current KPI snapshot aggregated across all (or one) location(s).
    Used by the Executive Overview dashboard.
    """
    today = date.today()
    today_metrics = [m for m in DAILY_METRICS if m.date == today]
    if location_id:
        today_metrics = [m for m in today_metrics if m.location_id == location_id]

    if not today_metrics:
        return KpiSnapshot(
            prescriptions_processed=0, prescriptions_delayed=0,
            open_exceptions=0, critical_exceptions=0,
            avg_turnaround_min=0, service_level_pct=0,
            locations_needing_attention=0, resolved_today=0,
        )

    return KpiSnapshot(
        prescriptions_processed=sum(m.prescription_volume for m in today_metrics),
        prescriptions_delayed=sum(m.delayed_prescriptions for m in today_metrics),
        open_exceptions=sum(m.open_exception_count for m in today_metrics),
        critical_exceptions=sum(m.critical_exceptions for m in today_metrics),
        avg_turnaround_min=round(
            sum(m.average_turnaround_minutes for m in today_metrics) / len(today_metrics)
        ),
        service_level_pct=round(
            sum(m.service_level_pct for m in today_metrics) / len(today_metrics)
        ),
        locations_needing_attention=sum(
            1 for m in today_metrics if m.service_level_pct < 85
        ),
        resolved_today=sum(m.resolved_exceptions for m in today_metrics),
    )


# ─── AI Insights ──────────────────────────────────────────────────────

@app.get("/api/insights", response_model=list[Insight])
def get_insights(location_id: Optional[str] = None):
    """
    Generate AI-powered operational insights based on current KPI values.
    Returns actionable recommendations for leadership review.
    """
    snapshot = get_kpi_snapshot(location_id)
    return generate_insights(snapshot)


# ─── Health Check ─────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VUMC Pharmacy Intelligence API",
        "version": "1.0.0",
        "locations_loaded": len(LOCATIONS),
        "exceptions_loaded": len(EXCEPTIONS),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

export const PYTHON_UTILITIES = `"""
VUMC Pharmacy Intelligence — AI Insight Engine
Equivalent of client/lib/insightEngine.ts
"""
from models import KpiSnapshot, Insight


# ─── Target Thresholds ────────────────────────────────────────────────

TARGETS = {
    "turnaround_min": 35,
    "service_level_pct": 95,
    "max_delayed": 150,
    "max_open_exceptions": 60,
    "max_critical": 0,
    "max_attention_locations": 2,
    "min_resolved_daily": 15,
}


def generate_insights(data: KpiSnapshot) -> list[Insight]:
    """
    Analyze current KPI values against operational targets and generate
    contextual, actionable recommendations for pharmacy leadership.
    """
    insights: list[Insight] = []

    # 1. Prescriptions Processed
    if data.prescriptions_processed > 2500:
        insights.append(Insight(
            kpi_label="Prescriptions Processed Today",
            icon="pill",
            severity="success",
            observation=(
                f"Volume of {data.prescriptions_processed:,} prescriptions today "
                "indicates strong throughput capacity."
            ),
            recommendation=(
                "Consider reallocating surplus capacity to reduce the delayed queue. "
                "Review if high volume correlates with increased error rates."
            ),
        ))
    elif data.prescriptions_processed > 1500:
        insights.append(Insight(
            kpi_label="Prescriptions Processed Today",
            icon="pill",
            severity="info",
            observation=(
                f"Processing volume of {data.prescriptions_processed:,} is within "
                "the expected daily range for current staffing levels."
            ),
            recommendation=(
                "Monitor afternoon throughput trends — historically, 60% of volume "
                "arrives between 10 AM–2 PM. Ensure break coverage during peak hours."
            ),
        ))
    else:
        insights.append(Insight(
            kpi_label="Prescriptions Processed Today",
            icon="pill",
            severity="warning",
            observation=(
                f"Volume of {data.prescriptions_processed:,} is below the typical "
                "daily average, potentially indicating staffing gaps or system delays."
            ),
            recommendation=(
                "Investigate whether intake volume is lower than expected (demand-side) "
                "or processing is bottlenecked (supply-side)."
            ),
        ))

    # 2. Prescriptions Delayed
    threshold = TARGETS["max_delayed"]
    if data.prescriptions_delayed > threshold * 1.5:
        pct_over = round((data.prescriptions_delayed / threshold) * 100 - 100)
        insights.append(Insight(
            kpi_label="Prescriptions Currently Delayed",
            icon="clock",
            severity="critical",
            observation=(
                f"{data.prescriptions_delayed:,} prescriptions are delayed — "
                f"{pct_over}% above the operational threshold of {threshold}."
            ),
            recommendation=(
                "Activate overflow protocols: redeploy verification pharmacists, "
                "enable remote verification queues, and escalate to Ops Director."
            ),
        ))
    elif data.prescriptions_delayed > threshold:
        insights.append(Insight(
            kpi_label="Prescriptions Currently Delayed",
            icon="clock",
            severity="warning",
            observation=(
                f"{data.prescriptions_delayed:,} delayed prescriptions exceeds "
                f"the {threshold} threshold."
            ),
            recommendation=(
                "Deploy focused sprint processing for the oldest delayed items. "
                "Consider temporarily suspending non-urgent workflow tasks."
            ),
        ))
    else:
        insights.append(Insight(
            kpi_label="Prescriptions Currently Delayed",
            icon="clock",
            severity="success",
            observation=(
                f"Delayed queue at {data.prescriptions_delayed:,} is within "
                f"the acceptable range (target: <{threshold})."
            ),
            recommendation=(
                "Maintain current workflow cadence. Use operational headroom "
                "for Prior Authorization follow-ups or refill requests."
            ),
        ))

    # 3. Average Turnaround Time
    target_tat = TARGETS["turnaround_min"]
    if data.avg_turnaround_min > target_tat * 1.3:
        pct_over = round(
            ((data.avg_turnaround_min - target_tat) / target_tat) * 100
        )
        insights.append(Insight(
            kpi_label="Avg Turnaround Time",
            icon="timer",
            severity="critical",
            observation=(
                f"Average TAT of {data.avg_turnaround_min} minutes is {pct_over}% "
                f"above the {target_tat}-minute target."
            ),
            recommendation=(
                "Identify the top 3 bottleneck locations and deploy targeted support. "
                "Consider activating the remote verification pool."
            ),
        ))
    elif data.avg_turnaround_min > target_tat:
        insights.append(Insight(
            kpi_label="Avg Turnaround Time",
            icon="timer",
            severity="warning",
            observation=(
                f"TAT of {data.avg_turnaround_min} minutes exceeds the "
                f"{target_tat}-minute target by "
                f"{data.avg_turnaround_min - target_tat} minutes."
            ),
            recommendation=(
                "Review which step in the fill process is adding latency — "
                "data entry, clinical review, or will-call staging."
            ),
        ))
    else:
        insights.append(Insight(
            kpi_label="Avg Turnaround Time",
            icon="timer",
            severity="success",
            observation=(
                f"TAT of {data.avg_turnaround_min} minutes is within the "
                f"{target_tat}-minute target."
            ),
            recommendation=(
                "Strong performance. Document current staffing model as a "
                "benchmark for lower-performing sites."
            ),
        ))

    # 4. Service Level
    target_svc = TARGETS["service_level_pct"]
    if data.service_level_pct < 85:
        insights.append(Insight(
            kpi_label="Within Service Target",
            icon="circle-check-big",
            severity="critical",
            observation=(
                f"Service level at {data.service_level_pct}% is critically below "
                f"the {target_svc}% target."
            ),
            recommendation=(
                "Escalate to pharmacy leadership. Conduct rapid root-cause analysis "
                "and implement 15-minute checkpoint reviews until recovery above 90%."
            ),
        ))
    elif data.service_level_pct < target_svc:
        insights.append(Insight(
            kpi_label="Within Service Target",
            icon="circle-check-big",
            severity="warning",
            observation=(
                f"Service level of {data.service_level_pct}% is "
                f"{target_svc - data.service_level_pct} points below target."
            ),
            recommendation=(
                "Investigate trailing locations. Prioritize workflow optimization "
                "at sites below 85% — cross-train technicians for verification support."
            ),
        ))
    else:
        insights.append(Insight(
            kpi_label="Within Service Target",
            icon="circle-check-big",
            severity="success",
            observation=(
                f"Service level at {data.service_level_pct}% meets or exceeds "
                f"the {target_svc}% target."
            ),
            recommendation=(
                "Maintain operational rigor. Consider raising internal target "
                "to 97% for continuous improvement."
            ),
        ))

    # 5. Open Exceptions
    max_exc = TARGETS["max_open_exceptions"]
    if data.open_exceptions > max_exc * 1.3:
        insights.append(Insight(
            kpi_label="Open Operational Exceptions",
            icon="alert-triangle",
            severity="critical",
            observation=(
                f"{data.open_exceptions} open exceptions significantly exceeds "
                f"the target ceiling of {max_exc}."
            ),
            recommendation=(
                "Schedule a targeted exception blitz — allocate 2 senior "
                "pharmacists for a focused 90-minute sprint on oldest items."
            ),
        ))
    elif data.open_exceptions > max_exc:
        insights.append(Insight(
            kpi_label="Open Operational Exceptions",
            icon="alert-triangle",
            severity="warning",
            observation=(
                f"{data.open_exceptions} open exceptions slightly exceeds "
                f"the {max_exc} target."
            ),
            recommendation=(
                "Assign ownership for the top 10 oldest exceptions. "
                "Implement daily stand-up exception review."
            ),
        ))
    else:
        insights.append(Insight(
            kpi_label="Open Operational Exceptions",
            icon="alert-triangle",
            severity="success",
            observation=(
                f"Open exceptions at {data.open_exceptions} are within target — "
                "healthy resolution velocity."
            ),
            recommendation=(
                "Review recently-resolved exceptions for root cause patterns "
                "that could enable preventive workflow changes."
            ),
        ))

    return insights


# ─── Report Generation Utility ────────────────────────────────────────

def generate_report(snapshot: KpiSnapshot) -> dict:
    """
    Generate a complete AI insights report suitable for PDF export.
    Returns a structured dict with metadata and all insights.
    """
    from datetime import datetime

    insights = generate_insights(snapshot)
    return {
        "title": "VUMC Pharmacy Intelligence — AI Insights Report",
        "generated_at": datetime.now().isoformat(),
        "generated_by": "AI Advisory System v1.0",
        "kpi_snapshot": snapshot.model_dump(),
        "insights": [i.model_dump() for i in insights],
        "summary": {
            "critical": sum(1 for i in insights if i.severity == "critical"),
            "warning": sum(1 for i in insights if i.severity == "warning"),
            "success": sum(1 for i in insights if i.severity == "success"),
            "info": sum(1 for i in insights if i.severity == "info"),
        },
    }
`;

export const PYTHON_TABS = [
  { id: "models", label: "Models", code: PYTHON_MODELS },
  { id: "data", label: "Data", code: PYTHON_DATA },
  { id: "api", label: "API Endpoints", code: PYTHON_API },
  { id: "utilities", label: "Utilities", code: PYTHON_UTILITIES },
] as const;
