import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE_URL = Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3";
const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")!;

const PLAN_VALUES: Record<string, number> = {
  mensal: 79.9,
  anual: 790.0,
};

async function asaas(path: string, init: RequestInit = {}) {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err: any = new Error(`Asaas ${path} [${res.status}] ${text}`);
    err.payload = data;
    throw err;
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10);
  const results: any[] = [];

  try {
    // Busca assinaturas Asaas que não estão ativas E vencem hoje ou antes
    const { data: subs, error } = await admin
      .from("subscriptions")
      .select("id, church_id, user_id, plan, status, due_date, is_gift, asaas_customer_id, payment_method")
      .eq("provider", "asaas")
      .neq("status", "ativo")
      .neq("status", "active")
      .eq("is_gift", false)
      .not("due_date", "is", null)
      .lte("due_date", today);

    if (error) throw error;

    for (const sub of subs || []) {
      try {
        // Não duplicar: se já existe asaas_payments pendente neste período (último 5 dias), pula
        const { data: existingPending } = await admin
          .from("asaas_payments")
          .select("id, asaas_payment_id")
          .eq("church_id", sub.church_id)
          .eq("status", "pending")
          .gte("created_at", new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (existingPending && existingPending.length > 0) {
          results.push({ church_id: sub.church_id, skipped: "pending_exists" });
          continue;
        }

        const plan = (sub.plan === "anual" ? "anual" : "mensal") as "mensal" | "anual";
        const value = PLAN_VALUES[plan];
        const billing = (sub.payment_method || "PIX").toString().toUpperCase() === "BOLETO" ? "BOLETO" : "PIX";

        const due = new Date();
        due.setDate(due.getDate() + (billing === "BOLETO" ? 3 : 1));
        const dueDate = due.toISOString().slice(0, 10);

        if (!sub.asaas_customer_id) {
          results.push({ church_id: sub.church_id, error: "no_customer" });
          continue;
        }

        const payment = await asaas("/payments", {
          method: "POST",
          body: JSON.stringify({
            customer: sub.asaas_customer_id,
            billingType: billing,
            value,
            dueDate,
            description: `Renovação ChurchOnefy - Plano ${plan}`,
            externalReference: `${sub.church_id}|${plan}|renew`,
          }),
        });

        let pixQrCode: string | null = null;
        let pixPayload: string | null = null;
        if (billing === "PIX") {
          try {
            const qr = await asaas(`/payments/${payment.id}/pixQrCode`);
            pixQrCode = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null;
            pixPayload = qr.payload || null;
          } catch (e) {
            console.warn("[renew] pix qr error", e);
          }
        }

        await admin.from("asaas_payments").insert({
          church_id: sub.church_id,
          user_id: sub.user_id,
          asaas_payment_id: payment.id,
          asaas_customer_id: sub.asaas_customer_id,
          billing_type: billing,
          plan,
          value,
          status: "pending",
          invoice_url: payment.invoiceUrl,
          bank_slip_url: payment.bankSlipUrl,
          pix_qr_code: pixQrCode,
          pix_payload: pixPayload,
          due_date: dueDate,
          raw_payload: payment,
        });

        await admin
          .from("subscriptions")
          .update({
            asaas_payment_id: payment.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        results.push({ church_id: sub.church_id, payment_id: payment.id, due: dueDate });
      } catch (e: any) {
        console.error("[renew] sub error", sub.id, e?.payload || e?.message);
        results.push({ church_id: sub.church_id, error: e?.message || String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[renew-subscriptions] fatal", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
