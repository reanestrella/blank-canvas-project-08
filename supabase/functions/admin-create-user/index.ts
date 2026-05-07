import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role =
  | "pastor"
  | "tesoureiro"
  | "secretario"
  | "lider_celula"
  | "lider_ministerio"
  | "consolidacao"
  | "membro";

const ALLOWED_ROLES: Role[] = [
  "pastor",
  "tesoureiro",
  "secretario",
  "lider_celula",
  "lider_ministerio",
  "consolidacao",
  "membro",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ error: "missing_auth" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const callerId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { full_name, email, password, role, church_id, hide_financial, permissions, cell_ids } = body as {
      full_name?: string;
      email?: string;
      password?: string;
      role?: Role;
      church_id?: string;
      hide_financial?: boolean;
      permissions?: string[] | null;
      cell_ids?: string[] | null;
    };

    if (!email || !password || !role || !church_id) {
      return json({ error: "missing_fields" }, 400);
    }
    if (!ALLOWED_ROLES.includes(role)) return json({ error: "invalid_role" }, 400);
    if (password.length < 6) return json({ error: "weak_password" }, 400);

    // Authorize: caller must be admin of this church
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("church_id", church_id);
    const isAdmin = (callerRoles ?? []).some((r: any) =>
      ["pastor", "secretario", "tesoureiro"].includes(r.role)
    );
    if (!isAdmin) return json({ error: "not_authorized" }, 403);

    // Try to find existing user by email
    let targetUserId: string | null = null;
    const { data: existing } = await admin
      .from("profiles")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();
    if (existing?.user_id) targetUserId = existing.user_id;

    if (!targetUserId) {
      // Search via auth admin list (paginated, simple lookup)
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name ?? "" },
      });
      if (createErr) {
        // If user already exists in auth, try to fetch via list
        const msg = createErr.message?.toLowerCase() ?? "";
        if (msg.includes("registered") || msg.includes("exists")) {
          // fallback: search users by email
          // Note: admin.listUsers doesn't filter; we paginate up to a safe limit
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const found = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (!found) return json({ error: "user_exists_but_not_found" }, 500);
          targetUserId = found.id;
        } else {
          return json({ error: createErr.message }, 400);
        }
      } else {
        targetUserId = created.user!.id;
      }
    }

    // Upsert profile
    await admin
      .from("profiles")
      .upsert(
        {
          user_id: targetUserId,
          email,
          full_name: full_name ?? email.split("@")[0],
          church_id,
          registration_status: "ativo",
          hide_financial: !!hide_financial,
        },
        { onConflict: "user_id" }
      );

    // Insert member if not exists for this church
    const { data: existingMember } = await admin
      .from("members")
      .select("id")
      .eq("church_id", church_id)
      .eq("user_id", targetUserId)
      .maybeSingle();
    if (!existingMember) {
      await admin.from("members").insert({
        church_id,
        user_id: targetUserId,
        full_name: full_name ?? email.split("@")[0],
        email,
        is_active: true,
      });
    }

    // Insert role with permissions (idempotent: insert or update)
    const { error: roleInsErr } = await admin
      .from("user_roles")
      .upsert(
        { user_id: targetUserId, church_id, role, permissions: permissions ?? null },
        { onConflict: "user_id,church_id,role" }
      );
    if (roleInsErr) console.error("role upsert error", roleInsErr);

    // Cell leader links (if provided)
    if (Array.isArray(cell_ids) && cell_ids.length > 0) {
      for (const cellId of cell_ids) {
        await admin
          .from("cell_leaders")
          .upsert(
            { user_id: targetUserId, cell_id: cellId, church_id },
            { onConflict: "user_id,cell_id", ignoreDuplicates: true }
          );
      }
    }

    return json({ success: true, user_id: targetUserId });
  } catch (e: any) {
    console.error("admin-create-user error:", e);
    return json({ error: e?.message ?? "internal_error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
