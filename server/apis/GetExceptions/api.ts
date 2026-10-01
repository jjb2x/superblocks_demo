import { api, z, databricks } from "@superblocksteam/sdk-api";

const DATABRICKS_INTEGRATION_ID =
  "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

const ExceptionRow = //z.record(z.unknown()); //temporary placeholder to test connection
z.object({
  ID: z.string(),
  Created: z.string(),
  Location: z.string(),
  Service_Type: z.string(),
  Category: z.string(),
  Subtype: z.string(),
  Priority: z.string(),
  Status: z.string(),
  Owner: z.string(),
  Days_Open: z.number(),
  Rx_Affected: z.number(),
  Due_Date: z.string(),
  Note: z.string().nullable(),
});

export default api({
    integrations: {
        databricks: databricks(DATABRICKS_INTEGRATION_ID),
    },

    input: z.object({}),

    output: z.array(ExceptionRow),

    async run(ctx) {
        const rows = await ctx.integrations.databricks.query(
            `
      SELECT
        ID,
        Created,
        Location,
        \`Service Type\` as Service_Type,
        Category,
        Subtype,
        Priority,
        Status,
        Owner,
        \`Days Open\` as Days_Open,
        \`Rx Affected\` as Rx_Affected,
        \`Due Date\` as Due_Date,
        Note
      FROM workspace.default.exception_queue
      ORDER BY Created DESC
      LIMIT 200
      `,
            ExceptionRow
        );

        return rows;
    },
    name: ""
});