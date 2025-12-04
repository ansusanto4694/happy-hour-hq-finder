import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Flag } from 'lucide-react';
import { z } from 'zod';

interface ReportIssueModalProps {
  merchantId: number;
  merchantName: string;
  trigger?: React.ReactNode;
  className?: string;
}

const issueOptions = [
  { id: 'permanently_closed', label: 'Merchant is permanently closed' },
  { id: 'incorrect_menu', label: 'Happy Hour menu or specials are incorrect' },
  { id: 'incorrect_hours', label: 'Happy Hour hours are incorrect' },
  { id: 'other', label: 'Other' },
];

// Validation schema
const reportSchema = z.object({
  selectedIssues: z.array(z.string()).min(1, 'Please select at least one issue to report'),
  additionalFeedback: z.string().max(2000, 'Feedback must be less than 2000 characters').optional(),
  reporterEmail: z.union([
    z.string().length(0),
    z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters')
  ]).optional(),
});

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ 
  merchantId, 
  merchantName, 
  trigger,
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; feedback?: string; issues?: string }>({});
  const { toast } = useToast();

  const handleIssueChange = (issueId: string, checked: boolean) => {
    if (checked) {
      setSelectedIssues([...selectedIssues, issueId]);
    } else {
      setSelectedIssues(selectedIssues.filter(id => id !== issueId));
    }
    // Clear issues error when user selects something
    if (errors.issues) {
      setErrors(prev => ({ ...prev, issues: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReporterEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalFeedback(e.target.value);
    if (errors.feedback) {
      setErrors(prev => ({ ...prev, feedback: undefined }));
    }
  };

  const handleSubmit = async () => {
    // Validate form data
    const result = reportSchema.safeParse({
      selectedIssues,
      additionalFeedback: additionalFeedback.trim(),
      reporterEmail: reporterEmail.trim(),
    });

    if (!result.success) {
      const fieldErrors: { email?: string; feedback?: string; issues?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'reporterEmail') {
          fieldErrors.email = err.message;
        } else if (err.path[0] === 'additionalFeedback') {
          fieldErrors.feedback = err.message;
        } else if (err.path[0] === 'selectedIssues') {
          fieldErrors.issues = err.message;
        }
      });
      setErrors(fieldErrors);
      
      // Show toast for the first error
      const firstError = result.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await supabase
        .from('merchant_listing_issue')
        .insert({
          merchant_id: merchantId,
          issue_types: selectedIssues,
          additional_feedback: additionalFeedback.trim() || null,
          reporter_email: reporterEmail.trim() || null,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Report submitted",
        description: "Thank you for reporting this issue. We'll review it and make necessary corrections.",
      });

      // Reset form
      setSelectedIssues([]);
      setAdditionalFeedback('');
      setReporterEmail('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className={className}>
      <Flag className="w-4 h-4 mr-2" />
      Report Issue
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What is wrong with this listing?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            {issueOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={selectedIssues.includes(option.id)}
                  onCheckedChange={(checked) => handleIssueChange(option.id, checked as boolean)}
                />
                <Label htmlFor={option.id} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
            {errors.issues && (
              <p className="text-sm text-destructive">{errors.issues}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-feedback">Additional Feedback</Label>
            <Textarea
              id="additional-feedback"
              placeholder="Please describe the issue in more detail..."
              value={additionalFeedback}
              onChange={handleFeedbackChange}
              rows={3}
              maxLength={2000}
              className={errors.feedback ? 'border-destructive' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.feedback ? (
                <span className="text-destructive">{errors.feedback}</span>
              ) : (
                <span />
              )}
              <span>{additionalFeedback.length}/2000</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporter-email">Email (optional)</Label>
            <Input
              id="reporter-email"
              type="email"
              placeholder="your.email@example.com"
              value={reporterEmail}
              onChange={handleEmailChange}
              maxLength={255}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
