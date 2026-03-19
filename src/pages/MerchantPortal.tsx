import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMerchantOwnership } from '@/hooks/useMerchantOwnership';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { PortalSidebar, type PortalSection } from '@/components/merchant-portal/PortalSidebar';
import { PortalDashboard } from '@/components/merchant-portal/PortalDashboard';
import { PortalEvents } from '@/components/merchant-portal/PortalEvents';
import { PortalHappyHours } from '@/components/merchant-portal/PortalHappyHours';
import { PortalStoreHours } from '@/components/merchant-portal/PortalStoreHours';
import { PortalSettings } from '@/components/merchant-portal/PortalSettings';
import { PortalOffers } from '@/components/merchant-portal/PortalOffers';
import { Loader2 } from 'lucide-react';

const MerchantPortal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const merchantId = Number(id);
  const [activeSection, setActiveSection] = useState<PortalSection>('dashboard');

  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ['merchant-portal', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Merchant')
        .select('id, restaurant_name, logo_url, neighborhood, city, slug, street_address, street_address_line_2, state, zip_code, phone_number, website')
        .eq('id', merchantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNaN(merchantId),
  });

  const { canManage, isLoading: ownershipLoading } = useMerchantOwnership(merchantId);

  if (!user) return <Navigate to="/auth" replace />;
  if (merchantLoading || ownershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!merchant || isNaN(merchantId)) return <Navigate to="/" replace />;
  if (!canManage) return <Navigate to={`/restaurant/${merchant.slug || merchantId}`} replace />;

  const merchantUrl = `/restaurant/${merchant.slug || merchantId}`;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <PortalDashboard merchantId={merchantId} merchantName={merchant.restaurant_name} onNavigate={setActiveSection} />;
      case 'events':
        return <PortalEvents merchantId={merchantId} />;
      case 'offers':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Offers</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage time-bounded deals and promotions</p>
            </div>
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-foreground">Coming soon</p>
                <p className="text-sm mt-1">Offer management is on the way.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'happy-hours':
        return <PortalHappyHours merchantId={merchantId} />;
      case 'store-hours':
        return <PortalStoreHours merchantId={merchantId} />;
      case 'settings':
        return <PortalSettings merchant={merchant} />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PortalSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          merchantName={merchant.restaurant_name}
          merchantLogoUrl={merchant.logo_url}
          merchantUrl={merchantUrl}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-background sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold text-foreground truncate">{merchant.restaurant_name}</h1>
          </header>
          <main className="flex-1 p-6 max-w-5xl">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MerchantPortal;
