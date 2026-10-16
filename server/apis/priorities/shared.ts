import { z } from "@superblocksteam/sdk-api";

/** Existing "databricks vumc demo" integration. */
export const DATABRICKS_ID = "fec4c713-ef05-4e2c-82f2-5c33f8ac15b7";

export const PRIORITY_TABLE = "workspace.default.exception_priorities";
export const EXCEPTION_TABLE = "workspace.default.exception_queue";

/** Color keys the UI knows how to render. Kept in sync with client/data/priorityColors.ts. */
export const PRIORITY_COLORS = [
  "red", "orange", "amber", "yellow", "green", "teal", "blue", "indigo", "violet", "slate",
] as const;

/** Databricks may return BOOLEAN as a boolean, string, or number depending on the driver. */
export function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

export const PriorityRowSchema = z.object({
  priority_id: z.string(),
  name: z.string(),
  color: z.string(),
  sort_order: z.coerce.number(),
  sla_hours: z.coerce.number().nullable(),
  description: z.string().nullable(),
  is_active: z.union([z.boolean(), z.string(), z.number()]),
  updated_at: z.coerce.string().nullable(),
  updated_by: z.string().nullable(),
});

export type PriorityRow = z.infer<typeof PriorityRowSchema>;

/** Plain (no coercion/transform) shape used in API output schemas. */
export const PriorityOutputSchema = z.object({
  priority_id: z.string(),
  name: z.string(),
  color: z.string(),
  sort_order: z.number(),
  sla_hours: z.number().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  updated_at: z.string().nullable(),
  updated_by: z.string().nullable(),
});

export const CountSchema = z.object({ cnt: z.coerce.number() });

export const PRIORITY_COLUMNS =
  "priority_id, name, color, sort_order, sla_hours, description, is_active, updated_at, updated_by";

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &/()\-]*$/;

/** Trims, collapses whitespace, and validates a priority name. Throws on invalid input. */
export function normalizePriorityName(raw: string): string {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 40) {
    throw new Error("Priority name must be between 1 and 40 characters.");
  }
  if (!NAME_PATTERN.test(name)) {
    throw new Error("Priority name may only contain letters, numbers, spaces, and - & / ( ).");
  }
  return name;
}

export function actorFrom(user: { email?: string; name?: string; userId: string }): string {
  return user.email ?? user.name ?? user.userId;
}
