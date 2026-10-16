import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useApiData } from "@/hooks/useApiData.js";
import type { DefaultPriority } from "@/data/types";

export interface PriorityConfig {
  priority_id: string;
  name: string;
  color: string;
  sort_order: number;
  sla_hours: number | null;
  description: string | null;
  is_active: boolean;
  updated_at: string | null;
  updated_by: string | null;
  total_count: number;
  open_count: number;
}

/** Used until Databricks responds, or if it can't be reached, so the queue keeps working. */
const FALLBACK: PriorityConfig[] = (
  [
    ["Critical", "red", 4],
    ["High", "orange", 24],
    ["Medium", "yellow", 72],
    ["Low", "blue", 168],
  ] as [DefaultPriority, string, number][]
).map(([name, color, sla], i) => ({
  priority_id: `default-${i + 1}`,
  name,
  color,
  sort_order: i + 1,
  sla_hours: sla,
  description: null,
  is_active: true,
  updated_at: null,
  updated_by: null,
  total_count: 0,
  open_count: 0,
}));

interface PriorityContextValue {
  /** Every configured priority, active first, in rank order */
  priorities: PriorityConfig[];
  /** Active priorities only: the choices offered for new assignments */
  activePriorities: PriorityConfig[];
  /** Exception priority values with no matching configured priority */
  unmatched: { value: string; cnt: number }[];
  byName: Map<string, PriorityConfig>;
  /** Rank for sorting (lower = more urgent). Unknown names sort last. */
  rankOf: (name: string) => number;
  /** The highest-ranked active priority (shown with a pulse, used for "critical" counts) */
  topPriorityName: string;
  /** Top two active priorities, treated as "high priority" in summaries */
  isHighPriority: (name: string) => boolean;
  loading: boolean;
  fetching: boolean;
  isLive: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
}

const PriorityContext = createContext<PriorityContextValue | null>(null);

export function PriorityProvider({ children }: { children: ReactNode }) {
  const { data, loading, fetching, isError, error, refetch } = useApiData(
    "GetPriorities",
    {},
    { staleTime: 30_000, refetchOnWindowFocus: false },
  );

  const isLive = !!data && data.priorities.length > 0;
  const priorities = isLive ? data.priorities : FALLBACK;

  const value = useMemo<PriorityContextValue>(() => {
    const activePriorities = priorities
      .filter((p) => p.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    const byName = new Map(priorities.map((p) => [p.name, p]));
    const activeRank = new Map(activePriorities.map((p, i) => [p.name, i]));
    const topPriorityName = activePriorities[0]?.name ?? "Critical";
    const highSet = new Set(activePriorities.slice(0, 2).map((p) => p.name));

    return {
      priorities,
      activePriorities,
      unmatched: data?.unmatched ?? [],
      byName,
      rankOf: (name: string) => {
        const active = activeRank.get(name);
        if (active !== undefined) return active;
        const any = byName.get(name);
        return any ? 1000 + any.sort_order : 9999;
      },
      topPriorityName,
      isHighPriority: (name: string) => highSet.has(name),
      loading,
      fetching,
      isLive,
      error: isError ? error : null,
      refetch,
    };
  }, [priorities, data?.unmatched, loading, fetching, isLive, isError, error, refetch]);

  return <PriorityContext.Provider value={value}>{children}</PriorityContext.Provider>;
}

export function usePriorities(): PriorityContextValue {
  const ctx = useContext(PriorityContext);
  if (!ctx) throw new Error("usePriorities must be used within PriorityProvider");
  return ctx;
}

/** Safe variant for components that may render outside the provider. */
export function usePrioritiesOptional(): PriorityContextValue | null {
  return useContext(PriorityContext);
}

/** Convenience hook: the active priority names, in rank order, for dropdowns. */
export function useActivePriorityNames(current?: string): string[] {
  const { activePriorities } = usePriorities();
  return useMemo(() => {
    const names = activePriorities.map((p) => p.name);
    // Keep an exception's current (possibly retired) value selectable so editing doesn't silently change it.
    if (current && !names.includes(current)) names.push(current);
    return names;
  }, [activePriorities, current]);
}

export function useRefreshPriorities() {
  const { refetch } = usePriorities();
  return useCallback(() => refetch(), [refetch]);
}
