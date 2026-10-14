import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_ID = "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

// Flexible row schema — columns are dynamic
const DynamicRow = z.record(z.unknown());

export default api({
  name: "RunDatabricksQuery",
  description: "Executes a read-only SQL query against Databricks and returns results",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({
    sql: z.string(),
  }),

  output: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.record(z.unknown())),
    rowCount: z.number(),
    executionTimeMs: z.number(),
  }),

  async run(ctx, { sql }) {
    // Safety: block write statements
    const normalized = sql.trim().toUpperCase();
    const blocked = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "MERGE", "REPLACE"];
    for (const keyword of blocked) {
      if (normalized.startsWith(keyword)) {
        throw new Error(`Write operations are not allowed. Query starts with '${keyword}'.`);
      }
    }

    // Add LIMIT if not present (safety cap)
    const hasLimit = /\bLIMIT\s+\d+/i.test(sql);
    const safeSql = hasLimit ? sql : `${sql.replace(/;\s*$/, "")} LIMIT 200`;

    const startTime = Date.now();

    const rows = await ctx.integrations.databricks_vumc.query(
      safeSql,
      DynamicRow,
      [],
      { label: "Ad-hoc query execution" }
    );

    const executionTimeMs = Date.now() - startTime;

    // Extract column names from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs,
    };
  },
});
