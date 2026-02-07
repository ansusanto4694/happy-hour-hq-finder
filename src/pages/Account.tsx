import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/account/ProfileForm';
import { MyReviews } from '@/components/account/MyReviews';
import { User, Heart, Star, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const Account = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Guest state: show sign-in prompt instead of redirecting
  const isGuest = !loading && !user;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <SEOHead
            title="My Account - SipMunchYap"
            description="Sign in to manage your SipMunchYap account."
            noIndex
          />
          {!isMobile && <PageHeader showSearchBar={true} searchBarVariant="results" />}
          <div className={`max-w-5xl mx-auto px-4 ${isMobile ? 'py-8 pb-24' : 'pt-40 pb-8'}`}>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-white">My Account</h1>
            </div>
            <Card className="p-12 text-center">
              <LogIn className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Sign in to access your account
              </h2>
              <p className="text-muted-foreground mb-6">
                Create a free account to manage your profile, write reviews, and save your favorite spots.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/auth?returnTo=/account')}>
                  Sign In
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Browse Happy Hours</Link>
                </Button>
              </div>
            </Card>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return <AuthenticatedAccount user={user!} profile={profile} memberSince={memberSince} isMobile={isMobile} />;
};

// Extracted to its own component so hooks (useQuery) aren't called conditionally
const AuthenticatedAccount = ({ user, profile, memberSince, isMobile }: {
  user: { id: string };
  profile: { first_name: string; created_at: string };
  memberSince: string;
  isMobile: boolean;
}) => {
  // Fetch draft count for badge
  const { data: draftCount } = useQuery({
    queryKey: ['draft-count', user.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('merchant_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'draft');
      
      if (error) return 0;
      return count || 0;
    },
  });

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
      <div className="absolute inset-0 bg-black/10"></div>
      {/* Decorative elements */}
      <div className="absolute top-0 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <SEOHead
          title="My Account - SipMunchYap"
          description="Manage your SipMunchYap account, profile, favorites, and collections."
          noIndex
        />
        
        <PageHeader showSearchBar={true} searchBarVariant="results" />
        
        <div className={`max-w-5xl mx-auto px-4 ${isMobile ? 'py-8 pb-24' : 'pt-40 pb-8'}`}>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Welcome back, {profile.first_name}!
          </h1>
          <p className="text-white">
            Member since {memberSince}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              My Reviews
              {draftCount && draftCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs px-1.5 py-0">
                  {draftCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
                <CardDescription>
                  View and manage your restaurant reviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MyReviews />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Your Favorites</CardTitle>
                <CardDescription>
                  View and manage your saved restaurants and bars
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground mb-4">
                  Access your favorites page to see all your saved places
                </p>
                <Button asChild>
                  <Link to="/favorites">
                    Go to Favorites
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Account;
