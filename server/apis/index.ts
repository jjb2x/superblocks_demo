/**
 * API Registry - Central export for all APIs.
 *
 * This file is the single source of truth for API definitions.
 * Add new APIs here to get full TypeScript support in the frontend.
 *
 * Usage:
 * 1. Import your API: `import MyApi from './MyApi/api.js';`
 * 2. Add it to the apis object below
 * 3. That's it! Types automatically flow to useApi via client/hooks/useApi.ts
 *
 * IMPORTANT: Use .js extension for imports (required for ESM compatibility)
 */

// Add your API imports here
import GetExceptions from "./GetExceptions/api.js";
import UpdateException from "./UpdateException/api.js";
import SetupJiraTable from "./jira/setup-jira-table.js";
import GetJiraRequests from "./jira/get-jira-requests.js";
import CreateJiraRequest from "./jira/create-jira-request.js";
import SetupQueryTables from "./queries/setup-query-tables.js";
import RunDatabricksQuery from "./queries/run-databricks-query.js";

const apis = {
    GetExceptions,
    UpdateException,
    SetupJiraTable,
    GetJiraRequests,
    CreateJiraRequest,
    SetupQueryTables,
    RunDatabricksQuery,
} as const;

export default apis;

/** Type for useApi inference - exported for client type-only imports */
export type ApiRegistry = typeof apis;
