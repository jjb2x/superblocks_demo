import { useAppContext } from "@/context/AppContext";
import { usePrioritiesOptional } from "@/context/PriorityContext";
import { LOCATIONS } from "@/data/locations";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/components/ui/icon";
import type { Priority, IssueCategory, ServiceType, Region } from "@/data/types";

const REGIONS: Region[] = ["Northeast", "Southeast", "Midwest", "West", "Central"];
const SERVICE_TYPES: ServiceType[] = [
  "Retail Pharmacy", "Specialty Pharmacy", "Central Fill",
  "Mail Order", "Transplant Pharmacy", "Clinic Pharmacy", "Medication Access Services",
];
const DEFAULT_PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];

const CATEGORIES: IssueCategory[] = [
  "Inventory", "Insurance", "Staffing", "Workflow Delay", "Technology",
  "Vendor", "Shipping", "Prescription Clarification", "Capacity", "Other",
];

export default function GlobalFilters() {
  const { filters, setFilter, resetFilters } = useAppContext();
  const priorityCtx = usePrioritiesOptional();
  const priorityNames = priorityCtx ? priorityCtx.activePriorities.map((p) => p.name) : DEFAULT_PRIORITIES;

  const hasFilters =
    filters.locationId !== null ||
    filters.region !== null ||
    filters.serviceType !== null ||
    filters.priority !== null ||
    filters.issueCategory !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-4 bg-background border-b border-border">
      <Icon icon="sliders-horizontal" className="w-4 h-4 text-muted-foreground shrink-0" />

      {/* Location */}
      <Select
        value={filters.locationId ?? "all"}
        onValueChange={(v) => setFilter("locationId", v === "all" ? null : v)}
      >
        <SelectTrigger className="h-8 text-xs w-44">
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Locations</SelectItem>
          {LOCATIONS.map((l) => (
            <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Region */}
      <Select
        value={filters.region ?? "all"}
        onValueChange={(v) => setFilter("region", v === "all" ? null : v as Region)}
      >
        <SelectTrigger className="h-8 text-xs w-32">
          <SelectValue placeholder="All Regions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          {REGIONS.map((r) => (
            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Service Type */}
      <Select
        value={filters.serviceType ?? "all"}
        onValueChange={(v) => setFilter("serviceType", v === "all" ? null : v as ServiceType)}
      >
        <SelectTrigger className="h-8 text-xs w-44">
          <SelectValue placeholder="All Service Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Service Types</SelectItem>
          {SERVICE_TYPES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority ?? "all"}
        onValueChange={(v) => setFilter("priority", v === "all" ? null : v as Priority)}
      >
        <SelectTrigger className="h-8 text-xs w-32">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {priorityNames.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={filters.issueCategory ?? "all"}
        onValueChange={(v) => setFilter("issueCategory", v === "all" ? null : v as IssueCategory)}
      >
        <SelectTrigger className="h-8 text-xs w-44">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <Icon icon="x" className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
