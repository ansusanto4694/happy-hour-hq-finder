import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/results' },
  { icon: Heart, label: 'Favorites', path: '/favorites' },
  { icon: User, label: 'Account', path: '/account' },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  
  // Don't show on auth pages
  if (location.pathname.startsWith('/auth') || location.pathname === '/reset-password') {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-border safe-area-bottom md:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-18">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] rounded-lg transition-colors",
                "active:bg-muted",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "fill-primary/20")} />
              <span className="text-sm mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
