import { api, z, databricks } from "@superblocksteam/sdk-api";
import {
  actorFrom,
  CountSchema,
  DATABRICKS_ID,
  EXCEPTION_TABLE,
  normalizePriorityName,
  PRIORITY_COLORS,
  PRIORITY_COLUMNS,
  PRIORITY_TABLE,
  PriorityRowSchema,
} from "./shared.js";

const IdSchema = z.object({ priority_id: z.string() });
const MaxSchema = z.object({ max_order: z.coerce.number().nullable() });

export default api({
  name: "SavePriority",
  description: "Creates or updates a priority and cascades renames",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({
    /** null creates a new priority */
    priority_id: z.string().nullable(),
    name: z.string(),
    color: z.enum(PRIORITY_COLORS),
    sla_hours: z.number().int().min(1).max(8760).nullable(),
    description: z.string().max(300).nullable(),
  }),

  output: z.object({
    priority_id: z.string(),
    name: z.string(),
    created: z.boolean(),
    /** Number of exceptions renamed to the new priority name */
    cascadedCount: z.number(),
  }),

  async run(ctx, input) {
    const db = ctx.integrations.databricks_vumc;
    const name = normalizePriorityName(input.name);
    const description = input.description?.trim() || null;
    const actor = actorFrom(ctx.user);

    // Names must be unique (case-insensitive), excluding the row being edited.
    const [{ cnt: duplicates }] = await db.query(
      `SELECT COUNT(*) AS cnt FROM ${PRIORITY_TABLE}
       WHERE LOWER(name) = LOWER(:PARAM_1) AND priority_id <> :PARAM_2`,
      CountSchema,
      [name, input.priority_id ?? ""],
      { label: "Check for duplicate priority name" },
    );
    if (duplicates > 0) {
      throw new Error(`A priority named "${name}" already exists.`);
    }

    // ---- Create ----
    if (input.priority_id === null) {
      const ids = await db.query(
        `SELECT priority_id FROM ${PRIORITY_TABLE} LIMIT 1000`,
        IdSchema,
        [],
        { label: "Load existing priority IDs" },
      );
      const maxNum = ids.reduce((max, { priority_id }) => {
        const n = Number(priority_id.replace(/^PRI-/, ""));
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
      const newId = `PRI-${String(maxNum + 1).padStart(3, "0")}`;

      const [{ max_order }] = await db.query(
        `SELECT MAX(sort_order) AS max_order FROM ${PRIORITY_TABLE}`,
        MaxSchema,
        [],
        { label: "Find next sort order" },
      );

      await db.execute(
        `INSERT INTO ${PRIORITY_TABLE}
           (priority_id, name, color, sort_order, sla_hours, description, is_active, created_at, updated_at, updated_by)
         VALUES (:PARAM_1, :PARAM_2, :PARAM_3, :PARAM_4, :PARAM_5, :PARAM_6, true, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), :PARAM_7)`,
        [newId, name, input.color, (max_order ?? 0) + 1, input.sla_hours, description, actor],
        { label: "Insert new priority" },
      );

      return { priority_id: newId, name, created: true, cascadedCount: 0 };
    }

    // ---- Update ----
    const existingRows = await db.query(
      `SELECT ${PRIORITY_COLUMNS} FROM ${PRIORITY_TABLE} WHERE priority_id = :PARAM_1 LIMIT 1`,
      PriorityRowSchema,
      [input.priority_id],
      { label: "Load priority being edited" },
    );
    const existing = existingRows[0];
    if (!existing) {
      throw new Error("That priority no longer exists. Refresh and try again.");
    }

    const renamed = existing.name !== name;
    let cascadedCount = 0;
    if (renamed) {
      const [{ cnt }] = await db.query(
        `SELECT COUNT(*) AS cnt FROM ${EXCEPTION_TABLE} WHERE Priority = :PARAM_1`,
        CountSchema,
        [existing.name],
        { label: "Count exceptions using old name" },
      );
      cascadedCount = cnt;
    }

    await db.execute(
      `UPDATE ${PRIORITY_TABLE}
       SET name = :PARAM_1, color = :PARAM_2, sla_hours = :PARAM_3, description = :PARAM_4,
           updated_at = CURRENT_TIMESTAMP(), updated_by = :PARAM_5
       WHERE priority_id = :PARAM_6`,
      [name, input.color, input.sla_hours, description, actor, input.priority_id],
      { label: "Update priority settings" },
    );

    if (renamed && cascadedCount > 0) {
      try {
        await db.execute(
          `UPDATE ${EXCEPTION_TABLE} SET Priority = :PARAM_1 WHERE Priority = :PARAM_2`,
          [name, existing.name],
          { label: "Cascade rename to exceptions" },
        );
      } catch (error) {
        // Roll the priority name back so exceptions and settings stay in sync.
        await db.execute(
          `UPDATE ${PRIORITY_TABLE} SET name = :PARAM_1 WHERE priority_id = :PARAM_2`,
          [existing.name, input.priority_id],
          { label: "Revert priority rename" },
        );
        throw error;
      }
    }

    return { priority_id: input.priority_id, name, created: false, cascadedCount };
  },
});
