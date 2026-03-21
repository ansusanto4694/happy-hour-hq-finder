import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AuthRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  merchantId?: number;
}

export const AuthRequiredModal = ({ 
  open, 
  onOpenChange, 
  action,
  merchantId 
}: AuthRequiredModalProps) => {
  const navigate = useNavigate();
  const { track } = useAnalytics();

  const handleSignIn = () => {
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'auth_required_signin_clicked',
      eventLabel: action,
      merchantId,
    });
    
    const returnTo = window.location.pathname;
    navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`);
    onOpenChange(false);
  };

  const handleSignUp = () => {
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'auth_required_signup_clicked',
      eventLabel: action,
      merchantId,
    });
    
    const returnTo = window.location.pathname;
    navigate(`/auth?mode=signup&returnTo=${encodeURIComponent(returnTo)}`);
    onOpenChange(false);
  };

  const handleCancel = () => {
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'auth_required_dismissed',
      eventLabel: action,
      merchantId,
    });
    
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign in required</AlertDialogTitle>
          <AlertDialogDescription>
            You need to be signed in to {action}. Create a free account or sign in to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignIn}>Sign In</AlertDialogAction>
        </AlertDialogFooter>
        <p className="text-center text-sm text-muted-foreground -mt-2 pb-2">
          Don't have an account?{' '}
          <button onClick={handleSignUp} className="text-primary font-medium hover:underline">
            Sign Up
          </button>
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
};
