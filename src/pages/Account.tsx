import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { SEOHead } from '@/components/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/account/ProfileForm';
import { User, Heart, FolderHeart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Account = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <PageLayout showSearchBar={false} containerClassName="max-w-5xl mx-auto px-4 py-8">
      <SEOHead
        title="My Account - SipMunchYap"
        description="Manage your SipMunchYap account, profile, favorites, and collections."
        noIndex
      />
      
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Member since {memberSince}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
...
      </Tabs>
    </PageLayout>
  );
};

export default Account;
