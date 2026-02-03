import React, { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

// Lazy load dropdown components - only needed for authenticated users
const LazyDropdownMenu = lazy(() => import('@/components/ui/dropdown-menu').then(m => ({ default: m.DropdownMenu })));
const LazyDropdownMenuTrigger = lazy(() => import('@/components/ui/dropdown-menu').then(m => ({ default: m.DropdownMenuTrigger })));
const LazyDropdownMenuContent = lazy(() => import('@/components/ui/dropdown-menu').then(m => ({ default: m.DropdownMenuContent })));
const LazyDropdownMenuItem = lazy(() => import('@/components/ui/dropdown-menu').then(m => ({ default: m.DropdownMenuItem })));

export const AuthButton: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const { track } = useAnalytics();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'authentication',
      eventAction: 'sign_in_clicked',
    });
    navigate('/auth');
  };

  const handleSignOut = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'authentication',
      eventAction: 'sign_out_clicked',
      userId: user?.id,
    });
    signOut();
  };

  // Show loading state if auth is loading OR if user exists but profile hasn't loaded yet
  if (loading || (user && !profile)) {
    return <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />;
  }

  if (!user) {
    return (
      <Button onClick={handleSignIn} variant="outline">
        Sign In
      </Button>
    );
  }

  // Authenticated user - lazy load the dropdown menu
  return (
    <Suspense fallback={<Button variant="outline" size="icon"><User className="w-4 h-4" /></Button>}>
      <LazyDropdownMenu>
        <LazyDropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <User className="w-4 h-4" />
          </Button>
        </LazyDropdownMenuTrigger>
        <LazyDropdownMenuContent align="end">
          <LazyDropdownMenuItem onClick={() => navigate('/account')}>
            <User className="w-4 h-4 mr-2" />
            My Account
          </LazyDropdownMenuItem>
          <LazyDropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </LazyDropdownMenuItem>
        </LazyDropdownMenuContent>
      </LazyDropdownMenu>
    </Suspense>
  );
};
