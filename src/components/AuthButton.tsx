import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <User className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate('/account')}>
          <User className="w-4 h-4 mr-2" />
          My Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};