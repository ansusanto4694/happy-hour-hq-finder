import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, user, resetPassword } = useAuth();
  const { track, trackFunnel } = useAnalytics();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get('returnTo');

  // Track auth funnel entry
  useEffect(() => {
    trackFunnel({ funnelStep: 'auth_page_view', stepOrder: 1 });
  }, [trackFunnel]);

  // Track tab switching
  useEffect(() => {
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'auth_tab_switch',
      eventLabel: activeTab,
    });
  }, [activeTab, track]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(returnTo || '/');
    }
  }, [user, navigate, returnTo]);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'signin_attempt',
      eventLabel: 'email_password',
    });

    const { error } = await signIn(email, password);

    if (!error) {
      trackFunnel({ funnelStep: 'signin_success', stepOrder: 3 });
      navigate(returnTo || '/');
    } else {
      track({
        eventType: 'error',
        eventCategory: 'authentication',
        eventAction: 'signin_failed',
        eventLabel: error.message,
      });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (email: string) => {
    setIsLoading(true);
    await resetPassword(email);
    setIsLoading(false);
  };

  const handleSignUp = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) => {
    setIsLoading(true);
    const { error } = await signUp(
      data.email,
      data.password,
      data.firstName,
      data.lastName,
      data.phoneNumber
    );
    setIsLoading(false);
    return { error };
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: activeTab === 'signup' ? 'signup_google_click' : 'signin_google_click',
      eventLabel: 'google',
    });
    await signInWithGoogle();
    setIsGoogleLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col">
      <div className="absolute inset-0 bg-black/10"></div>
      <SEOHead
        title="Sign In - SipMunchYap"
        description="Sign in to your SipMunchYap account to save favorite happy hours and get personalized recommendations."
        canonical="https://sipmunchyap.com/auth"
        noIndex={true}
      />

      <PageHeader showSearchBar={true} searchBarVariant="results" />

      <div className="relative z-10 flex-grow flex items-center justify-center pt-40 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
              Your Happy Hour Companion
            </h1>
            <p className="text-white/90 text-base sm:text-lg max-w-sm mx-auto leading-relaxed drop-shadow-sm">
              Save your favorite spots, get personalized recommendations, and never miss a deal again.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'signin' ? 'Sign In to SipMunchYap' : 'Sign Up for SipMunchYap'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* Google OAuth */}
                <div className="my-4">
                  <GoogleOAuthButton
                    onClick={handleGoogleSignIn}
                    isLoading={isGoogleLoading}
                    disabled={isGoogleLoading || isLoading}
                  />
                </div>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <TabsContent value="signin" className="mt-0">
                  <SignInForm
                    isLoading={isLoading}
                    onSubmit={handleSignIn}
                    onResetPassword={handleResetPassword}
                  />
                </TabsContent>

                <TabsContent value="signup">
                  <SignUpForm isLoading={isLoading} onSubmit={handleSignUp} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="link" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Auth;
