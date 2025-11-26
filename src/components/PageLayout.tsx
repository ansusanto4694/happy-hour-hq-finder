import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  showSearchBar?: boolean;
  searchBarVariant?: 'hero' | 'results';
  showHeader?: boolean;
  showFooter?: boolean;
  containerClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showSearchBar = false,
  searchBarVariant = 'hero',
  showHeader = true,
  showFooter = true,
  containerClassName = '',
}) => {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <PageHeader 
          showSearchBar={showSearchBar} 
          searchBarVariant={searchBarVariant}
        />
      )}
      
      <main className={`pt-32 md:pt-40 ${containerClassName}`}>
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};
