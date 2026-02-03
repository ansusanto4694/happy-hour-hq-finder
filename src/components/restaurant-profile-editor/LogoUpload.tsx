import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface LogoUploadProps {
  restaurantId: number;
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string | null) => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  restaurantId,
  currentLogoUrl,
  onLogoUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPEG, PNG, WEBP, or GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurantId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(filePath, file, {
          cacheControl: '2592000', // 30 days for optimal repeat visitor performance
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-logos')
        .getPublicUrl(filePath);

      // Update restaurant logo_url in database
      const { error: updateError } = await supabase
        .from('Merchant')
        .update({ logo_url: publicUrl })
        .eq('id', restaurantId);

      if (updateError) {
        throw updateError;
      }
      // Invalidate restaurant queries (non-blocking to avoid race condition)
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      
      onLogoUpdate(publicUrl);
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [restaurantId, onLogoUpdate, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  }, [uploadFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  }, [uploadFile]);

  const handleRemoveLogo = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('Merchant')
        .update({ logo_url: null })
        .eq('id', restaurantId);

      if (error) {
        throw error;
      }
      // Invalidate restaurant queries (non-blocking to avoid race condition)
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      
      onLogoUpdate(null);
      toast({
        title: "Success",
        description: "Logo removed successfully",
      });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  }, [restaurantId, onLogoUpdate, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Restaurant Logo</label>
        {currentLogoUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveLogo}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1" />
            Remove Logo
          </Button>
        )}
      </div>

      {currentLogoUrl ? (
        <div className="relative">
          <img
            src={currentLogoUrl}
            alt="Restaurant logo"
            className="w-32 h-32 object-cover rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-1" />
            Change
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
        >
          <Image className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Drag & drop an image here, or{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              browse files
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            You can also paste an image from your clipboard
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            PNG, JPEG, WEBP, or GIF (max 5MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading && (
        <div className="text-center">
          <div className="inline-flex items-center text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            Uploading logo...
          </div>
        </div>
      )}
    </div>
  );
};