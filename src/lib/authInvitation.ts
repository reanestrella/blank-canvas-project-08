import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProfile } from "@/lib/authProfile";
import { isValidUUID } from "@/lib/getRoleBasedRedirect";

type InvitationData = {
  id: string;
  email: string | null;
  role: string;
  church_id: string;
  full_name: string | null;
  congregation_id: string | null;
  member_id: string | null;
  expires_at: string;
  used_at: string | null;
  status?: string;
};

export async function fetchInvitationByToken(token: string) {
  if (!isValidUUID(token)) {
    throw new Error("Convite inválido.");
  }

  const { data, error } = await supabase.rpc("validate_invitation" as any, {
    p_token: token,
  } as any);

  if (error) {
    console.error("[Invite] validate invitation error:", error);
    throw error;
  }

  const invitation = (Array.isArray(data) ? data[0] : data) as InvitationData | null;
  if (!invitation) {
    throw new Error("Convite inválido, expirado ou já utilizado.");
  }

  console.log("[Invite] invitation loaded:", invitation);
  return invitation;
}

export async function applyInvitationForUser(token: string, user: Pick<User, "id" | "email" | "user_metadata">) {
  if (!isValidUUID(token)) {
    throw new Error("Convite inválido.");
  }

  await ensureUserProfile(user);

  console.log("[Invite] applying invitation", { token, userId: user.id });
  const { data, error } = await supabase.rpc("aceitar_convite", {
    p_token: token,
    p_user_id: user.id,
  });

  if (error) {
    console.error("[Invite] accept invitation error:", error);
    throw error;
  }

  const result = data as { success?: boolean; error?: string; roles?: string[]; church_id?: string | null } | null;
  if (result?.success === false) {
    throw new Error(result.error || "Não foi possível aceitar o convite.");
  }

  console.log("[Invite] invitation applied:", result);
  return {
    churchId: result?.church_id ?? null,
    roles: Array.isArray(result?.roles) ? result.roles : [],
  };
}