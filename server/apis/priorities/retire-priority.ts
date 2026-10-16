import { api, z, databricks } from "@superblocksteam/sdk-api";
import {
  actorFrom,
  CountSchema,
  DATABRICKS_ID,
  EXCEPTION_TABLE,
  PRIORITY_COLUMNS,
  PRIORITY_TABLE,
  PriorityRowSchema,
  toBool,
} from "./shared.js";

export default api({
  name: "RetirePriority",
  description: "Deactivates a priority and reassigns its exceptions",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({
    priority_id: z.string(),
    /** Required when any exceptions currently use the retiring priority */
    replacement_priority_id: z.string().nullable(),
  }),

  output: z.object({
    reassignedCount: z.number(),
    replacementName: z.string().nullable(),
  }),

  async run(ctx, input) {
    const db = ctx.integrations.databricks_vumc;
    const actor = actorFrom(ctx.user);

    const loadPriority = async (id: string) => {
      const rows = await db.query(
        `SELECT ${PRIORITY_COLUMNS} FROM ${PRIORITY_TABLE} WHERE priority_id = :PARAM_1 LIMIT 1`,
        PriorityRowSchema,
        [id],
        { label: "Load priority" },
      );
      return rows[0];
    };

    const target = await loadPriority(input.priority_id);
    if (!target) throw new Error("That priority no longer exists. Refresh and try again.");
    if (!toBool(target.is_active)) throw new Error(`"${target.name}" is already retired.`);

    const [{ cnt: activeCount }] = await db.query(
      `SELECT COUNT(*) AS cnt FROM ${PRIORITY_TABLE} WHERE is_active = true`,
      CountSchema,
      [],
      { label: "Count active priorities" },
    );
    if (activeCount <= 1) {
      throw new Error("At least one priority must stay active.");
    }

    const [{ cnt: inUse }] = await db.query(
      `SELECT COUNT(*) AS cnt FROM ${EXCEPTION_TABLE} WHERE Priority = :PARAM_1`,
      CountSchema,
      [target.name],
      { label: "Count exceptions using retiring priority" },
    );

    let replacementName: string | null = null;
    if (inUse > 0) {
      if (!input.replacement_priority_id) {
        throw new Error(`Choose a replacement priority for the ${inUse} exceptions using "${target.name}".`);
      }
      if (input.replacement_priority_id === input.priority_id) {
        throw new Error("The replacement must be a different priority.");
      }
      const replacement = await loadPriority(input.replacement_priority_id);
      if (!replacement || !toBool(replacement.is_active)) {
        throw new Error("The replacement priority must be active.");
      }
      replacementName = replacement.name;

      // Reassign first: if deactivation fails afterwards, the priority simply stays active.
      await db.execute(
        `UPDATE ${EXCEPTION_TABLE} SET Priority = :PARAM_1 WHERE Priority = :PARAM_2`,
        [replacement.name, target.name],
        { label: "Reassign exceptions to replacement" },
      );
    }

    await db.execute(
      `UPDATE ${PRIORITY_TABLE}
       SET is_active = false, updated_at = CURRENT_TIMESTAMP(), updated_by = :PARAM_1
       WHERE priority_id = :PARAM_2`,
      [actor, input.priority_id],
      { label: "Deactivate priority" },
    );

    return { reassignedCount: inUse, replacementName };
  },
});
