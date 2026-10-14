// Mock schema metadata for SQL workbench — representing what each platform exposes

export type Platform = "snowflake" | "databricks" | "oracle";

export interface ColumnMeta {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface TableMeta {
  name: string;
  columns: ColumnMeta[];
  rowCount: number;
}

export interface SchemaMeta {
  name: string;
  tables: TableMeta[];
}

export interface DatabaseMeta {
  name: string;
  schemas: SchemaMeta[];
}

export interface PlatformConfig {
  id: Platform;
  label: string;
  connectionStatus: "connected" | "disconnected" | "limited";
  warehouse?: string;
  cluster?: string;
  databases: DatabaseMeta[];
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: "snowflake",
    label: "Snowflake",
    connectionStatus: "connected",
    warehouse: "PHARMACY_WH",
    databases: [
      {
        name: "ANALYTICS",
        schemas: [
          {
            name: "PHARMACY",
            tables: [
              {
                name: "OPERATIONAL_DAILY_METRICS",
                rowCount: 18420,
                columns: [
                  { name: "metric_date", type: "DATE", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "prescription_volume", type: "INTEGER", nullable: false },
                  { name: "avg_turnaround_min", type: "FLOAT", nullable: true },
                  { name: "open_exception_count", type: "INTEGER", nullable: true },
                  { name: "service_level_pct", type: "FLOAT", nullable: true },
                  { name: "delayed_prescriptions", type: "INTEGER", nullable: true },
                  { name: "resolved_exceptions", type: "INTEGER", nullable: true },
                ],
              },
              {
                name: "PHARMACY_LOCATIONS",
                rowCount: 24,
                columns: [
                  { name: "location_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "name", type: "VARCHAR(128)", nullable: false },
                  { name: "region", type: "VARCHAR(64)", nullable: false },
                  { name: "pharmacy_type", type: "VARCHAR(32)", nullable: false },
                  { name: "operating_status", type: "VARCHAR(16)", nullable: false },
                  { name: "staffing_level_pct", type: "FLOAT", nullable: true },
                  { name: "capacity_utilization_pct", type: "FLOAT", nullable: true },
                  { name: "address", type: "VARCHAR(256)", nullable: true },
                  { name: "npi_number", type: "VARCHAR(10)", nullable: true },
                ],
              },
              {
                name: "HOURLY_METRICS",
                rowCount: 442080,
                columns: [
                  { name: "metric_hour", type: "TIMESTAMP_NTZ", nullable: false, isPrimaryKey: true },
                  { name: "metric_date", type: "DATE", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "prescription_volume", type: "INTEGER", nullable: false },
                ],
              },
              {
                name: "KPI_TARGETS",
                rowCount: 48,
                columns: [
                  { name: "target_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "metric_name", type: "VARCHAR(64)", nullable: false },
                  { name: "target_value", type: "FLOAT", nullable: false },
                  { name: "effective_date", type: "DATE", nullable: false },
                  { name: "location_id", type: "VARCHAR(36)", nullable: true },
                ],
              },
            ],
          },
          {
            name: "EXECUTIVE",
            tables: [
              {
                name: "MONTHLY_SUMMARIES",
                rowCount: 288,
                columns: [
                  { name: "summary_month", type: "DATE", nullable: false, isPrimaryKey: true },
                  { name: "region", type: "VARCHAR(64)", nullable: false, isPrimaryKey: true },
                  { name: "total_volume", type: "INTEGER", nullable: false },
                  { name: "avg_service_level", type: "FLOAT", nullable: true },
                  { name: "total_exceptions", type: "INTEGER", nullable: true },
                  { name: "cost_per_rx", type: "FLOAT", nullable: true },
                ],
              },
              {
                name: "TREND_SNAPSHOTS",
                rowCount: 720,
                columns: [
                  { name: "snapshot_date", type: "DATE", nullable: false, isPrimaryKey: true },
                  { name: "metric_key", type: "VARCHAR(64)", nullable: false, isPrimaryKey: true },
                  { name: "value", type: "FLOAT", nullable: false },
                  { name: "delta_7d", type: "FLOAT", nullable: true },
                  { name: "delta_30d", type: "FLOAT", nullable: true },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "OPERATIONS",
        schemas: [
          {
            name: "PHARMACY",
            tables: [
              {
                name: "OPERATIONAL_EXCEPTIONS",
                rowCount: 3847,
                columns: [
                  { name: "exception_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "VARCHAR(36)", nullable: false },
                  { name: "issue_category", type: "VARCHAR(64)", nullable: false },
                  { name: "priority", type: "VARCHAR(16)", nullable: false },
                  { name: "status", type: "VARCHAR(32)", nullable: false },
                  { name: "assigned_owner", type: "VARCHAR(128)", nullable: true },
                  { name: "created_at", type: "TIMESTAMP_NTZ", nullable: false },
                  { name: "resolved_at", type: "TIMESTAMP_NTZ", nullable: true },
                  { name: "days_open", type: "INTEGER", nullable: true },
                  { name: "prescriptions_affected", type: "INTEGER", nullable: true },
                  { name: "root_cause", type: "VARCHAR(256)", nullable: true },
                ],
              },
              {
                name: "SHIPPING_RECORDS",
                rowCount: 12640,
                columns: [
                  { name: "shipment_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "VARCHAR(36)", nullable: false },
                  { name: "carrier", type: "VARCHAR(32)", nullable: false },
                  { name: "tracking_number", type: "VARCHAR(64)", nullable: false },
                  { name: "status", type: "VARCHAR(32)", nullable: false },
                  { name: "shipped_date", type: "DATE", nullable: false },
                  { name: "estimated_delivery", type: "DATE", nullable: true },
                  { name: "temperature_controlled", type: "BOOLEAN", nullable: false },
                  { name: "weight_lbs", type: "FLOAT", nullable: true },
                ],
              },
            ],
          },
          {
            name: "COMPLIANCE",
            tables: [
              {
                name: "AUDIT_LOG",
                rowCount: 89410,
                columns: [
                  { name: "audit_id", type: "VARCHAR(36)", nullable: false, isPrimaryKey: true },
                  { name: "event_type", type: "VARCHAR(64)", nullable: false },
                  { name: "user_id", type: "VARCHAR(36)", nullable: false },
                  { name: "timestamp", type: "TIMESTAMP_NTZ", nullable: false },
                  { name: "details", type: "VARIANT", nullable: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "databricks",
    label: "Databricks",
    connectionStatus: "connected",
    cluster: "pharmacy-analytics-dev",
    databases: [
      {
        name: "workspace",
        schemas: [
          {
            name: "default",
            tables: [
              {
                name: "pharmacy_locations",
                rowCount: 8,
                columns: [
                  { name: "location_id", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "name", type: "STRING", nullable: false },
                  { name: "region", type: "STRING", nullable: false },
                  { name: "pharmacy_type", type: "STRING", nullable: false },
                  { name: "operating_status", type: "STRING", nullable: false },
                  { name: "staffing_level_pct", type: "INT", nullable: true },
                  { name: "capacity_utilization_pct", type: "INT", nullable: true },
                ],
              },
              {
                name: "operational_daily_metrics",
                rowCount: 56,
                columns: [
                  { name: "metric_date", type: "DATE", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "prescription_volume", type: "INT", nullable: true },
                  { name: "avg_turnaround_min", type: "DOUBLE", nullable: true },
                  { name: "open_exception_count", type: "INT", nullable: true },
                  { name: "service_level_pct", type: "DOUBLE", nullable: true },
                  { name: "delayed_prescriptions", type: "INT", nullable: true },
                  { name: "resolved_exceptions", type: "INT", nullable: true },
                ],
              },
              {
                name: "operational_exceptions",
                rowCount: 15,
                columns: [
                  { name: "exception_id", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "STRING", nullable: false },
                  { name: "issue_category", type: "STRING", nullable: false },
                  { name: "priority", type: "STRING", nullable: false },
                  { name: "status", type: "STRING", nullable: false },
                  { name: "assigned_owner", type: "STRING", nullable: true },
                  { name: "created_at", type: "TIMESTAMP", nullable: false },
                  { name: "days_open", type: "INT", nullable: true },
                  { name: "prescriptions_affected", type: "INT", nullable: true },
                ],
              },
              {
                name: "hourly_metrics",
                rowCount: 96,
                columns: [
                  { name: "metric_hour", type: "INT", nullable: false, isPrimaryKey: true },
                  { name: "metric_date", type: "DATE", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "prescription_volume", type: "INT", nullable: true },
                ],
              },
              {
                name: "shipping_records",
                rowCount: 10,
                columns: [
                  { name: "shipment_id", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "location_id", type: "STRING", nullable: false },
                  { name: "carrier", type: "STRING", nullable: false },
                  { name: "tracking_number", type: "STRING", nullable: true },
                  { name: "status", type: "STRING", nullable: false },
                  { name: "shipped_date", type: "DATE", nullable: true },
                  { name: "estimated_delivery", type: "DATE", nullable: true },
                  { name: "temperature_controlled", type: "BOOLEAN", nullable: true },
                ],
              },
              {
                name: "exception_queue",
                rowCount: 200,
                columns: [
                  { name: "ID", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "Created", type: "STRING", nullable: false },
                  { name: "Location", type: "STRING", nullable: false },
                  { name: "Service Type", type: "STRING", nullable: true },
                  { name: "Category", type: "STRING", nullable: true },
                  { name: "Subtype", type: "STRING", nullable: true },
                  { name: "Priority", type: "STRING", nullable: true },
                  { name: "Status", type: "STRING", nullable: true },
                  { name: "Owner", type: "STRING", nullable: true },
                  { name: "Days Open", type: "INT", nullable: true },
                  { name: "Rx Affected", type: "INT", nullable: true },
                  { name: "Due Date", type: "STRING", nullable: true },
                  { name: "Note", type: "STRING", nullable: true },
                ],
              },
              {
                name: "jira_requests",
                rowCount: 5,
                columns: [
                  { name: "id", type: "STRING", nullable: false, isPrimaryKey: true },
                  { name: "space", type: "STRING", nullable: false },
                  { name: "work_type", type: "STRING", nullable: false },
                  { name: "status", type: "STRING", nullable: false },
                  { name: "summary", type: "STRING", nullable: false },
                  { name: "reporter", type: "STRING", nullable: true },
                  { name: "component", type: "STRING", nullable: true },
                  { name: "description", type: "STRING", nullable: true },
                  { name: "requested_completion_date", type: "STRING", nullable: true },
                  { name: "created_at", type: "TIMESTAMP", nullable: true },
                  { name: "updated_at", type: "TIMESTAMP", nullable: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "oracle",
    label: "Oracle",
    connectionStatus: "limited",
    databases: [
      {
        name: "PHARMA_OPS",
        schemas: [
          {
            name: "RX_PROCESSING",
            tables: [
              {
                name: "PRESCRIPTION_ORDERS",
                rowCount: 5200000,
                columns: [
                  { name: "ORDER_ID", type: "NUMBER(12)", nullable: false, isPrimaryKey: true },
                  { name: "PATIENT_ID", type: "NUMBER(10)", nullable: false },
                  { name: "DRUG_CODE", type: "VARCHAR2(20)", nullable: false },
                  { name: "ORDERED_DATE", type: "DATE", nullable: false },
                  { name: "FILL_STATUS", type: "VARCHAR2(20)", nullable: false },
                  { name: "PHARMACIST_ID", type: "NUMBER(8)", nullable: true },
                  { name: "VERIFICATION_STATUS", type: "VARCHAR2(10)", nullable: false },
                ],
              },
              {
                name: "DISPENSE_EVENTS",
                rowCount: 4800000,
                columns: [
                  { name: "DISPENSE_ID", type: "NUMBER(12)", nullable: false, isPrimaryKey: true },
                  { name: "ORDER_ID", type: "NUMBER(12)", nullable: false },
                  { name: "DISPENSE_TIME", type: "TIMESTAMP", nullable: false },
                  { name: "TECHNICIAN_ID", type: "NUMBER(8)", nullable: true },
                  { name: "MACHINE_ID", type: "VARCHAR2(20)", nullable: true },
                  { name: "QTY_DISPENSED", type: "NUMBER(6)", nullable: false },
                ],
              },
            ],
          },
          {
            name: "INVENTORY",
            tables: [
              {
                name: "STOCK_LEVELS",
                rowCount: 380000,
                columns: [
                  { name: "ITEM_ID", type: "NUMBER(10)", nullable: false, isPrimaryKey: true },
                  { name: "LOCATION_CODE", type: "VARCHAR2(10)", nullable: false },
                  { name: "NDC", type: "VARCHAR2(20)", nullable: false },
                  { name: "QTY_ON_HAND", type: "NUMBER(8)", nullable: false },
                  { name: "LAST_COUNTED", type: "DATE", nullable: true },
                  { name: "EXPIRY_DATE", type: "DATE", nullable: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// --- Mock Query Results ---

export interface MockResult {
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  executionTimeMs: number;
  bytesScanned: string;
  rowsScanned: number;
}

export function generateMockResults(platform: Platform): MockResult {
  if (platform === "snowflake") {
    return {
      columns: ["pharmacy_name", "region", "metric_date", "total_volume", "avg_tat", "service_level_pct", "open_exceptions"],
      rows: [
        { pharmacy_name: "Vanderbilt Main Campus", region: "Central", metric_date: "2025-07-28", total_volume: 842, avg_tat: 12.4, service_level_pct: 96.2, open_exceptions: 3 },
        { pharmacy_name: "One Hundred Oaks", region: "South", metric_date: "2025-07-28", total_volume: 634, avg_tat: 14.1, service_level_pct: 94.8, open_exceptions: 5 },
        { pharmacy_name: "Cool Springs MOB", region: "South", metric_date: "2025-07-28", total_volume: 421, avg_tat: 11.2, service_level_pct: 97.1, open_exceptions: 1 },
        { pharmacy_name: "Green Hills Retail", region: "West", metric_date: "2025-07-28", total_volume: 388, avg_tat: 15.8, service_level_pct: 92.4, open_exceptions: 7 },
        { pharmacy_name: "Belle Meade Clinic", region: "West", metric_date: "2025-07-28", total_volume: 295, avg_tat: 10.6, service_level_pct: 98.1, open_exceptions: 0 },
        { pharmacy_name: "Nashville VA Outpatient", region: "Central", metric_date: "2025-07-28", total_volume: 512, avg_tat: 13.9, service_level_pct: 95.0, open_exceptions: 4 },
        { pharmacy_name: "Murfreesboro Satellite", region: "East", metric_date: "2025-07-28", total_volume: 267, avg_tat: 16.3, service_level_pct: 91.8, open_exceptions: 6 },
        { pharmacy_name: "Hendersonville Express", region: "North", metric_date: "2025-07-28", total_volume: 198, avg_tat: 9.8, service_level_pct: 98.7, open_exceptions: 0 },
        { pharmacy_name: "Franklin Specialty", region: "South", metric_date: "2025-07-28", total_volume: 156, avg_tat: 22.4, service_level_pct: 88.9, open_exceptions: 9 },
        { pharmacy_name: "Clarksville Regional", region: "North", metric_date: "2025-07-28", total_volume: 345, avg_tat: 14.7, service_level_pct: 93.6, open_exceptions: 4 },
        { pharmacy_name: "Gallatin Ambulatory", region: "North", metric_date: "2025-07-28", total_volume: 223, avg_tat: 11.9, service_level_pct: 96.5, open_exceptions: 2 },
        { pharmacy_name: "Lebanon Outreach", region: "East", metric_date: "2025-07-28", total_volume: 178, avg_tat: 13.2, service_level_pct: 95.4, open_exceptions: 3 },
      ],
      executionTimeMs: 342,
      bytesScanned: "2.4 MB",
      rowsScanned: 18420,
    };
  }

  if (platform === "databricks") {
    return {
      columns: ["rx_id", "patient_mrn", "generic_name", "fill_date", "quantity", "days_supply", "copay_amount", "status"],
      rows: [
        { rx_id: "RX-2025-884210", patient_mrn: "MRN-00482910", generic_name: "Tacrolimus 1mg", fill_date: "2025-07-28", quantity: 60, days_supply: 30, copay_amount: 15.00, status: "Filled" },
        { rx_id: "RX-2025-884211", patient_mrn: "MRN-00391847", generic_name: "Lisinopril 10mg", fill_date: "2025-07-28", quantity: 90, days_supply: 90, copay_amount: 5.00, status: "Filled" },
        { rx_id: "RX-2025-884212", patient_mrn: "MRN-00559201", generic_name: "Metformin 500mg", fill_date: "2025-07-28", quantity: 120, days_supply: 60, copay_amount: 10.00, status: "Filled" },
        { rx_id: "RX-2025-884213", patient_mrn: "MRN-00721034", generic_name: "Amlodipine 5mg", fill_date: "2025-07-28", quantity: 30, days_supply: 30, copay_amount: 5.00, status: "In Progress" },
        { rx_id: "RX-2025-884214", patient_mrn: "MRN-00198745", generic_name: "Pantoprazole 40mg", fill_date: "2025-07-28", quantity: 30, days_supply: 30, copay_amount: 20.00, status: "Filled" },
        { rx_id: "RX-2025-884215", patient_mrn: "MRN-00842156", generic_name: "Atorvastatin 20mg", fill_date: "2025-07-28", quantity: 90, days_supply: 90, copay_amount: 5.00, status: "Pending PA" },
        { rx_id: "RX-2025-884216", patient_mrn: "MRN-00619302", generic_name: "Sertraline 50mg", fill_date: "2025-07-28", quantity: 30, days_supply: 30, copay_amount: 10.00, status: "Filled" },
        { rx_id: "RX-2025-884217", patient_mrn: "MRN-00456789", generic_name: "Insulin Glargine", fill_date: "2025-07-28", quantity: 5, days_supply: 30, copay_amount: 45.00, status: "Filled" },
        { rx_id: "RX-2025-884218", patient_mrn: "MRN-00334521", generic_name: "Levothyroxine 75mcg", fill_date: "2025-07-28", quantity: 30, days_supply: 30, copay_amount: 5.00, status: "Filled" },
        { rx_id: "RX-2025-884219", patient_mrn: "MRN-00887432", generic_name: "Albuterol Inhaler", fill_date: "2025-07-28", quantity: 1, days_supply: 30, copay_amount: 35.00, status: "In Progress" },
      ],
      executionTimeMs: 1847,
      bytesScanned: "124.6 MB",
      rowsScanned: 2450000,
    };
  }

  // Oracle
  return {
    columns: ["ORDER_ID", "PATIENT_ID", "DRUG_CODE", "ORDERED_DATE", "FILL_STATUS", "VERIFICATION_STATUS"],
    rows: [
      { ORDER_ID: 50019842, PATIENT_ID: 1048291, DRUG_CODE: "NDC-00078-0620", ORDERED_DATE: "2025-07-28", FILL_STATUS: "COMPLETE", VERIFICATION_STATUS: "VERIFIED" },
      { ORDER_ID: 50019843, PATIENT_ID: 1039184, DRUG_CODE: "NDC-00003-0852", ORDERED_DATE: "2025-07-28", FILL_STATUS: "PENDING", VERIFICATION_STATUS: "PENDING" },
      { ORDER_ID: 50019844, PATIENT_ID: 1055920, DRUG_CODE: "NDC-00591-3747", ORDERED_DATE: "2025-07-28", FILL_STATUS: "COMPLETE", VERIFICATION_STATUS: "VERIFIED" },
      { ORDER_ID: 50019845, PATIENT_ID: 1072103, DRUG_CODE: "NDC-00069-1540", ORDERED_DATE: "2025-07-28", FILL_STATUS: "IN_PROCESS", VERIFICATION_STATUS: "PENDING" },
      { ORDER_ID: 50019846, PATIENT_ID: 1019874, DRUG_CODE: "NDC-00173-0682", ORDERED_DATE: "2025-07-28", FILL_STATUS: "COMPLETE", VERIFICATION_STATUS: "VERIFIED" },
      { ORDER_ID: 50019847, PATIENT_ID: 1084215, DRUG_CODE: "NDC-00006-0749", ORDERED_DATE: "2025-07-28", FILL_STATUS: "HOLD", VERIFICATION_STATUS: "REJECTED" },
      { ORDER_ID: 50019848, PATIENT_ID: 1061930, DRUG_CODE: "NDC-00054-4182", ORDERED_DATE: "2025-07-28", FILL_STATUS: "COMPLETE", VERIFICATION_STATUS: "VERIFIED" },
      { ORDER_ID: 50019849, PATIENT_ID: 1045678, DRUG_CODE: "NDC-00002-4462", ORDERED_DATE: "2025-07-28", FILL_STATUS: "COMPLETE", VERIFICATION_STATUS: "VERIFIED" },
    ],
    executionTimeMs: 892,
    bytesScanned: "18.2 MB",
    rowsScanned: 5200000,
  };
}
