import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

/* ── helpers ─────────────────────────────────────────────── */

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(",").reduce(
    (acc: Record<string, string>, part) => {
      const [key, value] = part.split("=");
      acc[key.trim()] = value;
      return acc;
    },
    {},
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

function safeTs(epoch: unknown): string | null {
  if (typeof epoch !== "number" || epoch <= 0) return null;
  try {
    const d = new Date(epoch * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

const ANNUAL_PRICE = "price_1TMadmG15I82n9DcfTxw7Jgm";

/* ── look up user by metadata OR by email ────────────────── */
async function resolveUser(
  supabase: ReturnType<typeof createClient>,
  metaUserId: string | undefined,
  metaChurchId: string | undefined,
  customerEmail: string | undefined,
): Promise<{ userId: string; churchId: string; email: string | null } | null> {
  // 1) Try metadata first (preferred, set by stripe-checkout)
  if (metaUserId && metaChurchId) {
    console.log("[resolveUser] Using metadata — userId:", metaUserId, "churchId:", metaChurchId);
    return { userId: metaUserId, churchId: metaChurchId, email: customerEmail ?? null };
  }

  // 2) Fallback: find user by email in auth.users → profiles
  if (customerEmail) {
    console.log("[resolveUser] Metadata incomplete, falling back to email lookup:", customerEmail);

    // Use admin API to find user by email
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
      console.error("[resolveUser] auth.admin.listUsers error:", authErr.message);
      return null;
    }

    const matchedUser = authUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase(),
    );

    if (!matchedUser) {
      console.error("[resolveUser] No auth user found for email:", customerEmail);
      return null;
    }

    // Get church from profile
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("church_id")
      .eq("user_id", matchedUser.id)
      .single();

    if (profErr || !profile?.church_id) {
      console.error("[resolveUser] Profile lookup failed for user:", matchedUser.id, profErr?.message);
      return null;
    }

    console.log("[resolveUser] Resolved via email — userId:", matchedUser.id, "churchId:", profile.church_id);
    return { userId: matchedUser.id, churchId: profile.church_id, email: customerEmail };
  }

  console.error("[resolveUser] No metadata AND no customer_email — cannot resolve user");
  return null;
}

/* ── fetch Stripe sub details ────────────────────────────── */
async function fetchStripeSub(subscriptionId: string, stripeKey: string) {
  const res = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );
  const sub = await res.json();
  if (sub.error) {
    console.error("[fetchStripeSub] Stripe error:", JSON.stringify(sub.error));
    return null;
  }
  return sub;
}

/* ── main handler ────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY");
      return new Response("Webhook not configured", { status: 500 });
    }

    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature");

    if (sigHeader) {
      const valid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error("❌ Invalid webhook signature");
        return new Response("Invalid signature", { status: 400 });
      }
      console.log("✅ Webhook signature verified");
    } else {
      console.warn("⚠️ No stripe-signature header — skipping verification");
    }

    const event = JSON.parse(body);
    console.log("📩 Stripe event:", event.type, "| id:", event.id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    /* ───── checkout.session.completed ───── */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("[checkout.session.completed] raw metadata:", JSON.stringify(session.metadata));
      console.log("[checkout.session.completed] customer:", session.customer, "email:", session.customer_email);

      const resolved = await resolveUser(
        supabase,
        session.metadata?.user_id,
        session.metadata?.church_id,
        session.customer_email || session.customer_details?.email,
      );

      if (!resolved) {
        console.error("❌ Could not resolve user for checkout session:", session.id);
        return new Response(JSON.stringify({ received: true, warning: "user_not_resolved" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { userId, churchId, email } = resolved;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      let plan = "mensal";
      let periodStart: string | null = null;
      let periodEnd: string | null = null;
      let priceId = "";

      if (subscriptionId) {
        const sub = await fetchStripeSub(subscriptionId, STRIPE_SECRET_KEY);
        if (sub) {
          priceId = sub.items?.data?.[0]?.price?.id || "";
          plan = priceId === ANNUAL_PRICE ? "anual" : "mensal";
          periodStart = safeTs(sub.current_period_start);
          periodEnd = safeTs(sub.current_period_end);
          console.log("[checkout] Stripe sub details — plan:", plan, "period:", periodStart, "→", periodEnd);
        }
      }

      const upsertData = {
        church_id: churchId,
        user_id: userId,
        email: email || null,
        stripe_customer_id: customerId || null,
        stripe_subscription_id: subscriptionId || null,
        price_id: priceId || null,
        plan,
        status: "ativo",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      };
      console.log("[checkout] Upserting subscription:", JSON.stringify(upsertData));

      const { data: upserted, error: upsertError } = await supabase
        .from("subscriptions")
        .upsert(upsertData, { onConflict: "church_id" })
        .select("id")
        .single();

      if (upsertError) {
        console.error("❌ Subscription upsert error:", JSON.stringify(upsertError));
        return new Response(JSON.stringify({ error: "db_upsert_failed", detail: upsertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("✅ Subscription upserted — id:", upserted?.id);

      // Update church plan
      const { error: churchError } = await supabase
        .from("churches")
        .update({ plan: "premium" })
        .eq("id", churchId);

      if (churchError) {
        console.error("⚠️ Church plan update error:", JSON.stringify(churchError));
      }

      console.log(`✅ Subscription ACTIVATED for church ${churchId}, user ${userId}`);
    }

    /* ───── invoice.payment_succeeded ───── */
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      console.log("[invoice.payment_succeeded] subscriptionId:", subscriptionId, "paid:", invoice.paid);

      if (subscriptionId) {
        const sub = await fetchStripeSub(subscriptionId, STRIPE_SECRET_KEY);
        if (sub) {
          const periodStart = safeTs(sub.current_period_start);
          const periodEnd = safeTs(sub.current_period_end);

          // Try update first
          const { data: updated, error } = await supabase
            .from("subscriptions")
            .update({
              status: "ativo",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId)
            .select("id");

          if (error) {
            console.error("❌ Subscription update on invoice error:", JSON.stringify(error));
          } else if (!updated || updated.length === 0) {
            // No existing row — try to create via email fallback
            console.warn("⚠️ No subscription found for stripe_subscription_id:", subscriptionId, "— attempting email fallback");
            const customerEmail = invoice.customer_email;
            if (customerEmail) {
              const resolved = await resolveUser(supabase, undefined, undefined, customerEmail);
              if (resolved) {
                const priceId = sub.items?.data?.[0]?.price?.id || "";
                const plan = priceId === ANNUAL_PRICE ? "anual" : "mensal";
                const { error: insertErr } = await supabase.from("subscriptions").upsert({
                  church_id: resolved.churchId,
                  user_id: resolved.userId,
                  email: resolved.email,
                  stripe_customer_id: invoice.customer || null,
                  stripe_subscription_id: subscriptionId,
                  price_id: priceId || null,
                  plan,
                  status: "ativo",
                  current_period_start: periodStart,
                  current_period_end: periodEnd,
                  updated_at: new Date().toISOString(),
                }, { onConflict: "church_id" });
                if (insertErr) {
                  console.error("❌ Fallback upsert on invoice failed:", JSON.stringify(insertErr));
                } else {
                  console.log("✅ Subscription created via invoice fallback for", customerEmail);
                }
              }
            }
          } else {
            console.log(`✅ Subscription renewed for stripe_subscription_id ${subscriptionId}`);
          }
        }
      }
    }

    /* ───── customer.subscription.deleted ───── */
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const subscriptionId = sub.id;
      console.log("[customer.subscription.deleted] subscriptionId:", subscriptionId);

      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("church_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelado", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);

        await supabase
          .from("churches")
          .update({ plan: "free" })
          .eq("id", existingSub.church_id);

        console.log(`✅ Subscription CANCELLED for church ${existingSub.church_id}`);
      } else {
        console.warn("⚠️ No subscription found to cancel for:", subscriptionId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});
