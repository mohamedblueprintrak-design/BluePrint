'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image as ImageIcon, FileText, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UploadedFile {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  uploadFn?: (file: File) => Promise<{ success: boolean; data?: UploadedFile; error?: { message: string } }>;
}

// Default accepted file types
const DEFAULT_ACCEPT: Record<string, string[]> = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv']
};

// Default max size: 10MB
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

// Arabic translations
const TRANSLATIONS = {
  dropzone: 'اسحب الملفات هنا أو انقر للاختيار',
  dropzoneActive: 'افلت الملفات هنا',
  uploading: 'جاري الرفع...',
  uploadSuccess: 'تم الرفع بنجاح',
  uploadError: 'فشل في الرفع',
  remove: 'إزالة',
  fileSize: 'حجم الملف كبير جداً',
  fileType: 'نوع الملف غير مسموح به',
  noFile: 'لم يتم اختيار ملف'
};

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file icon based on type
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon;
  if (type === 'application/pdf') return FileText;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('document') || type.includes('word')) return FileText;
  return File;
}

// Get file type label
function getFileTypeLabel(type: string): string {
  if (type.startsWith('image/')) return 'صورة';
  if (type === 'application/pdf') return 'PDF';
  if (type.includes('spreadsheet') || type.includes('excel')) return 'Excel';
  if (type.includes('document') || type.includes('word')) return 'Word';
  if (type === 'text/plain') return 'نص';
  if (type === 'text/csv') return 'CSV';
  return 'ملف';
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  multiple = false,
  disabled = false,
  className,
  uploadFn
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0]; // Handle single file for now
    
    setError(null);
    setUploading(true);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      let result;
      
      if (uploadFn) {
        result = await uploadFn(file);
      } else {
        // Default upload implementation
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('bp_token');
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        
        result = await response.json();
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success && result.data) {
        setUploadedFile(result.data);
        onUploadComplete?.(result.data);
      } else {
        const errorMessage = result.error?.message || TRANSLATIONS.uploadError;
        setError(errorMessage);
        onUploadError?.(errorMessage);
      }
    } catch {
      setError(TRANSLATIONS.uploadError);
      onUploadError?.(TRANSLATIONS.uploadError);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [uploadFn, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: disabled || uploading,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      const errorCode = rejection.errors[0]?.code;
      if (errorCode === 'file-too-large') {
        setError(TRANSLATIONS.fileSize);
      } else if (errorCode === 'file-invalid-type') {
        setError(TRANSLATIONS.fileType);
      } else {
        setError(rejection.errors[0]?.message || TRANSLATIONS.uploadError);
      }
    }
  });

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    setProgress(0);
  };

  if (uploadedFile) {
    const FileIcon = getFileIcon(uploadedFile.type);
    
    return (
      <div className={cn("border rounded-lg p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <FileIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                {TRANSLATIONS.uploadSuccess}
              </p>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {getFileTypeLabel(uploadedFile.type)} • {formatFileSize(uploadedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5",
          isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/20",
          (disabled || uploading) && "opacity-50 cursor-not-allowed",
          error && "border-red-500"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-6 h-6",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )}>
              {isDragActive ? TRANSLATIONS.dropzoneActive : TRANSLATIONS.dropzone}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              الحد الأقصى: {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {TRANSLATIONS.uploading} {progress}%
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setError(null)}
            className="mr-auto p-0 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Multi-file upload component
interface MultiFileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  uploadFn?: (file: File) => Promise<{ success: boolean; data?: UploadedFile; error?: { message: string } }>;
}

export function MultiFileUpload({
  onUploadComplete,
  onUploadError,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 5,
  disabled = false,
  className,
  uploadFn
}: MultiFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setError(null);
    setUploading(true);
    setProgress(0);
    
    const results: UploadedFile[] = [];
    const total = acceptedFiles.length;
    let completed = 0;
    
    try {
      for (const file of acceptedFiles) {
        let result;
        
        if (uploadFn) {
          result = await uploadFn(file);
        } else {
          const formData = new FormData();
          formData.append('file', file);
          
          const token = localStorage.getItem('bp_token');
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData
          });
          
          result = await response.json();
        }
        
        completed++;
        setProgress(Math.round((completed / total) * 100));
        
        if (result.success && result.data) {
          results.push(result.data);
        }
      }
      
      setUploadedFiles(prev => [...prev, ...results]);
      onUploadComplete?.(results);
      
    } catch {
      setError(TRANSLATIONS.uploadError);
      onUploadError?.(TRANSLATIONS.uploadError);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [uploadFn, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
    maxFiles,
    disabled: disabled || uploading
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5",
          isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/20",
          (disabled || uploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-6 h-6",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-sm font-medium",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )}>
              {isDragActive ? TRANSLATIONS.dropzoneActive : TRANSLATIONS.dropzone}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              حتى {maxFiles} ملفات • الحد الأقصى: {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {TRANSLATIONS.uploading} {progress}%
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setError(null)}
            className="mr-auto p-0 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
