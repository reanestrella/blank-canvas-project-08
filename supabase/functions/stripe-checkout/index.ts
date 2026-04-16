import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function validateStripeSecretKey(key: string): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, error: "Key is empty" };
  if (trimmed.startsWith("pk_")) {
    return { valid: false, error: "This is a PUBLISHABLE key (pk_). You need the SECRET key (sk_)." };
  }
  if (!trimmed.startsWith("sk_test_") && !trimmed.startsWith("sk_live_")) {
    return { valid: false, error: `Invalid key format. Expected sk_test_ or sk_live_, got: ${trimmed.substring(0, 8)}...` };
  }
  if (trimmed.length < 20) return { valid: false, error: "Key appears too short." };
  return { valid: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate that the key is actually a secret key, not a publishable key
    const keyValidation = validateStripeSecretKey(STRIPE_SECRET_KEY);
    if (!keyValidation.valid) {
      console.error("Invalid STRIPE_SECRET_KEY:", keyValidation.error);
      return new Response(JSON.stringify({ error: "Stripe configuration error. Contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { price_id, coupon } = await req.json();
    if (!price_id) {
      return new Response(JSON.stringify({ error: "price_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile for church_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("church_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.church_id) {
      return new Response(JSON.stringify({ error: "No church linked" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing active subscription
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: existingSub } = await serviceClient
      .from("subscriptions")
      .select("id, status")
      .eq("church_id", profile.church_id)
      .single();

    if (existingSub?.status === "ativo") {
      return new Response(JSON.stringify({ error: "Você já possui uma assinatura ativa" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = Deno.env.get("APP_URL") || "https://churchonefy.com";

    // Build params - allow_promotion_codes lets the user type a code in checkout
    const params: Record<string, string> = {
      mode: "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": price_id,
      "line_items[0][quantity]": "1",
      success_url: `${baseUrl}/sucesso`,
      cancel_url: `${baseUrl}/cancelado`,
      customer_email: user.email!,
      "metadata[church_id]": profile.church_id,
      "metadata[user_id]": user.id,
    };

    // If a coupon was passed via URL, apply it automatically (discounts and allow_promotion_codes are mutually exclusive)
    if (coupon && typeof coupon === "string" && coupon.trim()) {
      const couponCode = coupon.trim();
      // Try to resolve as a Promotion Code first (user-friendly codes like WELCOME10)
      const promoRes = await fetch(
        `https://api.stripe.com/v1/promotion_codes?code=${encodeURIComponent(couponCode)}&active=true&limit=1`,
        { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
      );
      const promoData = await promoRes.json();
      const promo = promoData?.data?.[0];
      if (promo?.id) {
        params["discounts[0][promotion_code]"] = promo.id;
      } else {
        // Fallback: treat as raw coupon ID
        params["discounts[0][coupon]"] = couponCode;
      }
    } else {
      // No coupon in URL → let user enter one in Stripe Checkout
      params["allow_promotion_codes"] = "true";
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });

    const session = await stripeRes.json();

    if (session.error) {
      console.error("Stripe error:", session.error);
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
