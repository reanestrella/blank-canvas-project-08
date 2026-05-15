/**
 * Origin type system — distinguishes real visitors from
 * imported / migrated members so historical metrics stay accurate.
 *
 * Used by Dashboard, SpiritualFunnel, Consolidação, Secretaria,
 * reports and PDFs through the centralized metrics helpers.
 */

export const ORIGIN_TYPES = [
  "real_visitor",
  "manual_member",
  "spreadsheet_import",
  "system_migration",
  "app_signup",
  "decision",
  "unknown",
] as const;

export type OriginType = (typeof ORIGIN_TYPES)[number];

/** Origins that count as a real first-time visitor in metrics. */
export const REAL_VISITOR_ORIGINS: ReadonlySet<OriginType> = new Set([
  "real_visitor",
  "decision", // came in via decisão pública / app
  "app_signup",
]);

/** Origins considered "imported / migrated" — excluded by default. */
export const IMPORTED_ORIGINS: ReadonlySet<OriginType> = new Set([
  "spreadsheet_import",
  "system_migration",
  "manual_member",
]);

export interface OriginAware {
  origin_type?: string | null;
}

/** Single source of truth: should this person be counted as a real visitor? */
export function isRealVisitor(member: OriginAware | undefined | null): boolean {
  if (!member) return false;
  const o = (member.origin_type || "unknown") as OriginType;
  // Unknown is treated as real (legacy data without flag).
  // Imported/migrated members are NOT real visitors.
  return !IMPORTED_ORIGINS.has(o);
}

/** Default origin used by the manual MemberModal based on initial spiritual_status. */
export function defaultOriginForStatus(status?: string | null): OriginType {
  if (status === "visitante") return "real_visitor";
  if (status === "novo_convertido") return "decision";
  return "manual_member";
}
