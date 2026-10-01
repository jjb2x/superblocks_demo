import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_ID = "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

const JiraRequestRow = z.object({
  id: z.string(),
  space: z.string(),
  work_type: z.string(),
  status: z.string(),
  summary: z.string(),
  reporter: z.string(),
  component: z.string().nullable(),
  description: z.string().nullable(),
  requested_completion_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type JiraRequest = z.infer<typeof JiraRequestRow>;

export default api({
  name: "GetJiraRequests",
  description: "Fetches all JIRA requests from Databricks",

  integrations: {
    databricks_vumc: databricks(DATABRICKS_ID),
  },

  input: z.object({}),

  output: z.object({
    requests: z.array(JiraRequestRow),
  }),

  async run(ctx) {
    const requests = await ctx.integrations.databricks_vumc.query(
      `SELECT id, space, work_type, status, summary, reporter,
              component, description, requested_completion_date,
              CAST(created_at AS STRING) as created_at,
              CAST(updated_at AS STRING) as updated_at
       FROM workspace.default.jira_requests
       ORDER BY created_at DESC
       LIMIT 200`,
      JiraRequestRow,
      [],
      { label: "Fetch JIRA requests" }
    );

    return { requests };
  },
});
