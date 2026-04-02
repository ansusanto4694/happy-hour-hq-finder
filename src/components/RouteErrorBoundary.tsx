import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { trackEvent } from '@/utils/analytics';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A lighter error boundary used per-route so that a crash on one page
 * doesn't take down the entire app. Offers "Refresh" and "Go Back".
 */
export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[RouteErrorBoundary:${this.props.routeName || 'unknown'}]`, error, errorInfo);

    trackEvent({
      eventType: 'error',
      eventCategory: 'app_error',
      eventAction: 'route_error_boundary_triggered',
      eventLabel: error.message,
      errorMessage: error.message,
      errorStack: error.stack,
      metadata: {
        routeName: this.props.routeName,
        pathname: window.location.pathname,
        search: window.location.search,
      },
    });
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoBack = () => {
    window.history.back();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>This page couldn't load</AlertTitle>
              <AlertDescription>
                Something went wrong loading this page. Try refreshing, or go back and try again.
              </AlertDescription>
            </Alert>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-auto max-h-48">
                <div className="font-bold text-destructive mb-2">
                  {this.state.error.toString()}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleRefresh} variant="default" className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button onClick={this.handleGoBack} variant="outline" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
