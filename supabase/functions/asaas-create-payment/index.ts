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
    throw new Error(`Asaas ${path} [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string | undefined;

    const body = await req.json();
    const { plan, billing_type, church_id, cpf_cnpj } = body as {
      plan: "mensal" | "anual";
      billing_type: "PIX" | "BOLETO";
      church_id: string;
      cpf_cnpj?: string;
    };

    if (!plan || !PLAN_VALUES[plan]) throw new Error("Plano inválido");
    if (!["PIX", "BOLETO"].includes(billing_type)) throw new Error("billing_type inválido");
    if (!church_id) throw new Error("church_id obrigatório");

    const value = PLAN_VALUES[plan];

    // Buscar profile + nome
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle();

    const fullName = profile?.full_name || userEmail?.split("@")[0] || "Cliente";
    const email = profile?.email || userEmail;
    if (!email) throw new Error("Email do usuário não encontrado");

    // Reaproveita asaas_customer_id se já existir na subscription
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
          ...(cpf_cnpj ? { cpfCnpj: cpf_cnpj.replace(/\D/g, "") } : {}),
          externalReference: userId,
        }),
      });
      customerId = customer.id;
    }

    // Vencimento: hoje + 1 dia (boleto) / hoje (pix)
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

    // Salva log
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

    // Atualiza subscription com referência
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
          status: "trial", // mantém acesso atual; webhook ativa
        },
        { onConflict: "church_id" },
      );

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
        pix_qr_code: pixQrCode,
        pix_payload: pixPayload,
        due_date: dueDate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("asaas-create-payment error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
