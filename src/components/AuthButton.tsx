import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const AuthButton: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />;
  }

  if (!user || !profile) {
    return (
      <Button onClick={() => navigate('/auth')} variant="outline">
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {profile.first_name} {profile.last_name}
          {profile.role === 'admin' && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              Admin
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={signOut} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};