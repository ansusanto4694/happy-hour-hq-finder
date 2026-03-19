import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MerchantOffer } from './types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface OfferDetailsModalProps {
  offer: MerchantOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'details' | 'pin-entry' | 'success' | 'error';

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  offer,
  isOpen,
  onClose
}) => {
  const [state, setState] = useState<ModalState>('details');
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setState('details');
      setPin(['', '', '', '']);
    }
  }, [isOpen]);

  const handlePinChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setPin(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [pin]);

  const handleSubmitPin = useCallback(async () => {
    if (!offer) return;
    const entered = pin.join('');
    if (entered === offer.redemption_pin) {
      // Log redemption
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('offer_redemptions').insert({
        offer_id: offer.id,
        store_id: offer.store_id,
        user_id: session?.user?.id ?? null,
        session_id: null,
      });
      setState('success');
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      setState('error');
      setTimeout(() => {
        setPin(['', '', '', '']);
        setState('pin-entry');
        inputRefs.current[0]?.focus();
      }, 1500);
    }
  }, [offer, pin, onClose]);

  if (!offer) return null;

  const formatDateTime = (dateTimeString: string) => {
    return format(new Date(dateTimeString), 'MMM dd, yyyy • h:mm a');
  };

  const enteredFull = pin.every(d => d !== '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && state !== 'success') onClose(); }}>
      <DialogContent className="max-w-md">
        {state === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {offer.offer_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {offer.offer_description && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {offer.offer_description}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Offer Starts</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(offer.start_time)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Offer Ends</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(offer.end_time)}</p>
                  </div>
                </div>
              </div>
              {offer.redemption_pin && (
                <Button className="w-full mt-2" onClick={() => setState('pin-entry')}>
                  Redeem Offer
                </Button>
              )}
            </div>
          </>
        )}

        {state === 'pin-entry' && (
          <div className="flex flex-col items-center py-4 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-foreground text-center">
                Enter Redemption PIN
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center">
              Ask the staff for the 4-digit PIN to redeem this offer
            </p>
            <div className="flex gap-3">
              {pin.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold"
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => { setState('details'); setPin(['', '', '', '']); }}>
                Back
              </Button>
              <Button className="flex-1" disabled={!enteredFull} onClick={handleSubmitPin}>
                Submit
              </Button>
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <p className="text-xl font-bold text-foreground">Offer Redeemed!</p>
            <p className="text-sm text-muted-foreground">Enjoy your deal</p>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <XCircle className="h-16 w-16 text-destructive" />
            <p className="text-xl font-bold text-foreground">Incorrect PIN</p>
            <p className="text-sm text-muted-foreground">Please try again</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
