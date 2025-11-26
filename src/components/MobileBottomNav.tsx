import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show on results page (conflicts with drawer)
  if (location.pathname === '/results' || location.pathname.startsWith('/restaurant/')) {
    return null;
  }

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      onClick: () => navigate('/')
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Search,
      path: '/results',
      onClick: () => navigate('/results')
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      path: '/favorites',
      onClick: () => {
        if (!user) {
          navigate('/auth', { state: { from: '/favorites' } });
        } else {
          navigate('/favorites');
        }
      }
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      path: '/account',
      onClick: () => {
        if (!user) {
          navigate('/auth', { state: { from: '/account' } });
        } else {
          navigate('/account');
        }
      }
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px]",
                active 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  active && "scale-110"
                )} 
                strokeWidth={active ? 2.5 : 2}
                fill={active && tab.id === 'favorites' ? 'currentColor' : 'none'}
              />
              <span className={cn(
                "text-xs font-medium",
                active && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
