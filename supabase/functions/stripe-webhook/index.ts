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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
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
    console.log("Stripe event:", event.type);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const churchId = session.metadata?.church_id;
      const userId = session.metadata?.user_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (!churchId || !userId) {
        console.error("Missing metadata in checkout session");
        return new Response("Missing metadata", { status: 400 });
      }

      // Get subscription details from Stripe
      const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      });
      const sub = await subRes.json();

      const priceId = sub.items?.data?.[0]?.price?.id || "";
      const plan = priceId === "price_1TMadmG15I82n9DcfTxw7Jgm" ? "anual" : "mensal";

      // Upsert subscription
      await supabase.from("subscriptions").upsert(
        {
          church_id: churchId,
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          plan,
          status: "ativo",
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "church_id" }
      );

      // Update church plan
      await supabase
        .from("churches")
        .update({ plan: "premium" })
        .eq("id", churchId);

      console.log(`Subscription activated for church ${churchId}`);
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        // Renew: update period
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const sub = await subRes.json();

        await supabase
          .from("subscriptions")
          .update({
            status: "ativo",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const subscriptionId = sub.id;

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

        console.log(`Subscription cancelled for church ${existingSub.church_id}`);
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
