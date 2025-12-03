import React, { useCallback, useRef } from 'react';
import { Upload, X, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface ReviewMediaUploadProps {
  files: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxImageSize?: number; // in bytes
  maxVideoSize?: number; // in bytes
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const ReviewMediaUpload: React.FC<ReviewMediaUploadProps> = ({
  files,
  onChange,
  disabled = false,
  maxFiles = 10,
  maxImageSize = 10 * 1024 * 1024, // 10MB
  maxVideoSize = 50 * 1024 * 1024, // 50MB
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return `${file.name}: Unsupported file type`;
    }

    if (isImage && file.size > maxImageSize) {
      return `${file.name}: Image must be under ${maxImageSize / (1024 * 1024)}MB`;
    }

    if (isVideo && file.size > maxVideoSize) {
      return `${file.name}: Video must be under ${maxVideoSize / (1024 * 1024)}MB`;
    }

    return null;
  };

  const processFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: MediaFile[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
        return;
      }

      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }
  }, [files, maxFiles, maxImageSize, maxVideoSize, onChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!disabled && e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    onChange(files.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Photos & Videos</h3>
          <p className="text-sm text-muted-foreground">
            Add photos or videos of your experience (optional)
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {files.length}/{maxFiles}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:border-primary/50"
        )}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Drag and drop or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Images (max {maxImageSize / (1024 * 1024)}MB) • Videos (max {maxVideoSize / (1024 * 1024)}MB)
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file) => (
            <div key={file.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              {file.type === 'image' ? (
                <img
                  src={file.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-1 left-1">
                {file.type === 'image' ? (
                  <Image className="h-4 w-4 text-white drop-shadow" />
                ) : (
                  <Video className="h-4 w-4 text-white drop-shadow" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
