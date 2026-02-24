import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Clock } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface SignUpFormProps {
  isLoading: boolean;
  onSubmit: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  }) => Promise<{ error: { message: string } | null }>;
}

const validateField = (fieldName: string, value: string): string => {
  switch (fieldName) {
    case 'firstName':
      return value.trim() ? '' : 'First name is required';
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return '';
    default:
      return '';
  }
};

export const SignUpForm = ({ isLoading, onSubmit }: SignUpFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailSentMessage, setShowEmailSentMessage] = useState(false);

  const { track, trackFunnel } = useAnalytics();

  // Form interaction tracking
  const startTimeRef = useRef<number | null>(null);
  const fieldTimesRef = useRef<Record<string, number>>({});
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'signup_form_entry',
      eventLabel: 'signup_tab_activated',
    });
  }, [track]);

  // Track abandonment on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasInteractedRef.current && startTimeRef.current) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
        track({
          eventType: 'interaction',
          eventCategory: 'authentication',
          eventAction: 'signup_form_abandoned',
          eventLabel: 'page_unload',
          metadata: {
            timeSpentSeconds: timeSpent,
            fieldsInteracted: Object.keys(fieldTimesRef.current),
          },
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [track]);

  const handleFieldFocus = (fieldName: string) => {
    hasInteractedRef.current = true;
    fieldTimesRef.current[fieldName] = Date.now();
    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'signup_field_focus',
      eventLabel: fieldName,
      metadata: {
        timeFromFormEntry: startTimeRef.current
          ? Math.round((Date.now() - startTimeRef.current) / 1000)
          : 0,
      },
    });
  };

  const handleFieldBlur = (fieldName: string) => {
    const focusTime = fieldTimesRef.current[fieldName];
    const timeSpent = focusTime ? Math.round((Date.now() - focusTime) / 1000) : 0;
    const value = formData[fieldName as keyof typeof formData] || '';
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));

    track({
      eventType: 'interaction',
      eventCategory: 'authentication',
      eventAction: 'signup_field_blur',
      eventLabel: fieldName,
      metadata: { timeSpentSeconds: timeSpent, hasValue: !!value },
    });
  };

  const updateField = (fieldName: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) setErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    newErrors.firstName = validateField('firstName', formData.firstName);
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);
    setErrors(newErrors);
    if (Object.values(newErrors).some(err => err)) return;

    const timeSpent = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;

    track({
      eventType: 'conversion',
      eventCategory: 'authentication',
      eventAction: 'signup_attempt',
      eventLabel: 'email_password',
      metadata: {
        timeSpentSeconds: timeSpent,
        fieldsInteracted: Object.keys(fieldTimesRef.current),
      },
    });

    trackFunnel({ funnelStep: 'signup_form_submitted', stepOrder: 2 });

    const { error } = await onSubmit(formData);

    if (!error) {
      trackFunnel({ funnelStep: 'signup_success', stepOrder: 3 });
      track({
        eventType: 'conversion',
        eventCategory: 'authentication',
        eventAction: 'signup_success',
        eventLabel: 'email_password',
      });
      setShowEmailSentMessage(true);
    } else {
      track({
        eventType: 'error',
        eventCategory: 'authentication',
        eventAction: 'signup_failed',
        eventLabel: error.message,
      });
    }
  };

  return (
    <>
      {showEmailSentMessage && (
        <Alert className="mb-4 border-primary/50 bg-primary/10">
          <Mail className="h-4 w-4" />
          <AlertTitle>Check Your Email</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>We've sent a confirmation email to <strong>{formData.email}</strong></p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Email may take up to 1 minute to arrive. Please check your spam folder if you don't see it.</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signup-firstname">First Name <span className="text-destructive">*</span></Label>
            <Input
              id="signup-firstname"
              type="text"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              onFocus={() => handleFieldFocus('firstName')}
              onBlur={() => handleFieldBlur('firstName')}
              required
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-lastname">Last Name</Label>
            <Input
              id="signup-lastname"
              type="text"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              onFocus={() => handleFieldFocus('lastName')}
              onBlur={() => handleFieldBlur('lastName')}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email <span className="text-destructive">*</span></Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            onFocus={() => handleFieldFocus('email')}
            onBlur={() => handleFieldBlur('email')}
            required
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-phone">Phone Number</Label>
          <Input
            id="signup-phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            onFocus={() => handleFieldFocus('phoneNumber')}
            onBlur={() => handleFieldBlur('phoneNumber')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              onFocus={() => handleFieldFocus('password')}
              onBlur={() => handleFieldBlur('password')}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
    </>
  );
};
