import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { FilterState, Priority, IssueCategory, ServiceType, Region } from "../data/types.js";

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

const defaultFilter: FilterState = {
  dateRange: {
    start: thirtyDaysAgo.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  },
  locationId: null,
  region: null,
  serviceType: null,
  priority: null,
  issueCategory: null,
};

interface AppContextValue {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  selectedExceptionId: string | null;
  setSelectedExceptionId: (id: string | null) => void;
  exceptionRefreshKey: number;
  triggerExceptionRefresh: () => void;
  currentUserRole: "Pharmacy Staff" | "Pharmacy Manager" | "Pharmacy Administrator";
  setCurrentUserRole: (role: "Pharmacy Staff" | "Pharmacy Manager" | "Pharmacy Administrator") => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  demoAdminUserId: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilter);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [exceptionRefreshKey, setExceptionRefreshKey] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<AppContextValue["currentUserRole"]>("Pharmacy Administrator");
  const [userName, setUserName] = useState("Jake Bell");
  const [userEmail, setUserEmail] = useState("jacob.bell@vumc.org");

  const setFilters = useCallback((f: FilterState) => setFiltersState(f), []);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(defaultFilter), []);

  const triggerExceptionRefresh = useCallback(() => {
    setExceptionRefreshKey((k) => k + 1);
  }, []);

  return (
    <AppContext.Provider
      value={{
        filters,
        setFilters,
        setFilter,
        resetFilters,
        selectedLocationId,
        setSelectedLocationId,
        selectedExceptionId,
        setSelectedExceptionId,
        exceptionRefreshKey,
        triggerExceptionRefresh,
        currentUserRole,
        setCurrentUserRole,
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        demoAdminUserId: "user-01",
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppContextProvider");
  return ctx;
}

// Convenience typed filter exports
export type { Priority, IssueCategory, ServiceType, Region };
