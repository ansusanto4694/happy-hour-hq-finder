import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

// Webhooks don't need CORS (called by Stripe servers, not browsers)
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return new Response("Server misconfigured", { status: 500 });
  }
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const donorEmail =
          session.customer_details?.email ??
          session.customer_email ??
          null;

        const { error } = await supabaseAdmin
          .from("donations")
          .update({
            status: "completed",
            stripe_payment_intent_id: paymentIntentId,
            donor_email: donorEmail,
            amount_cents: session.amount_total ?? undefined,
          })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Failed to mark donation completed:", error);
          // Still return 200 — we don't want Stripe to retry forever for a DB hiccup
        } else {
          console.log(`Donation completed for session ${session.id}`);
        }
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { error } = await supabaseAdmin
          .from("donations")
          .update({ status: "failed" })
          .eq("stripe_session_id", session.id);
        if (error) console.error("Failed to mark donation failed:", error);
        break;
      }

      default:
        // Acknowledge other events without action
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook handler error:", msg);
    // Return 200 so Stripe doesn't retry on our internal bugs
    return new Response(JSON.stringify({ received: true, warning: msg }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
