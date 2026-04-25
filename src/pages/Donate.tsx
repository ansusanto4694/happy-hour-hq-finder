import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";

const PRESET_AMOUNTS = [5, 10, 25, 50];

const Donate = () => {
  const [amount, setAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const finalCents = (() => {
    const value = customAmount ? parseFloat(customAmount) : amount;
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(value * 100);
  })();

  const handleDonate = async () => {
    if (finalCents < 100) {
      toast.error("Please choose at least $1.");
      return;
    }
    if (finalCents > 1_000_000) {
      toast.error("Maximum donation is $10,000. Contact us for larger gifts.");
      return;
    }

    setLoading(true);
    try {
      const sessionId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("smy_session_id") ?? null
          : null;

      const { data, error } = await supabase.functions.invoke(
        "create-donation-checkout",
        {
          body: {
            amount_cents: finalCents,
            donor_name: donorName.trim() || null,
            message: message.trim() || null,
            session_id: sessionId,
          },
        },
      );

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`Could not start checkout: ${msg}`);
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Support SipMunchYap — Donate"
        description="Help keep SipMunchYap free and our 1,000+ NYC happy hour listings fresh. Every donation helps us cover hosting and grow."
        canonical="https://sipmunchyap.com/donate"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Support SipMunchYap
            </h1>
            <p className="text-muted-foreground">
              We keep NYC's largest verified happy hour database free for everyone.
              Your donation helps us cover hosting, keep listings fresh, and grow
              into more cities.
            </p>
          </div>

          <Card className="p-6 md:p-8">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Choose an amount
                </Label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={
                        !customAmount && amount === preset ? "default" : "outline"
                      }
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                      }}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="custom-amount" className="text-sm text-muted-foreground">
                    Or enter a custom amount (USD)
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="custom-amount"
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      placeholder="Custom"
                      className="pl-7"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="donor-name">Your name (optional)</Label>
                <Input
                  id="donor-name"
                  type="text"
                  maxLength={100}
                  placeholder="Anonymous"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">
                  Leave a message (optional, 280 chars)
                </Label>
                <Textarea
                  id="message"
                  maxLength={280}
                  placeholder="Love what you do — keep it up!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleDonate}
                disabled={loading || finalCents < 100}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to Stripe…
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Donate ${(finalCents / 100).toFixed(2)}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Payments are processed securely by Stripe. SipMunchYap is not a
                registered nonprofit, so donations are not tax-deductible. You'll
                receive a receipt by email.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Donate;
