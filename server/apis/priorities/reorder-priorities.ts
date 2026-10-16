import { api, z, databricks } from "@superblocksteam/sdk-api";
import { DATABRICKS_ID, PRIORITY_TABLE } from "./shared.js";

const IdSchema = z.object({ priority_id: z.string() });

export default api({
  name: "ReorderPriorities",
  description: "Saves the display and sort order of priorities",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({
    /** Every priority ID, highest rank first */
    ordered_ids: z.array(z.string()).min(1).max(50),
  }),

  output: z.object({
    success: z.boolean(),
  }),

  async run(ctx, { ordered_ids }) {
    const db = ctx.integrations.databricks_vumc;

    if (new Set(ordered_ids).size !== ordered_ids.length) {
      throw new Error("Each priority can only appear once in the order.");
    }

    // Require the full set so a stale page can't leave gaps or collisions.
    const existing = await db.query(
      `SELECT priority_id FROM ${PRIORITY_TABLE} LIMIT 1000`,
      IdSchema,
      [],
      { label: "Load priority IDs" },
    );
    const existingIds = new Set(existing.map((r) => r.priority_id));
    const matches =
      existingIds.size === ordered_ids.length && ordered_ids.every((id) => existingIds.has(id));
    if (!matches) {
      throw new Error("The priority list changed since this page loaded. Refresh and try again.");
    }

    // :PARAM_n is bound to ordered_ids[n-1]; its position is the new sort order.
    const cases = ordered_ids.map((_, i) => `WHEN :PARAM_${i + 1} THEN ${i + 1}`).join(" ");
    const inList = ordered_ids.map((_, i) => `:PARAM_${i + 1}`).join(", ");

    await db.execute(
      `UPDATE ${PRIORITY_TABLE}
       SET sort_order = CASE priority_id ${cases} END,
           updated_at = CURRENT_TIMESTAMP()
       WHERE priority_id IN (${inList})`,
      ordered_ids,
      { label: "Update priority sort order" },
    );

    return { success: true };
  },
});
