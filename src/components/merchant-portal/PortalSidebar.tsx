import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Calendar, Tag, Clock, Store, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PortalSection = 'dashboard' | 'events' | 'offers' | 'happy-hours' | 'store-hours' | 'settings';

const NAV_ITEMS: { section: PortalSection; label: string; icon: React.ElementType; disabled?: boolean }[] = [
  { section: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'events', label: 'Events', icon: Calendar },
  { section: 'offers', label: 'Offers', icon: Tag },
  { section: 'happy-hours', label: 'Happy Hours', icon: Clock },
  { section: 'store-hours', label: 'Store Hours', icon: Store },
  { section: 'settings', label: 'Settings', icon: Settings },
];

interface PortalSidebarProps {
  activeSection: PortalSection;
  onSectionChange: (section: PortalSection) => void;
  merchantName: string;
  merchantLogoUrl?: string | null;
  merchantUrl: string;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  activeSection,
  onSectionChange,
  merchantName,
  merchantLogoUrl,
  merchantUrl,
}) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 min-w-0">
          {merchantLogoUrl ? (
            <img src={merchantLogoUrl} alt="" className="w-8 h-8 rounded-lg object-contain border border-border flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="h-4 w-4 text-primary" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{merchantName}</h2>
              <p className="text-xs text-muted-foreground">Merchant Portal</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(item => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton
                    onClick={() => !item.disabled && onSectionChange(item.section)}
                    isActive={activeSection === item.section}
                    className={item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <span className="flex items-center gap-2">
                        {item.label}
                        {item.disabled && <span className="text-[10px] text-muted-foreground">(Soon)</span>}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed ? (
          <Link to={merchantUrl}>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              View Listing
            </Button>
          </Link>
        ) : (
          <Link to={merchantUrl}>
            <Button variant="outline" size="icon" className="w-full">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
