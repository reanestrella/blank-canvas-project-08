export interface CellVisitorIdentity {
  full_name: string;
  phone?: string | null;
}

export const normalizeVisitorName = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export const normalizeVisitorPhone = (value: string | null | undefined) =>
  (value ?? "").replace(/\D/g, "");

export const buildVisitorIdentityKey = (
  fullName: string | null | undefined,
  phone: string | null | undefined,
) => `${normalizeVisitorName(fullName)}|${normalizeVisitorPhone(phone)}`;

export const buildCellVisitorKey = (
  fullName: string | null | undefined,
  phone: string | null | undefined,
  cellId: string,
) => `${cellId}|${buildVisitorIdentityKey(fullName, phone)}`;

export function dedupeVisitorEntries<T extends CellVisitorIdentity>(entries: T[]): T[] {
  const unique = new Map<string, T>();

  for (const entry of entries) {
    const fullName = entry.full_name?.trim();
    if (!fullName) continue;

    const phone = entry.phone?.trim() || null;
    const key = buildVisitorIdentityKey(fullName, phone);

    if (!unique.has(key)) {
      unique.set(key, { ...entry, full_name: fullName, phone } as T);
    }
  }

  return Array.from(unique.values());
}