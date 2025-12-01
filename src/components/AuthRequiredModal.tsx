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
    // Track that user chose to sign in after auth-required action
    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'auth_required_signin_clicked',
      eventLabel: action,
      merchantId,
    });
    
    navigate('/auth');
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Track dismissal of auth prompt
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
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSignIn}>Sign In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
