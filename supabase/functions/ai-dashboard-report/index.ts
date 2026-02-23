import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);

    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { church_id, period = "7d", context } = await req.json();
    if (!church_id) throw new Error("church_id obrigatório");

    // Check AI access
    const { data: cf } = await supabase.from("church_features").select("ai_enabled, ai_trial_enabled, ai_trial_end").eq("church_id", church_id).maybeSingle();
    const hasAccess = cf?.ai_enabled || (cf?.ai_trial_enabled && cf?.ai_trial_end && new Date() <= new Date(cf.ai_trial_end));
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "premium_required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check for cached report (today)
    const today = new Date().toISOString().split("T")[0];
    const { data: cached } = await supabase
      .from("ai_dashboard_reports")
      .select("*")
      .eq("church_id", church_id)
      .eq("period", period)
      .gte("generated_at", today + "T00:00:00Z")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ report: cached.report_text, generated_at: cached.generated_at, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather stats
    const days = period === "30d" ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];

    const [membersRes, reportsRes, visitorsRes] = await Promise.all([
      supabase.from("members").select("id", { count: "exact" }).eq("church_id", church_id).eq("is_active", true),
      supabase.from("cell_reports").select("attendance, visitors, conversions, report_date").eq("church_id", church_id).gte("report_date", sinceStr),
      supabase.from("cell_visitors").select("id", { count: "exact" }).eq("church_id", church_id).gte("visit_date", sinceStr),
    ]);

    const totalMembers = membersRes.count || 0;
    const reports = reportsRes.data || [];
    const avgAttendance = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.attendance, 0) / reports.length) : 0;
    const totalVisitors = visitorsRes.count || 0;
    const totalConversions = reports.reduce((s, r) => s + r.conversions, 0);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const prompt = `Gere um relatório inteligente pastoral em português brasileiro para os últimos ${days} dias.

Dados:
- Total de membros ativos: ${totalMembers}
- Relatórios de célula no período: ${reports.length}
- Presença média por encontro: ${avgAttendance}
- Visitantes no período: ${totalVisitors}
- Decisões/conversões: ${totalConversions}
${context?.additionalInfo ? `- Info adicional: ${context.additionalInfo}` : ""}

Formato:
1. Resumo geral (2-3 frases)
2. Pontos positivos (bullets)
3. Pontos de atenção (bullets)
4. Sugestões práticas (2-3 ações concretas)

Seja direto, pastoral e encorajador. Máximo 250 palavras.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um consultor pastoral especializado em análise de dados ministeriais. Responda em português brasileiro." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text().catch(() => "");
      await supabase.from("ai_error_logs").insert({
        church_id, user_id: user.id, feature: "dashboard_report",
        error_message: `AI gateway ${aiResp.status}: ${errText}`, provider_status: aiResp.status,
      });
      throw new Error(`Erro no gateway de IA: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const reportText = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o relatório.";

    // Cache the report
    await supabase.from("ai_dashboard_reports").insert({
      church_id, period, report_text: reportText, created_by: user.id,
    });

    return new Response(JSON.stringify({ report: reportText, generated_at: new Date().toISOString(), cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-dashboard-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
