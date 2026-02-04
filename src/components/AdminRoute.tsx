import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * A route guard that only renders children for admin users.
 * 
 * - Shows loading spinner while auth is being checked
 * - Redirects to /auth if user is not logged in
 * - Redirects to home if user is logged in but not an admin
 * - Renders children only if user is an admin
 * 
 * This prevents the protected lazy-loaded component from being
 * downloaded by non-admin users, saving bandwidth and keeping
 * internal code private.
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isAdmin, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but not admin - redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Admin user - render the protected content
  return <>{children}</>;
};
