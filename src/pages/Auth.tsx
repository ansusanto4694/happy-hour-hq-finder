import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [showEmailSentMessage, setShowEmailSentMessage] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  
  // Form interaction tracking state
  const signupStartTimeRef = useRef<number | null>(null);
  const fieldInteractionTimesRef = useRef<Record<string, number>>({});
  const hasInteractedWithFormRef = useRef(false);
  
  const { signIn, signUp, signInWithGoogle, user, resetPassword } = useAuth();
  const { track, trackFunnel } = useAnalytics();
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Track auth funnel entry
  useEffect(() => {
    trackFunnel({
      funnelStep: 'auth_page_view',
      stepOrder: 1,
    });
  }, [trackFunnel]);

  // Track tab switching and signup form entry
  useEffect(() => {
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'auth_tab_switch',
      eventLabel: activeTab,
    });
    
    // Start timing when user switches to signup tab
    if (activeTab === 'signup') {
      signupStartTimeRef.current = Date.now();
      
      track({
        eventType: 'interaction',
        eventCategory: 'authentication',
        eventAction: 'signup_form_entry',
        eventLabel: 'signup_tab_activated',
      });
    }
  }, [activeTab, track]);

  // Track form abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeTab === 'signup' && hasInteractedWithFormRef.current && signupStartTimeRef.current) {
        const timeSpent = Math.round((Date.now() - signupStartTimeRef.current) / 1000);
        
        track({
          eventType: 'interaction',
          eventCategory: 'authentication',
          eventAction: 'signup_form_abandoned',
          eventLabel: 'page_unload',
          metadata: {
            timeSpentSeconds: timeSpent,
            fieldsInteracted: Object.keys(fieldInteractionTimesRef.current),
          },
        });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, track]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Track field focus
  const handleFieldFocus = (fieldName: string) => {
    hasInteractedWithFormRef.current = true;
    fieldInteractionTimesRef.current[fieldName] = Date.now();
    
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'signup_field_focus',
      eventLabel: fieldName,
      metadata: {
        timeFromFormEntry: signupStartTimeRef.current 
          ? Math.round((Date.now() - signupStartTimeRef.current) / 1000)
          : 0,
      },
    });
  };
  
  // Track field blur
  const handleFieldBlur = (fieldName: string, hasValue: boolean) => {
    const focusTime = fieldInteractionTimesRef.current[fieldName];
    const timeSpent = focusTime ? Math.round((Date.now() - focusTime) / 1000) : 0;
    
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'signup_field_blur',
      eventLabel: fieldName,
      metadata: {
        timeSpentSeconds: timeSpent,
        hasValue: hasValue,
      },
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Track signin attempt
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'signin_attempt',
      eventLabel: 'email_password',
    });
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (!error) {
      // Track successful signin (also tracked in useAuth)
      trackFunnel({
        funnelStep: 'signin_success',
        stepOrder: 3,
      });
      navigate('/');
    } else {
      // Track signin failure
      track({
        eventType: 'error',
        eventCategory: 'authentication',
        eventAction: 'signin_failed',
        eventLabel: error.message,
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Calculate total time spent on form
    const timeSpent = signupStartTimeRef.current 
      ? Math.round((Date.now() - signupStartTimeRef.current) / 1000)
      : 0;
    
    // Track signup attempt with time metrics
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'signup_attempt',
      eventLabel: 'email_password',
      metadata: {
        timeSpentSeconds: timeSpent,
        fieldsInteracted: Object.keys(fieldInteractionTimesRef.current),
      },
    });
    
    // Track signup funnel step
    trackFunnel({
      funnelStep: 'signup_form_submitted',
      stepOrder: 2,
    });
    
    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.firstName,
      signUpData.lastName,
      signUpData.phoneNumber
    );
    
    if (!error) {
      // Track successful signup completion
      trackFunnel({
        funnelStep: 'signup_success',
        stepOrder: 3,
      });
      
      track({
        eventType: 'conversion',
        eventCategory: 'authentication',
        eventAction: 'signup_success',
        eventLabel: 'email_password',
      });
      
      // Show email sent message
      setShowEmailSentMessage(true);
    } else {
      // Track signup failure
      track({
        eventType: 'error',
        eventCategory: 'authentication',
        eventAction: 'signup_failed',
        eventLabel: error.message,
      });
    }
    
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (!error) {
      setShowResetDialog(false);
      setResetEmail('');
    }
    
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    // Track Google OAuth click
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
      
      
      {/* Header */}
      <PageHeader showSearchBar={true} searchBarVariant="results" />
      
      {/* Main content - flex-grow to push footer down */}
      <div className="relative z-10 flex-grow flex items-center justify-center pt-40 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
        <div className="text-center">
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeTab === 'signin' ? 'Sign In to SipMunchYap' : 'Sign Up for SipMunchYap'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              {/* Google OAuth Button */}
              <div className="my-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-3 h-11 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                </Button>
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
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSignInPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">
                          Forgot Password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="Enter your email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                {showEmailSentMessage && (
                  <Alert className="mb-4 border-primary/50 bg-primary/10">
                    <Mail className="h-4 w-4" />
                    <AlertTitle>Check Your Email</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>We've sent a confirmation email to <strong>{signUpData.email}</strong></p>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Email may take up to 1 minute to arrive. Please check your spam folder if you don't see it.</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="First name"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        onFocus={() => handleFieldFocus('firstName')}
                        onBlur={() => handleFieldBlur('firstName', !!signUpData.firstName)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Last name"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        onFocus={() => handleFieldFocus('lastName')}
                        onBlur={() => handleFieldBlur('lastName', !!signUpData.lastName)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      onFocus={() => handleFieldFocus('email')}
                      onBlur={() => handleFieldBlur('email', !!signUpData.email)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={signUpData.phoneNumber}
                      onChange={(e) => setSignUpData({ ...signUpData, phoneNumber: e.target.value })}
                      onFocus={() => handleFieldFocus('phoneNumber')}
                      onBlur={() => handleFieldBlur('phoneNumber', !!signUpData.phoneNumber)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        onFocus={() => handleFieldFocus('password')}
                        onBlur={() => handleFieldBlur('password', !!signUpData.password)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSignUpPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>
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
      
      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Auth;