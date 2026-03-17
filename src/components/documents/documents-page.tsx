'use client';

import { useState, useCallback, useRef } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { useDocuments, useUploadFile, useCreateDocument, useDeleteDocument, CreateDocumentData } from '@/hooks/use-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Search, Grid, List, Download, Eye, Trash2,
  Upload, File, FileImage, FileSpreadsheet, FileCode, FileArchive,
  Calendar, HardDrive, FolderOpen, X, Tag, CloudUpload, CheckCircle2, AlertCircle
} from 'lucide-react';
import type { Document } from '@/types';

// File type configurations
const FILE_TYPES = [
  { value: 'all', label: 'الكل', labelEn: 'All', icon: File },
  { value: 'pdf', label: 'PDF', labelEn: 'PDF', icon: FileText, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  { value: 'word', label: 'Word', labelEn: 'Word', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { value: 'excel', label: 'Excel', labelEn: 'Excel', icon: FileSpreadsheet, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { value: 'image', label: 'صورة', labelEn: 'Image', icon: FileImage, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { value: 'cad', label: 'رسم هندسي', labelEn: 'CAD', icon: FileCode, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  { value: 'archive', label: 'أرشيف', labelEn: 'Archive', icon: FileArchive, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
];

// Category configurations
const CATEGORIES = [
  { value: 'all', label: 'الكل', labelEn: 'All' },
  { value: 'contracts', label: 'عقود', labelEn: 'Contracts', color: 'bg-blue-500' },
  { value: 'reports', label: 'تقارير', labelEn: 'Reports', color: 'bg-green-500' },
  { value: 'drawings', label: 'رسومات', labelEn: 'Drawings', color: 'bg-purple-500' },
  { value: 'invoices', label: 'فواتير', labelEn: 'Invoices', color: 'bg-amber-500' },
  { value: 'correspondence', label: 'مراسلات', labelEn: 'Correspondence', color: 'bg-cyan-500' },
  { value: 'other', label: 'أخرى', labelEn: 'Other', color: 'bg-gray-500' },
];

// Format file size
function formatFileSize(bytes?: number, language: 'ar' | 'en' = 'ar'): string {
  if (!bytes) return '-';
  const sizes = language === 'ar' 
    ? ['بايت', 'ك.ب', 'م.ب', 'ج.ب'] 
    : ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

// Get file type config
function getFileTypeConfig(fileType?: string) {
  return FILE_TYPES.find(t => t.value === fileType) || FILE_TYPES[0];
}

// Get category config
function getCategoryConfig(category: string) {
  return CATEGORIES.find(c => c.value === category) || CATEGORIES[6];
}

// Get file type from mime type
function getFileTypeFromMime(mimeType?: string): string {
  if (!mimeType) return 'other';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'word';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('cad') || mimeType.includes('dwg')) return 'cad';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
  return 'other';
}

export function DocumentsPage() {
  const { language } = useApp();
  const { t, formatDate } = useTranslation(language);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    category: '',
    description: '',
    tags: '',
  });

  // Data hooks
  const { data: documentsData, isLoading, isError, error, refetch } = useDocuments();
  const uploadFileMutation = useUploadFile();
  const createDocumentMutation = useCreateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  // Extract documents from API response
  const documents = documentsData?.data || [];

  // Calculate stats
  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum: number, doc: Document) => sum + (doc.fileSize || 0), 0);
  
  // Recent uploads (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentUploads = documents.filter((doc: Document) => 
    new Date(doc.createdAt) >= weekAgo
  ).length;

  const stats = { totalDocuments, totalSize, recentUploads };

  // Filter documents
  const filteredDocuments = documents.filter((doc: Document) => {
    // Search filter
    const matchesSearch = 
      doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const docFileType = doc.fileType || getFileTypeFromMime(doc.mimeType);
    const matchesType = typeFilter === 'all' || docFileType === typeFilter;

    // Category filter
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;

    // Date range filter
    let matchesDateRange = true;
    if (dateFromFilter && doc.createdAt) {
      matchesDateRange = new Date(doc.createdAt) >= new Date(dateFromFilter);
    }
    if (dateToFilter && doc.createdAt) {
      matchesDateRange = matchesDateRange && new Date(doc.createdAt) <= new Date(dateToFilter);
    }

    return matchesSearch && matchesType && matchesCategory && matchesDateRange;
  });

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadForm(prev => ({ ...prev, file }));
    }
  }, []);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadForm(prev => ({ ...prev, file: files![0] }));
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار ملف' : 'Please select a file',
        variant: 'destructive'
      });
      return;
    }

    if (!uploadForm.category) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى اختيار الفئة' : 'Please select a category',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload file to storage
      setUploadProgress(30);
      const uploadResult = await uploadFileMutation.mutateAsync(uploadForm.file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error?.message || 'Upload failed');
      }

      setUploadProgress(60);

      // Step 2: Create document record in database
      const fileData = uploadResult.data;
      if (!fileData) {
        throw new Error('Upload succeeded but no file data returned');
      }
      
      const tags = uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      const documentData: CreateDocumentData = {
        filename: fileData.filename,
        originalName: fileData.name,
        filePath: fileData.url,
        fileType: fileData.category,
        mimeType: fileData.type,
        fileSize: fileData.size,
        category: uploadForm.category,
        description: uploadForm.description || '',
        tags: tags
      };

      const createResult = await createDocumentMutation.mutateAsync(documentData);
      
      setUploadProgress(100);

      if (!createResult.success) {
        throw new Error(createResult.error?.message || 'Failed to create document record');
      }

      toast({
        title: t.successSave,
        description: language === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully'
      });

      setShowUploadDialog(false);
      resetUploadForm();
      refetch();
    } catch (_err) {
      console.error('Upload error:', _err);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: _err instanceof Error ? _err.message : (language === 'ar' ? 'فشل في رفع الملف' : 'Failed to upload file'),
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadForm({
      file: null,
      category: '',
      description: '',
      tags: '',
    });
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle download
  const handleDownload = (doc: Document) => {
    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = doc.filePath;
      link.download = doc.originalName || doc.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: language === 'ar' ? 'جاري التحميل' : 'Downloading',
        description: doc.originalName || doc.filename
      });
    } catch (_err) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل الملف' : 'Failed to download file',
        variant: 'destructive'
      });
    }
  };

  // Handle preview
  const handlePreview = (doc: Document) => {
    setSelectedDocument(doc);
    setShowPreviewDialog(true);
  };

  // Handle delete
  const handleDelete = async (doc: Document) => {
    if (!confirm(t.confirmDelete)) return;
    
    try {
      const result = await deleteDocumentMutation.mutateAsync(doc.id);
      
      if (result.success) {
        toast({
          title: t.successDelete,
          description: language === 'ar' ? 'تم حذف المستند' : 'Document deleted'
        });
        refetch();
      } else {
        throw new Error(result.error?.message || 'Delete failed');
      }
    } catch (_err) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: _err instanceof Error ? _err.message : (language === 'ar' ? 'فشل في حذف المستند' : 'Failed to delete document'),
        variant: 'destructive'
      });
    }
  };

  // Render document card (Grid view)
  const renderDocumentCard = (doc: Document) => {
    const typeConfig = getFileTypeConfig(doc.fileType || getFileTypeFromMime(doc.mimeType));
    const categoryConfig = getCategoryConfig(doc.category);
    const TypeIcon = typeConfig.icon;

    return (
      <Card 
        key={doc.id}
        className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all group"
      >
        <CardContent className="p-4 space-y-3">
          {/* File icon and type badge */}
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${typeConfig.bgColor}`}>
              <TypeIcon className={`w-8 h-8 ${typeConfig.color}`} />
            </div>
            <Badge variant="secondary" className={`${categoryConfig.color} text-white text-xs`}>
              {language === 'ar' ? categoryConfig.label : categoryConfig.labelEn}
            </Badge>
          </div>

          {/* File name */}
          <div className="min-h-[2.5rem]">
            <p className="text-white font-medium text-sm line-clamp-2">
              {doc.originalName || doc.filename}
            </p>
          </div>

          {/* File type badge */}
          <Badge variant="outline" className="text-slate-400 border-slate-700 text-xs">
            {typeConfig.value.toUpperCase()}
          </Badge>

          {/* File info */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {formatFileSize(doc.fileSize, language)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(doc.createdAt)}
            </span>
          </div>

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-slate-700/50 text-slate-400 text-[10px]">
                  {tag}
                </Badge>
              ))}
              {doc.tags.length > 2 && (
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 text-[10px]">
                  +{doc.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => handlePreview(doc)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => handleDownload(doc)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={() => handleDelete(doc)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render list item (List view)
  const renderListItem = (doc: Document) => {
    const typeConfig = getFileTypeConfig(doc.fileType || getFileTypeFromMime(doc.mimeType));
    const categoryConfig = getCategoryConfig(doc.category);
    const TypeIcon = typeConfig.icon;

    return (
      <TableRow key={doc.id} className="border-slate-700 hover:bg-slate-800/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded ${typeConfig.bgColor}`}>
              <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {doc.originalName || doc.filename}
              </p>
              {doc.description && (
                <p className="text-slate-500 text-xs truncate max-w-[200px]">
                  {doc.description}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-slate-400 border-slate-700">
            {typeConfig.value.toUpperCase()}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={`${categoryConfig.color} text-white`}>
            {language === 'ar' ? categoryConfig.label : categoryConfig.labelEn}
          </Badge>
        </TableCell>
        <TableCell className="text-slate-300">
          {formatFileSize(doc.fileSize, language)}
        </TableCell>
        <TableCell className="text-slate-300">
          {formatDate(doc.createdAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => handlePreview(doc)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => handleDownload(doc)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-slate-400 hover:text-red-400"
              onClick={() => handleDelete(doc)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'إجمالي المستندات' : 'Total Documents'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <HardDrive className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatFileSize(stats.totalSize, language)}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'إجمالي الحجم' : 'Total Size'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.recentUploads}</p>
                <p className="text-sm text-slate-400">
                  {language === 'ar' ? 'مرفوعات حديثة' : 'Recent Uploads'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={language === 'ar' ? 'بحث في المستندات...' : 'Search documents...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={language === 'ar' ? 'النوع' : 'Type'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {FILE_TYPES.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <TypeIcon className={`w-4 h-4 ${type.color || 'text-slate-400'}`} />
                      {language === 'ar' ? type.label : type.labelEn}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder={language === 'ar' ? 'الفئة' : 'Category'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {category.value !== 'all' && (
                      <div className={`w-2 h-2 rounded-full ${category.color}`} />
                    )}
                    {language === 'ar' ? category.label : category.labelEn}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-[140px] bg-slate-800/50 border-slate-700 text-white"
              placeholder={language === 'ar' ? 'من' : 'From'}
            />
            <Input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-[140px] bg-slate-800/50 border-slate-700 text-white"
              placeholder={language === 'ar' ? 'إلى' : 'To'}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 me-1" />
              {language === 'ar' ? 'شبكة' : 'Grid'}
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 me-1" />
              {language === 'ar' ? 'قائمة' : 'List'}
            </Button>
          </div>

          {/* Upload Dialog */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="w-4 h-4 me-2" />
                {language === 'ar' ? 'رفع مستند' : 'Upload Document'}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'رفع مستند جديد' : 'Upload New Document'}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {language === 'ar' ? 'اسحب الملف أو اختر من جهازك' : 'Drag file or select from your device'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.jpg,.jpeg,.png,.zip,.rar"
                  />
                  
                  {uploadForm.file ? (
                    <div className="space-y-3">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
                      <div>
                        <p className="text-white font-medium">{uploadForm.file.name}</p>
                        <p className="text-slate-400 text-sm">
                          {formatFileSize(uploadForm.file.size, language)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400"
                        onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                      >
                        <X className="w-4 h-4 me-1" />
                        {language === 'ar' ? 'إزالة' : 'Remove'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <CloudUpload className="w-12 h-12 mx-auto text-slate-500" />
                      <div>
                        <p className="text-slate-300">
                          {language === 'ar' ? 'اسحب الملف هنا' : 'Drag file here'}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {language === 'ar' ? 'أو' : 'or'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {language === 'ar' ? 'اختر ملف' : 'Select File'}
                      </Button>
                      <p className="text-slate-500 text-xs">
                        {language === 'ar' 
                          ? 'PDF, Word, Excel, CAD, Images, Archives'
                          : 'PDF, Word, Excel, CAD, Images, Archives'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-slate-400 text-sm text-center">
                      {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'} {uploadProgress}%
                    </p>
                  </div>
                )}

                <Separator className="bg-slate-700" />

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الفئة' : 'Category'} *</Label>
                  <Select 
                    value={uploadForm.category} 
                    onValueChange={(v) => setUploadForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {CATEGORIES.filter(c => c.value !== 'all').map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${category.color}`} />
                            {language === 'ar' ? category.label : category.labelEn}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={2}
                    placeholder={language === 'ar' ? 'وصف المستند...' : 'Document description...'}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-slate-300">{language === 'ar' ? 'الوسوم' : 'Tags'}</Label>
                  <Input
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder={language === 'ar' ? 'عقد، تقرير، مهم' : 'contract, report, important'}
                  />
                  <p className="text-xs text-slate-500">
                    {language === 'ar' ? 'افصل بين الوسوم بفاصلة' : 'Separate tags with commas'}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowUploadDialog(false);
                    resetUploadForm();
                  }} 
                  className="text-slate-400"
                  disabled={isUploading}
                >
                  {t.cancel}
                </Button>
                <Button 
                  onClick={handleUpload} 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={isUploading || !uploadForm.file}
                >
                  {isUploading 
                    ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') 
                    : (language === 'ar' ? 'رفع' : 'Upload')
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Documents Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-slate-400">{t.loading}</div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
          <p className="text-lg text-red-400">
            {language === 'ar' ? 'خطأ في تحميل البيانات' : 'Error loading data'}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {error?.message || (language === 'ar' ? 'يرجى المحاولة مرة أخرى' : 'Please try again')}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">{t.noData}</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 me-2" />
            {language === 'ar' ? 'رفع مستند' : 'Upload Document'}
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map(renderDocumentCard)}
        </div>
      ) : (
        <Card className="bg-slate-900/50 border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">
                  {language === 'ar' ? 'الملف' : 'File'}
                </TableHead>
                <TableHead className="text-slate-400">
                  {language === 'ar' ? 'النوع' : 'Type'}
                </TableHead>
                <TableHead className="text-slate-400">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                </TableHead>
                <TableHead className="text-slate-400">
                  {language === 'ar' ? 'الحجم' : 'Size'}
                </TableHead>
                <TableHead className="text-slate-400">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </TableHead>
                <TableHead className="text-slate-400">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map(renderListItem)}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    {(() => {
                      const typeConfig = getFileTypeConfig(selectedDocument.fileType || getFileTypeFromMime(selectedDocument.mimeType));
                      const TypeIcon = typeConfig.icon;
                      return <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />;
                    })()}
                    {selectedDocument.originalName || selectedDocument.filename}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Preview placeholder */}
                <div className="aspect-video bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    {(() => {
                      const typeConfig = getFileTypeConfig(selectedDocument.fileType || getFileTypeFromMime(selectedDocument.mimeType));
                      const TypeIcon = typeConfig.icon;
                      return <TypeIcon className={`w-16 h-16 mx-auto mb-4 ${typeConfig.color}`} />;
                    })()}
                    <p>{language === 'ar' ? 'معاينة الملف' : 'File Preview'}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {language === 'ar' ? 'غير متاح حالياً' : 'Not available at the moment'}
                    </p>
                  </div>
                </div>

                {/* Document Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'النوع' : 'Type'}
                    </Label>
                    <p className="text-white">
                      {getFileTypeConfig(selectedDocument.fileType || getFileTypeFromMime(selectedDocument.mimeType))
                        .value.toUpperCase()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'الفئة' : 'Category'}
                    </Label>
                    <p className="text-white">
                      {language === 'ar' 
                        ? getCategoryConfig(selectedDocument.category).label 
                        : getCategoryConfig(selectedDocument.category).labelEn
                      }
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'الحجم' : 'Size'}
                    </Label>
                    <p className="text-white">{formatFileSize(selectedDocument.fileSize, language)}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'تاريخ الرفع' : 'Upload Date'}
                    </Label>
                    <p className="text-white">{formatDate(selectedDocument.createdAt)}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'الإصدار' : 'Version'}
                    </Label>
                    <p className="text-white">v{selectedDocument.version || 1}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'اسم الملف' : 'Filename'}
                    </Label>
                    <p className="text-white font-mono text-sm">{selectedDocument.filename}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedDocument.description && (
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">
                      {language === 'ar' ? 'الوصف' : 'Description'}
                    </Label>
                    <p className="text-slate-300 text-sm bg-slate-800/50 p-3 rounded-lg">
                      {selectedDocument.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">{t.tags}</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-slate-800 text-slate-300">
                          <Tag className="w-3 h-3 me-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <Download className="w-4 h-4 me-2" />
                  {t.download}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setShowPreviewDialog(false);
                    handleDelete(selectedDocument);
                  }}
                >
                  <Trash2 className="w-4 h-4 me-2" />
                  {t.delete}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
