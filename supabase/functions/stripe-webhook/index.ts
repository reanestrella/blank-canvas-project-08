import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",").reduce((acc: Record<string, string>, part) => {
    const [key, value] = part.split("=");
    acc[key.trim()] = value;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === signature;
}

function safeTimestamp(epochSeconds: number | undefined | null): string | null {
  if (!epochSeconds || typeof epochSeconds !== "number" || epochSeconds <= 0) {
    return null;
  }
  try {
    const d = new Date(epochSeconds * 1000);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY");
      return new Response("Webhook not configured", { status: 500 });
    }

    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature");

    if (sigHeader) {
      const valid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error("Invalid webhook signature");
        return new Response("Invalid signature", { status: 400 });
      }
    }

    const event = JSON.parse(body);
    console.log("Stripe event:", event.type, "| event id:", event.id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const churchId = session.metadata?.church_id;
      const userId = session.metadata?.user_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      console.log("checkout.session.completed metadata:", {
        churchId,
        userId,
        customerId,
        subscriptionId,
        paymentStatus: session.payment_status,
      });

      if (!churchId || !userId) {
        console.error("Missing metadata in checkout session:", JSON.stringify(session.metadata));
        return new Response("Missing metadata", { status: 400 });
      }

      // Get subscription details from Stripe
      let plan = "mensal";
      let periodStart: string | null = null;
      let periodEnd: string | null = null;
      let priceId = "";

      if (subscriptionId) {
        console.log("Fetching subscription from Stripe:", subscriptionId);
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const sub = await subRes.json();

        if (sub.error) {
          console.error("Stripe subscription fetch error:", JSON.stringify(sub.error));
        } else {
          console.log("Stripe subscription data:", {
            status: sub.status,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            items: sub.items?.data?.length,
          });

          priceId = sub.items?.data?.[0]?.price?.id || "";
          plan = priceId === "price_1TMcPV5B9agydLDZy00bre4z" ? "anual" : "mensal";
          periodStart = safeTimestamp(sub.current_period_start);
          periodEnd = safeTimestamp(sub.current_period_end);
        }
      }

      // Upsert subscription
      const upsertData = {
        church_id: churchId,
        user_id: userId,
        stripe_customer_id: customerId || null,
        stripe_subscription_id: subscriptionId || null,
        price_id: priceId || null,
        plan,
        status: "ativo",
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      };
      console.log("Upserting subscription:", JSON.stringify(upsertData));

      const { error: upsertError } = await supabase.from("subscriptions").upsert(
        upsertData,
        { onConflict: "church_id" }
      );

      if (upsertError) {
        console.error("Subscription upsert error:", JSON.stringify(upsertError));
        return new Response("DB error", { status: 500 });
      }

      // Update church plan
      const { error: churchError } = await supabase
        .from("churches")
        .update({ plan: "premium" })
        .eq("id", churchId);

      if (churchError) {
        console.error("Church update error:", JSON.stringify(churchError));
      }

      console.log(`✅ Subscription activated for church ${churchId}, user ${userId}`);
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      console.log("invoice.payment_succeeded:", { subscriptionId, paid: invoice.paid });

      if (subscriptionId) {
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const sub = await subRes.json();

        if (sub.error) {
          console.error("Stripe sub fetch error on invoice:", JSON.stringify(sub.error));
        } else {
          const periodStart = safeTimestamp(sub.current_period_start);
          const periodEnd = safeTimestamp(sub.current_period_end);

          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "ativo",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          if (error) {
            console.error("Subscription update error on invoice:", JSON.stringify(error));
          } else {
            console.log(`✅ Subscription renewed for stripe_subscription_id ${subscriptionId}`);
          }
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const subscriptionId = sub.id;

      console.log("customer.subscription.deleted:", { subscriptionId });

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

        console.log(`✅ Subscription cancelled for church ${existingSub.church_id}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});
