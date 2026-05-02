import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const PAID_EVENTS = new Set([
  "PAYMENT_RECEIVED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED_IN_CASH",
]);

const FAIL_EVENTS = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validação simples opcional via token configurado no painel Asaas
    const expectedToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    if (expectedToken) {
      const got = req.headers.get("asaas-access-token");
      if (got !== expectedToken) {
        return new Response(JSON.stringify({ error: "invalid token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const event = await req.json();
    const eventType = event?.event as string | undefined;
    const payment = event?.payment;
    if (!eventType || !payment?.id) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Localiza o registro
    const { data: row } = await admin
      .from("asaas_payments")
      .select("id, church_id, user_id, plan")
      .eq("asaas_payment_id", payment.id)
      .maybeSingle();

    if (!row) {
      console.warn("Webhook: pagamento não encontrado", payment.id);
      return new Response(JSON.stringify({ ok: true, unknown: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (PAID_EVENTS.has(eventType)) {
      const now = new Date();
      const periodEnd = new Date(now);
      if (row.plan === "anual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

      await admin
        .from("asaas_payments")
        .update({ status: "paid", paid_at: now.toISOString(), raw_payload: event })
        .eq("id", row.id);

      await admin
        .from("subscriptions")
        .update({
          status: "ativo",
          trial: false,
          provider: "asaas",
          plan: row.plan,
          payment_method: (event?.payment?.billingType || "").toString().toLowerCase(),
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          due_date: periodEnd.toISOString().slice(0, 10),
          is_gift: false,
          updated_at: now.toISOString(),
        })
        .eq("church_id", row.church_id);
    } else if (FAIL_EVENTS.has(eventType)) {
      await admin
        .from("asaas_payments")
        .update({ status: eventType.toLowerCase(), raw_payload: event })
        .eq("id", row.id);
    } else {
      await admin
        .from("asaas_payments")
        .update({ raw_payload: event })
        .eq("id", row.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("asaas-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
