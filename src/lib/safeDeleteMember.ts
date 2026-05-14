import { supabase } from "@/integrations/supabase/client";

/**
 * Excluir uma pessoa de forma segura, removendo todos os vínculos antes
 * (líder/vice de célula, consolidador, presenças, voluntários, escalas,
 * eventos, cursos, pastoral, etc.) e desvinculando o usuário do app e os
 * lançamentos financeiros (preservando o histórico).
 *
 * Implementado via RPC `safe_delete_member` (SECURITY DEFINER) — único ponto
 * autorizado a quebrar todas as FKs em uma única transação.
 */
export async function safeDeleteMember(memberId: string): Promise<{
  success: boolean;
  error?: string;
  summary?: Record<string, unknown>;
}> {
  try {
    const { data, error } = await supabase.rpc("safe_delete_member" as any, {
      p_member_id: memberId,
    });
    if (error) {
      console.error("[safeDeleteMember] RPC error:", error);
      return { success: false, error: error.message };
    }
    const result = data as { success: boolean; error?: string; summary?: any };
    if (!result?.success) {
      console.error("[safeDeleteMember] failed:", result?.error);
      return { success: false, error: result?.error || "unknown_error" };
    }
    return { success: true, summary: result.summary };
  } catch (e: any) {
    console.error("[safeDeleteMember] unexpected:", e);
    return { success: false, error: e?.message || "unexpected_error" };
  }
}
