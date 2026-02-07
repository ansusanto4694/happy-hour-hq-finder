import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/FavoriteButton';
import { SEOHead } from '@/components/SEOHead';
import { PageHeader } from '@/components/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { Footer } from '@/components/Footer';

export default function Favorites() {
  const { user } = useAuth();
  const { favorites, isLoading } = useFavorites(user?.id);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Guest state: show a sign-in prompt instead of redirecting
  const isGuest = !user;

  return (
    <>
      <SEOHead
        title="My Favorites"
        description="View your saved favorite restaurants and happy hour spots"
      />
      
      <div className="min-h-screen relative bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          {!isMobile && <PageHeader showSearchBar={true} searchBarVariant="results" />}
          <div className={`container mx-auto px-4 max-w-6xl ${isMobile ? 'py-8 pb-24' : 'pt-40 pb-8'}`}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-current" />
              My Favorites
            </h1>
            {!isGuest && (
              <p className="text-muted-foreground">
                {favorites.length} saved restaurant{favorites.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {isGuest ? (
            <Card className="p-12 text-center">
              <LogIn className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Sign in to see your favorites
              </h2>
              <p className="text-muted-foreground mb-6">
                Create a free account to save your favorite happy hour spots and access them anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/auth?returnTo=/favorites')}>
                  Sign In
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Browse Happy Hours</Link>
                </Button>
              </div>
            </Card>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-24 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and save your favorite restaurants!
              </p>
              <Button asChild>
                <Link to="/">Browse Restaurants</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => {
                const merchant = favorite.Merchant;
                return (
                  <Card
                    key={favorite.id}
                    className="group hover:shadow-lg transition-shadow duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <Link
                          to={`/restaurant/${merchant.id}`}
                          className="flex-1 min-w-0"
                        >
                          {merchant.logo_url ? (
                            <img
                              src={merchant.logo_url}
                              alt={merchant.restaurant_name}
                              className="h-16 w-16 object-cover rounded-lg mb-3"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                              <span className="text-2xl font-bold text-primary">
                                {merchant.restaurant_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                            {merchant.restaurant_name}
                          </h3>
                        </Link>
                        <FavoriteButton
                          merchantId={merchant.id}
                          className="flex-shrink-0"
                        />
                      </div>

                      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {merchant.street_address}, {merchant.city}, {merchant.state}
                        </span>
                      </div>

                      <Button asChild className="w-full" variant="outline">
                        <Link to={`/restaurant/${merchant.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}
