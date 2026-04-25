import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MIN_CENTS = 100;       // $1
const MAX_CENTS = 1_000_000; // $10,000

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const amount_cents = Number(body?.amount_cents);
    const donor_name =
      typeof body?.donor_name === "string" ? body.donor_name.slice(0, 100) : null;
    const message =
      typeof body?.message === "string" ? body.message.slice(0, 280) : null;
    const session_id =
      typeof body?.session_id === "string" ? body.session_id.slice(0, 100) : null;

    if (
      !Number.isInteger(amount_cents) ||
      amount_cents < MIN_CENTS ||
      amount_cents > MAX_CENTS
    ) {
      return new Response(
        JSON.stringify({
          error: `Amount must be an integer between ${MIN_CENTS} and ${MAX_CENTS} cents`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Try to identify logged-in user (optional)
    let user_id: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const supaAuth = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data } = await supaAuth.auth.getUser();
        user_id = data.user?.id ?? null;
      } catch (_) {
        // ignore — anonymous donations are fine
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const origin =
      req.headers.get("origin") ??
      req.headers.get("referer") ??
      "https://sipmunchyap.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SipMunchYap Donation",
              description:
                "Thank you for supporting SipMunchYap. Your contribution helps us keep happy hour deals fresh and free for everyone.",
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      customer_creation: "always",
      success_url: `${origin}/donate/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate`,
      metadata: {
        donor_name: donor_name ?? "",
        message: message ?? "",
        analytics_session_id: session_id ?? "",
        user_id: user_id ?? "",
      },
    });

    // Insert pending donation row using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: insertError } = await supabaseAdmin.from("donations").insert({
      stripe_session_id: session.id,
      amount_cents,
      currency: "usd",
      status: "pending",
      donor_name,
      message,
      user_id,
      session_id,
    });

    if (insertError) {
      console.error("Failed to insert pending donation:", insertError);
      // Continue anyway — webhook will reconcile
    }

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("create-donation-checkout error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
