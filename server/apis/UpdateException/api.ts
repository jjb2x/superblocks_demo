import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_INTEGRATION_ID =
  "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

export default api({
    name: "UpdateException",
    integrations: {
    databricks: databricks(DATABRICKS_INTEGRATION_ID),
  },

  input: z.object({
    id: z.string(),
    status: z.string(),
    priority: z.string(),
    owner: z.string(),
    dueDate: z.string(),
  }),

  output: z.object({
    success: z.boolean(),
  }),

  async run(ctx, input) {
    await ctx.integrations.databricks.execute(
      `
      UPDATE workspace.default.exception_queue
      SET
        Status = :PARAM_1,
        Priority = :PARAM_2,
        Owner = :PARAM_3,
        \`Due Date\` =
          CASE
            WHEN :PARAM_4 = '' THEN NULL
            ELSE CAST(:PARAM_4 AS DATE)
          END
      WHERE ID = :PARAM_5
      `,
      [
        input.status,
        input.priority,
        input.owner,
        input.dueDate,
        input.id,
      ]
    );

    return {
      success: true,
    };
  },
});