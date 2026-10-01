import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_ID = "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

export default api({
  name: "SetupJiraTable",
  description: "Creates and seeds the jira_requests table in Databricks",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({}),

  output: z.object({
    message: z.string(),
  }),

  async run(ctx) {
    // Create table if not exists
    await ctx.integrations.databricks_vumc.execute(
      `CREATE TABLE IF NOT EXISTS workspace.default.jira_requests (
        id STRING,
        space STRING,
        work_type STRING,
        status STRING,
        summary STRING,
        reporter STRING,
        component STRING,
        description STRING,
        requested_completion_date STRING,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      )`,
      [],
      { label: "Create jira_requests table" }
    );

    // Check if already seeded
    const CountSchema = z.object({ cnt: z.coerce.number() });
    const rows = await ctx.integrations.databricks_vumc.query(
      "SELECT COUNT(*) as cnt FROM workspace.default.jira_requests",
      CountSchema,
      [],
      { label: "Check row count" }
    );

    if (rows[0].cnt > 0) {
      return { message: `Table already exists with ${rows[0].cnt} rows — skipping seed.` };
    }

    // Seed sample data
    await ctx.integrations.databricks_vumc.execute(
      `INSERT INTO workspace.default.jira_requests VALUES
        ('RSM-101', 'pharmacy-rsm', 'request', 'to-do', 'Add barcode scanning to Central Fill intake workflow', 'Bell, Jake', 'dispensing', 'Staff are manually keying NDCs during intake which slows throughput and introduces transcription errors. Barcode scanning would improve accuracy and speed.', '2026-11-15', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
        ('RSM-102', 'pharmacy-rsm', 'bug', 'in-progress', 'Epic Willow interface dropping PAR-level updates after 5pm', 'Bell, Jake', 'integrations', 'PAR-level replenishment data from Willow stops syncing after the evening batch window. Overnight orders are not reflected until morning manual sync.', '2026-10-20', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
        ('RSM-103', 'pharmacy-rsm', 'task', 'done', 'Update DEA 222 form templates for 2026 compliance changes', 'Bell, Jake', 'compliance', 'Annual update required for controlled substance order forms to match new DEA formatting requirements effective January 2026.', '2026-09-01', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
        ('OPS-201', 'pharmacy-ops', 'request', 'to-do', 'Dashboard KPI for average PA turnaround time by payer', 'Bell, Jake', 'reporting', 'Leadership wants a new Executive Overview KPI showing mean prior-auth turnaround segmented by insurance carrier to identify slow payers.', '2026-12-01', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()),
        ('OPS-202', 'pharmacy-ops', 'request', 'in-progress', 'Automate shift-change handoff report generation', 'Bell, Jake', 'reporting', 'Currently shift leads manually compile a handoff summary. Automate this from the exception queue and staffing data so it generates at shift boundaries.', '2026-10-30', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`,
      [],
      { label: "Seed sample JIRA requests" }
    );

    return { message: "Table created and seeded with 5 sample rows." };
  },
});
