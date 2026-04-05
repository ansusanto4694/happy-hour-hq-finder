import { SEOHead } from '@/components/SEOHead';
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Terms of Service | SipMunchYap"
        description="Terms of Service for SipMunchYap - rules governing use of our platform and content."
      />
      <PageHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: April 5, 2026</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using SipMunchYap ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Use of the Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              SipMunchYap provides a platform for discovering happy hour deals, restaurant information, and related content. You may use the Service for personal, non-commercial purposes in accordance with these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Data Scraping & Automated Collection:</strong> Using any automated means, including but not limited to bots, scrapers, spiders, crawlers, or any other automated tool or software, to access, collect, harvest, scrape, or extract any data, content, or information from the Service.
              </li>
              <li>
                <strong className="text-foreground">Bulk Data Extraction:</strong> Systematically downloading, copying, or exporting merchant listings, happy hour deals, pricing information, reviews, ratings, or any other content from the Service, whether through automated or manual means.
              </li>
              <li>
                <strong className="text-foreground">Database Replication:</strong> Attempting to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service's database, content, or data for commercial purposes or to create a competing product or service.
              </li>
              <li>
                <strong className="text-foreground">API Abuse:</strong> Accessing or attempting to access the Service's APIs, databases, or backend systems in any manner not expressly authorized by SipMunchYap, including but not limited to using publicly visible API keys for unauthorized data extraction.
              </li>
              <li>
                <strong className="text-foreground">AI Training:</strong> Using any content from the Service to train, develop, or improve any artificial intelligence or machine learning model without explicit written consent from SipMunchYap.
              </li>
              <li>
                <strong className="text-foreground">Content Redistribution:</strong> Republishing, redistributing, or making available any substantial portion of the Service's content on any other website, application, or platform without prior written authorization.
              </li>
              <li>
                <strong className="text-foreground">Circumvention:</strong> Attempting to bypass, circumvent, or disable any security measures, rate limiting, access controls, or other technological protection measures implemented by the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on SipMunchYap, including but not limited to merchant listings, happy hour deal information, reviews, ratings, photographs, text, graphics, logos, and the compilation thereof, constitutes proprietary data owned by SipMunchYap. This content is protected by copyright, trademark, and other intellectual property laws. Unauthorized use, reproduction, or distribution of this content is strictly prohibited and may result in civil and criminal penalties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Enforcement & Remedies</h2>
            <p className="text-muted-foreground leading-relaxed">
              SipMunchYap reserves the right to take any action it deems necessary to enforce these Terms, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li>Immediately terminating access to the Service without notice</li>
              <li>Blocking IP addresses, user agents, or other identifying information associated with prohibited activities</li>
              <li>Pursuing legal action, including seeking injunctive relief and monetary damages</li>
              <li>Reporting violations to law enforcement authorities</li>
              <li>Seeking statutory damages of up to $150,000 per work infringed under the Copyright Act</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify SipMunchYap of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. User-Generated Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              By submitting reviews, ratings, or other content to the Service, you grant SipMunchYap a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute such content in connection with the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" without warranties of any kind. SipMunchYap does not guarantee the accuracy, completeness, or timeliness of happy hour deals, merchant information, or other content displayed on the platform. Deals and hours are subject to change by individual merchants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              SipMunchYap shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              SipMunchYap reserves the right to modify these Terms at any time. Continued use of the Service following any changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:andrew@sipmunchyap.com" className="text-primary hover:underline">
                andrew@sipmunchyap.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
