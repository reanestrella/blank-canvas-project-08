import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const err: any = new Error(`Asaas ${path} [${res.status}]`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ASAAS_API_KEY) {
      console.error("[asaas] ASAAS_API_KEY não configurada");
      return jsonResponse({ success: false, error: "ASAAS_API_KEY não configurada" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      console.error("[asaas] auth.getUser falhou:", userErr);
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    const body = await req.json().catch(() => ({}));
    const { plan, billing_type, church_id, cpf_cnpj } = body as {
      plan: "mensal" | "anual";
      billing_type: "PIX" | "BOLETO";
      church_id: string;
      cpf_cnpj?: string;
    };

    if (!plan || !PLAN_VALUES[plan]) return jsonResponse({ success: false, error: "Plano inválido" }, 400);
    if (!["PIX", "BOLETO"].includes(billing_type)) return jsonResponse({ success: false, error: "billing_type inválido" }, 400);
    if (!church_id) return jsonResponse({ success: false, error: "church_id obrigatório" }, 400);

    const value = PLAN_VALUES[plan];

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    const fullName = profile?.full_name || userEmail?.split("@")[0] || "Cliente";
    const email = profile?.email || userEmail;
    if (!email) return jsonResponse({ success: false, error: "Email do usuário não encontrado" }, 400);

    const cleanedDoc = (cpf_cnpj || "").replace(/\D/g, "");
    if (!cleanedDoc || (cleanedDoc.length !== 11 && cleanedDoc.length !== 14)) {
      return jsonResponse(
        { success: false, error: "CPF ou CNPJ é obrigatório para gerar a cobrança", code: "cpf_cnpj_required" },
        400,
      );
    }

    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("asaas_customer_id")
      .eq("church_id", church_id)
      .maybeSingle();

    let customerId = existingSub?.asaas_customer_id as string | null;

    if (!customerId) {
      const customer = await asaas("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: fullName,
          email,
          cpfCnpj: cleanedDoc,
          externalReference: userId,
        }),
      });
      customerId = customer.id;
    } else {
      // Garante que CPF/CNPJ esteja atualizado no cliente Asaas
      try {
        await asaas(`/customers/${customerId}`, {
          method: "POST",
          body: JSON.stringify({ cpfCnpj: cleanedDoc, name: fullName, email }),
        });
      } catch (e) {
        console.warn("[asaas] não conseguiu atualizar customer existente:", (e as any)?.payload || e);
      }
    }

    const due = new Date();
    if (billing_type === "BOLETO") due.setDate(due.getDate() + 3);
    else due.setDate(due.getDate() + 1);
    const dueDate = due.toISOString().slice(0, 10);

    const payment = await asaas("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: billing_type,
        value,
        dueDate,
        description: `Assinatura ChurchOnefy - Plano ${plan}`,
        externalReference: `${church_id}|${plan}`,
      }),
    });

    let pixQrCode: string | null = null;
    let pixPayload: string | null = null;
    if (billing_type === "PIX") {
      const qr = await asaas(`/payments/${payment.id}/pixQrCode`);
      pixQrCode = qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null;
      pixPayload = qr.payload || null;
    }

    await admin.from("asaas_payments").insert({
      church_id,
      user_id: userId,
      asaas_payment_id: payment.id,
      asaas_customer_id: customerId,
      billing_type,
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
      .upsert(
        {
          church_id,
          user_id: userId,
          provider: "asaas",
          asaas_payment_id: payment.id,
          asaas_customer_id: customerId,
          payment_method: billing_type.toLowerCase(),
          plan,
          status: "trial",
        },
        { onConflict: "church_id" },
      );

    return jsonResponse({
      success: true,
      payment_id: payment.id,
      invoice_url: payment.invoiceUrl,
      bank_slip_url: payment.bankSlipUrl,
      pix_qr_code: pixQrCode,
      pix_payload: pixPayload,
      due_date: dueDate,
    });
  } catch (err: any) {
    const detail = err?.payload?.errors?.[0]?.description || err?.payload || err?.message || String(err);
    console.error("[asaas-create-payment] ERRO:", {
      message: err?.message,
      status: err?.status,
      payload: err?.payload,
    });
    return jsonResponse(
      {
        success: false,
        error: typeof detail === "string" ? detail : (err?.message ?? "Erro inesperado"),
        details: err?.payload ?? null,
      },
      err?.status && err.status < 500 ? 400 : 500,
    );
  }
});
