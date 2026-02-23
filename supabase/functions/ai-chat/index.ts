import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function checkAiAccess(supabase: any, churchId: string, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { data: churchFeature } = await supabase
    .from("church_features")
    .select("ai_enabled, ai_trial_enabled, ai_trial_end")
    .eq("church_id", churchId)
    .maybeSingle();

  if (churchFeature?.ai_enabled) return { allowed: true };

  if (churchFeature?.ai_trial_enabled && churchFeature?.ai_trial_end) {
    const now = new Date();
    const trialEnd = new Date(churchFeature.ai_trial_end);
    if (now <= trialEnd) return { allowed: true };
    await supabase.from("church_features").update({ ai_trial_enabled: false }).eq("church_id", churchId);
  }

  return { allowed: false, reason: "premium_required" };
}

async function logAiError(supabase: any, churchId: string, userId: string, feature: string, error: any, providerStatus?: number) {
  try {
    await supabase.from("ai_error_logs").insert({
      church_id: churchId,
      user_id: userId,
      feature,
      error_message: error?.message || String(error),
      error_stack: error?.stack || null,
      provider_status: providerStatus || null,
    });
  } catch (e) {
    console.error("Failed to log AI error:", e);
  }
}

async function callAiWithRetry(body: any, headers: any, maxRetries = 1): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (resp.ok || resp.status < 500) return resp;
      lastError = new Error(`AI gateway returned ${resp.status}`);
      (lastError as any).status = resp.status;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let churchId = "";
  let userId = "";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use SUPABASE_ANON_KEY (the correct env var name in edge functions)
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Usuário não autenticado");

    userId = user.id;
    const body = await req.json();
    const { message, church_id, context } = body;
    churchId = church_id;
    if (!message || !church_id) throw new Error("Mensagem e church_id são obrigatórios");

    const access = await checkAiAccess(supabase, church_id, user.id);
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: "premium_required", message: "Recurso disponível no plano premium." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limit
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await supabase
      .from("ai_usage_control")
      .select("*")
      .eq("church_id", church_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (usage) {
      if (usage.last_reset_date !== today) {
        await supabase.from("ai_usage_control").update({ executions_today: 1, last_reset_date: today }).eq("id", usage.id);
      } else if (usage.executions_today >= 10) {
        return new Response(JSON.stringify({ error: "limit_reached", message: "Limite diário de uso do assistente atingido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        await supabase.from("ai_usage_control").update({ executions_today: usage.executions_today + 1 }).eq("id", usage.id);
      }
    } else {
      await supabase.from("ai_usage_control").insert({ church_id, user_id: user.id, executions_today: 1, last_reset_date: today });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    // Build system prompt with optional context
    let systemPrompt = `Você é um assistente inteligente para líderes de igreja. Responda com foco em:
- Liderança cristã e discipulado
- Cuidado pastoral e acompanhamento de membros
- Crescimento de células e grupos pequenos
- Estratégias ministeriais práticas
Seja conciso, empático e baseado em princípios bíblicos. Responda sempre em português brasileiro.`;

    if (context) {
      systemPrompt += `\n\nContexto do líder:\n- Cargo: ${context.role || "não informado"}`;
      if (context.cellName) systemPrompt += `\n- Célula: ${context.cellName}`;
      if (context.avgAttendance !== undefined) systemPrompt += `\n- Presença média (30d): ${context.avgAttendance}`;
      if (context.absentCount !== undefined) systemPrompt += `\n- Faltosos recorrentes: ${context.absentCount}`;
      if (context.totalVisitors !== undefined) systemPrompt += `\n- Visitantes recentes: ${context.totalVisitors}`;
      if (context.totalMembers !== undefined) systemPrompt += `\n- Total de membros: ${context.totalMembers}`;
    }

    const requestBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      stream: true,
    };

    const aiResponse = await callAiWithRetry(requestBody, {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text().catch(() => "");
      await logAiError(supabase, church_id, user.id, "assistant_chat", new Error(errText), status);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit", message: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", message: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erro no gateway de IA (status ${status}): ${errText}`);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    // Log error to database if we have context
    if (churchId && userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await logAiError(supabase, churchId, userId, "assistant_chat", e);
      } catch (_) {}
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
