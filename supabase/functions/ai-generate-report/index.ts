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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { report_id, church_id } = await req.json();
    if (!report_id || !church_id) throw new Error("report_id e church_id são obrigatórios");

    // Check AI access (including trial)
    const { data: churchFeature } = await supabase
      .from("church_features")
      .select("ai_enabled, ai_trial_enabled, ai_trial_end")
      .eq("church_id", church_id)
      .maybeSingle();

    let churchHasAi = !!churchFeature?.ai_enabled;
    if (!churchHasAi && churchFeature?.ai_trial_enabled && churchFeature?.ai_trial_end) {
      const now = new Date();
      const trialEnd = new Date(churchFeature.ai_trial_end);
      if (now <= trialEnd) {
        churchHasAi = true;
      } else {
        await supabase.from("church_features").update({ ai_trial_enabled: false }).eq("church_id", church_id);
      }
    }

    const { data: userFeature } = await supabase
      .from("user_features")
      .select("ai_enabled")
      .eq("user_id", user.id)
      .eq("church_id", church_id)
      .maybeSingle();

    if (!churchHasAi && !userFeature?.ai_enabled) {
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

    if (usage && usage.last_reset_date === today && usage.executions_today >= 10) {
      return new Response(JSON.stringify({ error: "limit_reached", message: "Limite diário de uso do assistente atingido." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (usage) {
      if (usage.last_reset_date !== today) {
        await supabase.from("ai_usage_control").update({ executions_today: 1, last_reset_date: today }).eq("id", usage.id);
      } else {
        await supabase.from("ai_usage_control").update({ executions_today: usage.executions_today + 1 }).eq("id", usage.id);
      }
    } else {
      await supabase.from("ai_usage_control").insert({ church_id, user_id: user.id, executions_today: 1, last_reset_date: today });
    }

    // Get report data
    const { data: report } = await supabase
      .from("cell_reports")
      .select("*")
      .eq("id", report_id)
      .eq("church_id", church_id)
      .single();

    if (!report) throw new Error("Relatório não encontrado");

    // Get attendance details
    const { data: attendance } = await supabase
      .from("cell_report_attendance")
      .select("member_id, present")
      .eq("report_id", report_id);

    const presentCount = (attendance || []).filter(a => a.present).length;
    const absentCount = (attendance || []).filter(a => !a.present).length;

    // Get cell name
    const { data: cell } = await supabase
      .from("cells")
      .select("name")
      .eq("id", report.cell_id)
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const prompt = `Gere um relatório pastoral breve para a reunião de célula com os seguintes dados:
- Célula: ${cell?.name || "Sem nome"}
- Data: ${report.report_date}
- Presentes: ${presentCount} membros (${absentCount} ausentes)
- Visitantes: ${report.visitors}
- Decisões por Cristo: ${report.conversions}
- Oferta: R$ ${report.offering || 0}
${report.notes ? `- Observações do líder: ${report.notes}` : ""}

Gere um texto pastoral de 2-3 parágrafos descrevendo o encontro, destacando pontos positivos e sugestões de acompanhamento.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente pastoral que gera relatórios de células/grupos pequenos. Escreva em português brasileiro, tom pastoral e edificante." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit", message: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro no gateway de IA");
    }

    const aiData = await aiResp.json();
    const generatedReport = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o relatório.";

    // Save to cell_reports
    await supabase.from("cell_reports").update({ ai_report: generatedReport }).eq("id", report_id);

    return new Response(JSON.stringify({ report: generatedReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
