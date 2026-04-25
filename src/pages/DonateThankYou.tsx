import { Link } from "react-router-dom";
import { Heart, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

const DonateThankYou = () => {
  return (
    <>
      <SEOHead
        title="Thank You — SipMunchYap"
        description="Thank you for supporting SipMunchYap."
        canonical="https://sipmunchyap.com/donate/thank-you"
        noindex
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 md:p-10 max-w-lg w-full text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Heart className="h-10 w-10 text-primary fill-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Thank you! 💛
          </h1>
          <p className="text-muted-foreground mb-2">
            Your donation means a lot. It directly helps keep SipMunchYap free
            and our happy hour listings fresh and verified.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            A receipt is on its way to your email from Stripe.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
        </Card>
      </div>
    </>
  );
};

export default DonateThankYou;
