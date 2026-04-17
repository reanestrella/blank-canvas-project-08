import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SyncSelfRegistrationOptions = {
  churchId?: string | null;
  congregationId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  tipo?: string | null;
  registrationStatus?: string | null;
  ensurePendingUser?: boolean;
};

const asNonEmptyString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function getRegistrationBinding(user?: Pick<User, "email" | "user_metadata"> | null) {
  const metadata = user?.user_metadata ?? {};
  const emailPrefix = asNonEmptyString(user?.email)?.split("@")[0] ?? null;

  return {
    churchId: asNonEmptyString(metadata.church_id),
    congregationId: asNonEmptyString(metadata.congregation_id),
    fullName:
      asNonEmptyString(metadata.full_name) ??
      asNonEmptyString(metadata.name) ??
      emailPrefix,
    phone: asNonEmptyString(metadata.phone),
    birthDate: asNonEmptyString(metadata.birth_date),
    tipo: asNonEmptyString(metadata.tipo) ?? "visitante",
  };
}

export async function syncSelfRegistrationProfile(
  user: User,
  options: SyncSelfRegistrationOptions = {},
) {
  const binding = getRegistrationBinding(user);
  const incomingChurchId = options.churchId ?? binding.churchId;

  if (!incomingChurchId) {
    return { churchId: null, congregationId: null, profile: null };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id, church_id, congregation_id, registration_status, is_linked")
    .eq("user_id", user.id)
    .maybeSingle();

  const churchId = existingProfile?.church_id ?? incomingChurchId;
  const congregationId = existingProfile?.congregation_id ?? options.congregationId ?? binding.congregationId;
  const fullName = options.fullName ?? binding.fullName ?? "Usuário";
  const phone = options.phone ?? binding.phone;
  const birthDate = options.birthDate ?? binding.birthDate;
  const tipo = options.tipo ?? binding.tipo ?? "visitante";
  const registrationStatus = existingProfile?.registration_status ?? options.registrationStatus ?? "pendente";
  const isLinked = existingProfile?.is_linked ?? false;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        full_name: fullName,
        phone: phone ?? null,
        church_id: churchId,
        congregation_id: congregationId ?? null,
        registration_status: registrationStatus,
        is_linked: isLinked,
      } as any,
      { onConflict: "user_id" },
    )
    .select("user_id, church_id, congregation_id")
    .single();

  if (profileError) {
    throw profileError;
  }

  if (profile?.church_id !== churchId) {
    throw new Error("A igreja do link não foi vinculada corretamente ao perfil.");
  }

  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: user.id,
      church_id: churchId,
      role: "membro",
    } as any,
    { onConflict: "user_id,church_id,role" },
  );

  if (roleError) {
    console.error("[SelfRegistration] role sync error:", roleError);
  }

  try {
    let existingPending: { id: string; status: string; user_id: string | null } | null = null;

    const { data: pendingByUserId } = await supabase
      .from("pending_users" as any)
      .select("id, status, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    existingPending = (pendingByUserId as typeof existingPending) ?? null;

    if (!existingPending && user.email) {
      const { data: pendingByEmail } = await supabase
        .from("pending_users" as any)
        .select("id, status, user_id")
        .eq("church_id", churchId)
        .ilike("email", user.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      existingPending = (pendingByEmail as typeof existingPending) ?? null;
    }

    if (existingPending?.id && !existingPending.user_id) {
      const { error: legacyPendingError } = await supabase
        .from("pending_users" as any)
        .update(
          {
            user_id: user.id,
            full_name: fullName,
            phone: phone ?? null,
            birth_date: birthDate ?? null,
            congregation_id: congregationId ?? null,
            tipo,
          } as any,
        )
        .eq("id", existingPending.id);

      if (legacyPendingError) {
        console.error("[SelfRegistration] legacy pending sync error:", legacyPendingError);
      }
    }

    if (options.ensurePendingUser) {
      const pendingStatus =
        existingPending?.status === "aprovado" || existingPending?.status === "rejeitado"
          ? existingPending.status
          : "pendente";

      const { error: pendingError } = await supabase.from("pending_users" as any).upsert(
        {
          user_id: user.id,
          full_name: fullName,
          email: user.email ?? null,
          phone: phone ?? null,
          birth_date: birthDate ?? null,
          church_id: churchId,
          congregation_id: congregationId ?? null,
          tipo,
          status: pendingStatus,
        } as any,
        { onConflict: "user_id" },
      );

      if (pendingError) {
        console.error("[SelfRegistration] pending user sync error:", pendingError);
      }
    }
  } catch (pendingSyncError) {
    console.error("[SelfRegistration] unexpected pending sync error:", pendingSyncError);
  }

  return { churchId, congregationId, profile };
}