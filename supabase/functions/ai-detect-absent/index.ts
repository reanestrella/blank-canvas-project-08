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

    const { church_id } = await req.json();
    if (!church_id) throw new Error("church_id é obrigatório");

    // Check AI access
    const { data: churchFeature } = await supabase
      .from("church_features")
      .select("ai_enabled")
      .eq("church_id", church_id)
      .maybeSingle();

    const { data: userFeature } = await supabase
      .from("user_features")
      .select("ai_enabled")
      .eq("user_id", user.id)
      .eq("church_id", church_id)
      .maybeSingle();

    if (!churchFeature?.ai_enabled && !userFeature?.ai_enabled) {
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

    // Increment usage
    if (usage) {
      if (usage.last_reset_date !== today) {
        await supabase.from("ai_usage_control").update({ executions_today: 1, last_reset_date: today }).eq("id", usage.id);
      } else {
        await supabase.from("ai_usage_control").update({ executions_today: usage.executions_today + 1 }).eq("id", usage.id);
      }
    } else {
      await supabase.from("ai_usage_control").insert({ church_id, user_id: user.id, executions_today: 1, last_reset_date: today });
    }

    // Get all active members
    const { data: members } = await supabase
      .from("members")
      .select("id, full_name, phone, last_attendance_date")
      .eq("church_id", church_id)
      .eq("is_active", true);

    if (!members || members.length === 0) {
      return new Response(JSON.stringify({ alerts: [], message: "Nenhum membro ativo encontrado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Also check cell_report_attendance for recent presence
    const { data: recentAttendance } = await supabase
      .from("cell_report_attendance")
      .select("member_id, present, report_id, created_at")
      .in("member_id", members.map(m => m.id))
      .eq("present", true)
      .gte("created_at", thirtyDaysAgo.toISOString());

    const recentPresentMembers = new Set((recentAttendance || []).map(a => a.member_id));

    // Detect absent members
    const absentMembers: any[] = [];
    for (const member of members) {
      const lastDate = member.last_attendance_date ? new Date(member.last_attendance_date) : null;
      const hasRecentAttendance = recentPresentMembers.has(member.id);

      if (hasRecentAttendance) continue;

      let daysAbsent = 0;
      if (lastDate) {
        daysAbsent = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        daysAbsent = 999; // never attended
      }

      if (daysAbsent >= 30) {
        let riskLevel = "baixo";
        if (daysAbsent >= 90) riskLevel = "alto";
        else if (daysAbsent >= 60) riskLevel = "medio";

        absentMembers.push({
          member_id: member.id,
          full_name: member.full_name,
          days_absent: daysAbsent,
          last_attendance_date: member.last_attendance_date,
          risk_level: riskLevel,
        });
      }
    }

    // Generate AI messages for absent members using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const alerts: any[] = [];

    if (absentMembers.length > 0 && LOVABLE_API_KEY) {
      const summaryText = absentMembers.slice(0, 20).map(m =>
        `- ${m.full_name}: ${m.days_absent === 999 ? "nunca registrou presença" : `${m.days_absent} dias ausente`} (risco: ${m.risk_level})`
      ).join("\n");

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "Você é um assistente pastoral. Para cada membro ausente, gere uma mensagem curta de alerta pastoral. Responda em JSON array com objetos {name, message}. Apenas o JSON, sem markdown.",
              },
              {
                role: "user",
                content: `Membros ausentes:\n${summaryText}\n\nGere uma mensagem de acompanhamento pastoral para cada um.`,
              },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          try {
            const parsed = JSON.parse(content);
            for (const item of parsed) {
              const member = absentMembers.find(m => m.full_name === item.name);
              if (member) {
                member.message = item.message;
              }
            }
          } catch {
            // If AI response isn't valid JSON, use default messages
          }
        }
      } catch (aiError) {
        console.error("AI message generation failed:", aiError);
      }
    }

    // Clear old unresolved alerts for this church and save new ones
    await supabase.from("ai_member_alerts").delete().eq("church_id", church_id).eq("resolved", false);

    for (const member of absentMembers) {
      const defaultMsg = `O membro ${member.full_name} está há ${member.days_absent === 999 ? "muito tempo" : member.days_absent + " dias"} sem participar. Recomenda-se acompanhamento pastoral.`;

      await supabase.from("ai_member_alerts").insert({
        church_id,
        member_id: member.member_id,
        risk_level: member.risk_level,
        message: member.message || defaultMsg,
        last_attendance_date: member.last_attendance_date,
        days_absent: member.days_absent === 999 ? null : member.days_absent,
      });

      alerts.push({
        member_id: member.member_id,
        full_name: member.full_name,
        risk_level: member.risk_level,
        days_absent: member.days_absent,
        message: member.message || defaultMsg,
      });
    }

    return new Response(JSON.stringify({ alerts, total: alerts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-detect-absent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
