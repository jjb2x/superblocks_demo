import { api, z, databricks } from "@superblocksteam/sdk-api";
import {
  DATABRICKS_ID,
  EXCEPTION_TABLE,
  PRIORITY_TABLE,
  PriorityOutputSchema,
  PriorityRowSchema,
  toBool,
} from "./shared.js";

const PriorityWithUsageRowSchema = PriorityRowSchema.extend({
  total_count: z.coerce.number(),
  open_count: z.coerce.number(),
});

const UnmatchedRowSchema = z.object({
  value: z.string(),
  cnt: z.coerce.number(),
});

export default api({
  name: "GetPriorities",
  description: "Lists exception priorities with live usage counts",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({}),

  output: z.object({
    priorities: z.array(
      PriorityOutputSchema.extend({
        total_count: z.number(),
        open_count: z.number(),
      }),
    ),
    unmatched: z.array(z.object({ value: z.string(), cnt: z.number() })),
  }),

  async run(ctx) {
    const db = ctx.integrations.databricks_vumc;

    const [priorityRows, unmatchedRows] = await Promise.all([
      db.query(
        `SELECT
           p.priority_id, p.name, p.color, p.sort_order, p.sla_hours, p.description,
           p.is_active, p.updated_at, p.updated_by,
           COALESCE(u.total_count, 0) AS total_count,
           COALESCE(u.open_count, 0)  AS open_count
         FROM ${PRIORITY_TABLE} p
         LEFT JOIN (
           SELECT
             Priority,
             COUNT(*) AS total_count,
             SUM(CASE WHEN Status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS open_count
           FROM ${EXCEPTION_TABLE}
           GROUP BY Priority
         ) u ON u.Priority = p.name
         ORDER BY p.is_active DESC, p.sort_order ASC
         LIMIT 100`,
        PriorityWithUsageRowSchema,
        [],
        { label: "Load priorities with usage counts" },
      ),
      // Exception priority values that no longer match any configured priority.
      db.query(
        `SELECT COALESCE(e.Priority, '(blank)') AS value, COUNT(*) AS cnt
         FROM ${EXCEPTION_TABLE} e
         WHERE NOT EXISTS (
           SELECT 1 FROM ${PRIORITY_TABLE} p WHERE p.name = e.Priority
         )
         GROUP BY COALESCE(e.Priority, '(blank)')
         ORDER BY cnt DESC
         LIMIT 50`,
        UnmatchedRowSchema,
        [],
        { label: "Find unmatched exception priorities" },
      ),
    ]);

    return {
      priorities: priorityRows.map((r) => ({
        priority_id: r.priority_id,
        name: r.name,
        color: r.color,
        sort_order: r.sort_order,
        sla_hours: r.sla_hours,
        description: r.description,
        is_active: toBool(r.is_active),
        updated_at: r.updated_at,
        updated_by: r.updated_by,
        total_count: r.total_count,
        open_count: r.open_count,
      })),
      unmatched: unmatchedRows.map((r) => ({ value: r.value, cnt: r.cnt })),
    };
  },
});
