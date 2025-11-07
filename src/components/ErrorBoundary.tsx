import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { trackEvent } from '@/utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Track error in analytics
    trackEvent({
      eventType: 'error',
      eventCategory: 'app_error',
      eventAction: 'error_boundary_triggered',
      eventLabel: error.message,
      errorMessage: error.message,
      errorStack: error.stack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    trackEvent({
      eventType: 'click',
      eventCategory: 'error_recovery',
      eventAction: 'error_boundary_reset',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    trackEvent({
      eventType: 'click',
      eventCategory: 'error_recovery',
      eventAction: 'error_boundary_home',
    });

    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                We're sorry, but something unexpected happened. This error has been logged and we'll look into it.
              </AlertDescription>
            </Alert>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-auto max-h-48">
                <div className="font-bold text-destructive mb-2">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
