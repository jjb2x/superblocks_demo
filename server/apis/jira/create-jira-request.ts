import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_ID = "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

export default api({
  name: "CreateJiraRequest",
  description: "Inserts a new JIRA request into Databricks",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({
    id: z.string(),
    space: z.string(),
    work_type: z.string(),
    status: z.string(),
    summary: z.string(),
    reporter: z.string(),
    component: z.string().nullable(),
    description: z.string().nullable(),
    requested_completion_date: z.string().nullable(),
  }),

  output: z.object({
    success: z.boolean(),
    id: z.string(),
  }),

  async run(ctx, input) {
    await ctx.integrations.databricks_vumc.execute(
      `INSERT INTO workspace.default.jira_requests
       (id, space, work_type, status, summary, reporter, component, description, requested_completion_date, created_at, updated_at)
       VALUES (:PARAM_1, :PARAM_2, :PARAM_3, :PARAM_4, :PARAM_5, :PARAM_6, :PARAM_7, :PARAM_8, :PARAM_9, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())`,
      [
        input.id,
        input.space,
        input.work_type,
        input.status,
        input.summary,
        input.reporter,
        input.component ?? "",
        input.description ?? "",
        input.requested_completion_date ?? "",
      ],
      { label: "Insert new JIRA request" }
    );

    return { success: true, id: input.id };
  },
});
