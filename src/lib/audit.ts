import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "export_pdf"
  | "export_csv"
  | "assign_consolidator"
  | "remove_visitor"
  | "login"
  | "logout";

export interface AuditEntry {
  action: AuditAction | string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
}

/** Registra uma ação no audit_logs. Falha silenciosa para nunca quebrar a UI. */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("church_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const churchId = (profile as any)?.church_id;
    if (!churchId) return;

    await supabase.from("audit_logs" as any).insert({
      user_id: user.id,
      church_id: churchId,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      details: entry.details ?? null,
    });
  } catch (e) {
    console.warn("[audit] log failed (silent):", e);
  }
}
