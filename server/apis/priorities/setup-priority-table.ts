import { api, z, databricks } from "@superblocksteam/sdk-api";
import { CountSchema, DATABRICKS_ID, PRIORITY_TABLE } from "./shared.js";

export default api({
  name: "SetupPriorityTable",
  description: "Creates and seeds the exception priorities table",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({}),

  output: z.object({
    message: z.string(),
  }),

  async run(ctx) {
    const db = ctx.integrations.databricks_vumc;

    await db.execute(
      `CREATE TABLE IF NOT EXISTS ${PRIORITY_TABLE} (
        priority_id STRING,
        name STRING,
        color STRING,
        sort_order INT,
        sla_hours INT,
        description STRING,
        is_active BOOLEAN,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        updated_by STRING
      )`,
      [],
      { label: "Create exception_priorities table" },
    );

    const [{ cnt }] = await db.query(
      `SELECT COUNT(*) AS cnt FROM ${PRIORITY_TABLE}`,
      CountSchema,
      [],
      { label: "Check existing priorities" },
    );

    if (cnt > 0) {
      return { message: `Table already has ${cnt} priorities, so seeding was skipped.` };
    }

    await db.execute(
      `INSERT INTO ${PRIORITY_TABLE} VALUES
        ('PRI-001', 'Critical', 'red',    1, 4,   'Patient safety risk or therapy interruption. Immediate action required.', true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), 'system'),
        ('PRI-002', 'High',     'orange', 2, 24,  'Significant delay or financial impact. Resolve within one business day.', true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), 'system'),
        ('PRI-003', 'Medium',   'yellow', 3, 72,  'Moderate operational impact. Resolve within three days.',                true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), 'system'),
        ('PRI-004', 'Low',      'blue',   4, 168, 'Minor issue or process improvement. Resolve within one week.',           true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), 'system')`,
      [],
      { label: "Seed default priorities" },
    );

    return { message: "Table created and seeded with Critical, High, Medium, and Low." };
  },
});
