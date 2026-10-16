import { api, z, databricks } from "@superblocksteam/sdk-api";
import { actorFrom, CountSchema, DATABRICKS_ID, PRIORITY_TABLE } from "./shared.js";

export default api({
  name: "ReactivatePriority",
  description: "Restores a retired priority for assignment",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({
    priority_id: z.string(),
  }),

  output: z.object({
    success: z.boolean(),
  }),

  async run(ctx, input) {
    const db = ctx.integrations.databricks_vumc;

    const [{ cnt }] = await db.query(
      `SELECT COUNT(*) AS cnt FROM ${PRIORITY_TABLE} WHERE priority_id = :PARAM_1`,
      CountSchema,
      [input.priority_id],
      { label: "Confirm priority exists" },
    );
    if (cnt === 0) throw new Error("That priority no longer exists. Refresh and try again.");

    await db.execute(
      `UPDATE ${PRIORITY_TABLE}
       SET is_active = true, updated_at = CURRENT_TIMESTAMP(), updated_by = :PARAM_1
       WHERE priority_id = :PARAM_2`,
      [actorFrom(ctx.user), input.priority_id],
      { label: "Reactivate priority" },
    );

    return { success: true };
  },
});
