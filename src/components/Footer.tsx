import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const popularNeighborhoods = [
    { name: 'East Village', slug: 'east-village' },
    { name: 'West Village', slug: 'west-village' },
    { name: 'Williamsburg', slug: 'williamsburg' },
    { name: 'Lower East Side', slug: 'lower-east-side' },
    { name: 'SoHo', slug: 'soho' },
    { name: 'Chelsea', slug: 'chelsea' },
    { name: 'Midtown East', slug: 'midtown-east' },
    { name: "Hell's Kitchen", slug: 'hells-kitchen' },
  ];

  const moreNeighborhoods = [
    { name: 'Financial District', slug: 'financial-district' },
    { name: 'TriBeCa', slug: 'tribeca' },
    { name: 'Greenwich Village', slug: 'greenwich-village' },
    { name: 'NoHo', slug: 'noho' },
    { name: 'Union Square', slug: 'union-square' },
    { name: 'Gramercy Park', slug: 'gramercy-park' },
    { name: 'Koreatown', slug: 'koreatown' },
    { name: 'Upper East Side', slug: 'upper-east-side' },
  ];

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">SipMunchYap</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your go-to source for discovering the best happy hour deals in New York City. 
              Over 300+ verified happy hours and growing.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Updated Daily</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/happy-hour/new-york-ny" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  All NYC Happy Hours
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Neighborhoods */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              <MapPin className="inline h-4 w-4 mr-1" />
              Popular Areas
            </h3>
            <ul className="space-y-2">
              {popularNeighborhoods.map((neighborhood) => (
                <li key={neighborhood.slug}>
                  <Link 
                    to={`/happy-hour/new-york-ny/${neighborhood.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {neighborhood.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Neighborhoods */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">More Neighborhoods</h3>
            <ul className="space-y-2">
              {moreNeighborhoods.map((neighborhood) => (
                <li key={neighborhood.slug}>
                  <Link 
                    to={`/happy-hour/new-york-ny/${neighborhood.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {neighborhood.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="border-t border-border pt-6 mb-6">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-muted-foreground">
            <a 
              href="mailto:contact@sipmunchyap.com" 
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              contact@sipmunchyap.com
            </a>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              New York, NY
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} SipMunchYap. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/about" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/about" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
