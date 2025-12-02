import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Track fetching state to prevent duplicate requests
  const isFetchingProfile = useRef(false);
  const profileCache = useRef<{ userId: string; profile: Profile; timestamp: number } | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchProfile = async (userId: string) => {
    // Check cache first
    if (profileCache.current && 
        profileCache.current.userId === userId && 
        Date.now() - profileCache.current.timestamp < CACHE_DURATION) {
      setProfile(profileCache.current.profile);
      return;
    }

    // Prevent duplicate fetches
    if (isFetchingProfile.current) {
      return;
    }

    isFetchingProfile.current = true;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        // Cache the profile
        profileCache.current = {
          userId,
          profile: data,
          timestamp: Date.now()
        };
      }

      // Fetch admin status from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      isFetchingProfile.current = false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      // Clear cache on explicit refresh
      profileCache.current = null;
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('[Auth] onAuthStateChange:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile data when user signs in - wait for completion before setting loading false
          setTimeout(async () => {
            if (!mounted) return;
            try {
              await fetchProfile(session.user.id);
            } catch (error) {
              console.error('[Auth] Profile fetch error in onAuthStateChange:', error);
            } finally {
              if (mounted) setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('[Auth] getSession:', session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
        } catch (error) {
          console.error('[Auth] Profile fetch error in getSession:', error);
        }
      } else {
        setIsAdmin(false);
      }
      if (mounted) setLoading(false);
    });

    // Safety timeout - never stay loading forever (5 seconds max)
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Safety timeout reached - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phoneNumber?: string) => {
    const redirectUrl = `${window.location.origin}/auth/confirm`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber || '',
        }
      }
    });

    if (error) {
      // Track signup failure
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'sign_up_failed', {
          event_category: 'authentication',
          event_label: 'email_password',
          error_message: error.message
        });
      }
      toast({
        title: 'Sign Up Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Track successful signup
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'sign_up', {
          event_category: 'authentication',
          method: 'email',
          user_id: data.user?.id
        });
      }
      toast({
        title: 'Success',
        description: 'Please check your email to confirm your account.',
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Track login failure
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'login_failed', {
          event_category: 'authentication',
          event_label: 'email_password',
          error_message: error.message
        });
      }
      toast({
        title: 'Sign In Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Track successful login
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'login', {
          event_category: 'authentication',
          method: 'email',
          user_id: data.user?.id
        });
      }
      toast({
        title: 'Success',
        description: 'Welcome back!',
      });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      // Track Google OAuth failure
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'login_failed', {
          event_category: 'authentication',
          event_label: 'google',
          error_message: error.message
        });
      }
      toast({
        title: 'Google Sign In Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Track Google OAuth attempt (success tracked after redirect)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'login_started', {
          event_category: 'authentication',
          method: 'google'
        });
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    toast({
      title: 'Signed Out',
      description: 'You have been signed out successfully.',
    });
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast({
        title: 'Password Reset Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check Your Email',
        description: 'We sent you a password reset link.',
      });
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: 'Password Update Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password Updated',
        description: 'Your password has been updated successfully.',
      });
    }

    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};