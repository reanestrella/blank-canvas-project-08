import { supabase } from "@/integrations/supabase/client";

/**
 * Validates that a report belongs to the given church (via cell -> church_id).
 * Returns true if valid, false otherwise.
 */
export async function validateReportBelongsToChurch(
  reportId: string,
  churchId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("cell_reports")
      .select("id, cell:cells!inner(church_id)")
      .eq("id", reportId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return false;

    const cell = Array.isArray(data.cell) ? data.cell[0] : data.cell;
    return cell?.church_id === churchId;
  } catch (e) {
    console.error("validateReportBelongsToChurch error:", e);
    return false;
  }
}

/**
 * Safe upsert for attendance with full error handling.
 */
export async function upsertAttendance(
  reportId: string,
  memberId: string,
  present: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("cell_report_attendance")
      .upsert(
        { report_id: reportId, member_id: memberId, present },
        { onConflict: "report_id,member_id" }
      );

    if (error) {
      console.error("upsertAttendance error:", error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("upsertAttendance exception:", e);
    return { success: false, error: e.message || "Erro desconhecido" };
  }
}

/**
 * Batch upsert attendance for multiple members.
 */
export async function batchUpsertAttendance(
  reportId: string,
  entries: { memberId: string; present: boolean }[]
): Promise<{ success: boolean; error?: string }> {
  if (entries.length === 0) return { success: true };

  try {
    const rows = entries.map((e) => ({
      report_id: reportId,
      member_id: e.memberId,
      present: e.present,
    }));

    const { error } = await supabase
      .from("cell_report_attendance")
      .upsert(rows, { onConflict: "report_id,member_id" });

    if (error) {
      console.error("batchUpsertAttendance error:", error.message, error.details, error.hint);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error("batchUpsertAttendance exception:", e);
    return { success: false, error: e.message || "Erro desconhecido" };
  }
}
