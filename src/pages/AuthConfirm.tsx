import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';

const AuthConfirm = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL for error parameters
    const params = new URLSearchParams(window.location.hash.substring(1));
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    const errorCode = params.get('error_code');

    if (error || errorCode) {
      setStatus('error');
      
      // Handle specific error cases
      if (errorCode === 'otp_expired' || error === 'access_denied') {
        setErrorMessage('This confirmation link has expired or is invalid. Please request a new confirmation email.');
      } else {
        setErrorMessage(errorDescription || 'An error occurred during email confirmation. Please try again.');
      }
    } else if (user || session) {
      // User is authenticated, confirmation was successful
      setStatus('success');
    }
  }, [user, session]);

  // Countdown and redirect on success
  useEffect(() => {
    if (status === 'success') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        navigate('/');
      }
    }
  }, [status, countdown, navigate]);

  const handleResendEmail = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col">
      <SEOHead 
        title="Email Confirmation - SipMunchYap"
        description="Confirm your email address for SipMunchYap"
        canonical="https://sipmunchyap.com/auth/confirm"
        noIndex={true}
      />
      
      
      {/* Header */}
      <PageHeader showSearchBar={true} searchBarVariant="results" />
      
      {/* Main content */}
      <div className="relative z-10 flex-grow flex items-center justify-center pt-40 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {status === 'loading' && 'Confirming Your Email...'}
                {status === 'success' && 'Email Confirmed!'}
                {status === 'error' && 'Confirmation Failed'}
              </CardTitle>
              <CardDescription className="text-center">
                {status === 'loading' && 'Please wait while we verify your email address'}
                {status === 'success' && 'Your account is now active'}
                {status === 'error' && 'There was a problem confirming your email'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Loading State */}
              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Verifying your email address...</p>
                </div>
              )}

              {/* Success State */}
              {status === 'success' && (
                <>
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Success!</AlertTitle>
                    <AlertDescription>
                      Your email has been confirmed successfully. You can now access all features of SipMunchYap.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Redirecting you to the home page in <span className="font-bold text-foreground">{countdown}</span> seconds...
                    </p>
                    <Button onClick={handleGoHome} className="w-full">
                      Go to Home Page Now
                    </Button>
                  </div>
                </>
              )}

              {/* Error State */}
              {status === 'error' && (
                <>
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Confirmation Failed</AlertTitle>
                    <AlertDescription>
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <Button onClick={handleResendEmail} className="w-full">
                      Request New Confirmation Email
                    </Button>
                    <Button onClick={handleGoHome} variant="outline" className="w-full">
                      Go to Home Page
                    </Button>
                  </div>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Need help? <Link to="/contact" className="text-primary hover:underline">Contact support</Link></p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default AuthConfirm;
