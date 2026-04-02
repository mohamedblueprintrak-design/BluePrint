'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateProject,
  useCreateClient,
  useCreateInvoice,
  useCreateTask,
  useClients,
  useProjects,
} from '@/hooks/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  /** 'client' or 'project' means the options are dynamic from an API query */
  dynamicOptions?: 'client' | 'project';
  /** Static fallback options when dynamicOptions is not set */
  staticOptions?: string[];
}

export function QuickAddDialog() {
  const { quickAddDialog, closeQuickAddDialog, language } = useApp();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const isOpen = quickAddDialog !== null;

  // ── Form state ────────────────────────────────────────────────
  const [formData, setFormData] = useState<Record<string, string>>({});

  const updateField = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Reset form whenever the dialog type changes
  useEffect(() => {
    setFormData({});
  }, [quickAddDialog]);

  // ── Mutation hooks ────────────────────────────────────────────
  const createProject = useCreateProject();
  const createClient = useCreateClient();
  const createInvoice = useCreateInvoice();
  const createTask = useCreateTask();

  // ── Query hooks for dropdowns ────────────────────────────────
  const { data: clientsData } = useClients();
  const { data: projectsData } = useProjects();
  const clients = clientsData ?? [];
  const projects = projectsData ?? [];

  // Derived loading flag from whichever mutation is active
  const isMutating =
    createProject.isPending ||
    createClient.isPending ||
    createInvoice.isPending ||
    createTask.isPending;

  // ── Save handler ─────────────────────────────────────────────
  const handleSave = () => {
    switch (quickAddDialog) {
      case 'project': {
        const name = formData.name?.trim();
        if (!name) {
          toast({
            title: isAr ? 'تنبيه' : 'Warning',
            description: isAr ? 'اسم المشروع مطلوب' : 'Project name is required',
          });
          return;
        }
        createProject.mutate(
          {
            name,
            clientId: formData.client || undefined,
            description: formData.description || undefined,
            status: 'pending',
            progressPercentage: 0,
          },
          {
            onSuccess: () => {
              toast({
                title: isAr ? 'تم بنجاح' : 'Success',
                description: isAr ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully',
              });
              setFormData({});
              closeQuickAddDialog();
            },
            onError: () => {
              toast({
                title: isAr ? 'خطأ' : 'Error',
                description: isAr ? 'فشل إنشاء المشروع' : 'Failed to create project',
              });
            },
          },
        );
        break;
      }

      case 'client': {
        const name = formData.name?.trim();
        if (!name) {
          toast({
            title: isAr ? 'تنبيه' : 'Warning',
            description: isAr ? 'اسم العميل مطلوب' : 'Client name is required',
          });
          return;
        }
        createClient.mutate(
          {
            name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            clientType: 'company',
          },
          {
            onSuccess: () => {
              toast({
                title: isAr ? 'تم بنجاح' : 'Success',
                description: isAr ? 'تم إنشاء العميل بنجاح' : 'Client created successfully',
              });
              setFormData({});
              closeQuickAddDialog();
            },
            onError: () => {
              toast({
                title: isAr ? 'خطأ' : 'Error',
                description: isAr ? 'فشل إنشاء العميل' : 'Failed to create client',
              });
            },
          },
        );
        break;
      }

      case 'invoice': {
        const clientId = formData.client?.trim();
        if (!clientId) {
          toast({
            title: isAr ? 'تنبيه' : 'Warning',
            description: isAr ? 'يرجى اختيار عميل' : 'Please select a client',
          });
          return;
        }
        const amount = parseFloat(formData.amount);
        if (!formData.amount || isNaN(amount) || amount <= 0) {
          toast({
            title: isAr ? 'تنبيه' : 'Warning',
            description: isAr ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount',
          });
          return;
        }
        createInvoice.mutate(
          {
            clientId,
            total: amount,
            subtotal: amount,
            dueDate: formData.dueDate || undefined,
            items: [],
            taxRate: 0,
            taxAmount: 0,
            discountAmount: 0,
            paidAmount: 0,
            status: 'draft',
          },
          {
            onSuccess: () => {
              toast({
                title: isAr ? 'تم بنجاح' : 'Success',
                description: isAr ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created successfully',
              });
              setFormData({});
              closeQuickAddDialog();
            },
            onError: () => {
              toast({
                title: isAr ? 'خطأ' : 'Error',
                description: isAr ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice',
              });
            },
          },
        );
        break;
      }

      case 'task': {
        const title = formData.title?.trim();
        if (!title) {
          toast({
            title: isAr ? 'تنبيه' : 'Warning',
            description: isAr ? 'عنوان المهمة مطلوب' : 'Task title is required',
          });
          return;
        }
        createTask.mutate(
          {
            title,
            projectId: formData.project || undefined,
            priority: (formData.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
            status: 'todo',
            progress: 0,
          },
          {
            onSuccess: () => {
              toast({
                title: isAr ? 'تم بنجاح' : 'Success',
                description: isAr ? 'تم إنشاء المهمة بنجاح' : 'Task created successfully',
              });
              setFormData({});
              closeQuickAddDialog();
            },
            onError: () => {
              toast({
                title: isAr ? 'خطأ' : 'Error',
                description: isAr ? 'فشل إنشاء المهمة' : 'Failed to create task',
              });
            },
          },
        );
        break;
      }
    }
  };

  // ── Dialog metadata ──────────────────────────────────────────
  const getDialogInfo = (): { title: string; fields: FormField[] } => {
    switch (quickAddDialog) {
      case 'project':
        return {
          title: isAr ? 'مشروع جديد' : 'New Project',
          fields: [
            { key: 'name', label: isAr ? 'اسم المشروع' : 'Project Name', type: 'text', placeholder: isAr ? 'أدخل اسم المشروع' : 'Enter project name', required: true },
            { key: 'client', label: isAr ? 'العميل' : 'Client', type: 'select', dynamicOptions: 'client' },
            { key: 'description', label: isAr ? 'الوصف' : 'Description', type: 'textarea', placeholder: isAr ? 'وصف المشروع' : 'Project description' },
          ],
        };
      case 'client':
        return {
          title: isAr ? 'عميل جديد' : 'New Client',
          fields: [
            { key: 'name', label: isAr ? 'اسم العميل' : 'Client Name', type: 'text', placeholder: isAr ? 'أدخل اسم العميل' : 'Enter client name', required: true },
            { key: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email', type: 'text', placeholder: 'example@email.com' },
            { key: 'phone', label: isAr ? 'الهاتف' : 'Phone', type: 'text', placeholder: '+971 XX XXX XXXX' },
          ],
        };
      case 'invoice':
        return {
          title: isAr ? 'فاتورة جديدة' : 'New Invoice',
          fields: [
            { key: 'client', label: isAr ? 'العميل' : 'Client', type: 'select', dynamicOptions: 'client', required: true },
            { key: 'amount', label: isAr ? 'المبلغ' : 'Amount', type: 'text', placeholder: '0.00', required: true },
            { key: 'dueDate', label: isAr ? 'تاريخ الاستحقاق' : 'Due Date', type: 'text', placeholder: isAr ? 'YYYY-MM-DD' : 'YYYY-MM-DD' },
          ],
        };
      case 'task':
        return {
          title: isAr ? 'مهمة جديدة' : 'New Task',
          fields: [
            { key: 'title', label: isAr ? 'العنوان' : 'Title', type: 'text', placeholder: isAr ? 'أدخل عنوان المهمة' : 'Enter task title', required: true },
            { key: 'project', label: isAr ? 'المشروع' : 'Project', type: 'select', dynamicOptions: 'project' },
            { key: 'priority', label: isAr ? 'الأولوية' : 'Priority', type: 'select', staticOptions: ['high', 'medium', 'low', 'urgent'] },
          ],
        };
      default:
        return { title: '', fields: [] };
    }
  };

  const dialogInfo = getDialogInfo();

  // ── Helpers ──────────────────────────────────────────────────
  /** Resolve the display label for a select option based on context */
  const resolveOptionLabel = (field: FormField, value: string): string => {
    if (field.key === 'priority') {
      const labels: Record<string, { ar: string; en: string }> = {
        high: { ar: 'عالية', en: 'High' },
        medium: { ar: 'متوسطة', en: 'Medium' },
        low: { ar: 'منخفضة', en: 'Low' },
        urgent: { ar: 'عاجلة', en: 'Urgent' },
      };
      const entry = labels[value];
      return entry ? (isAr ? entry.ar : entry.en) : value;
    }
    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeQuickAddDialog(); }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md" dir={isAr ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            {dialogInfo.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {dialogInfo.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-foreground/80">
                {field.label}
                {field.required && <span className="text-red-400 ms-1">*</span>}
              </Label>

              {field.type === 'textarea' ? (
                <Textarea
                  value={formData[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-muted border-border text-foreground"
                  rows={3}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.key] ?? ''}
                  onValueChange={(val) => updateField(field.key, val)}
                >
                  <SelectTrigger className="bg-muted border-border text-foreground w-full">
                    <SelectValue
                      placeholder={
                        field.dynamicOptions === 'client'
                          ? isAr ? 'اختر عميل' : 'Select client'
                          : field.dynamicOptions === 'project'
                            ? isAr ? 'اختر مشروع' : 'Select project'
                            : isAr ? 'اختر خيار' : 'Select option'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {/* Dynamic options from API */}
                    {field.dynamicOptions === 'client' &&
                      clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-foreground hover:bg-secondary">
                          {c.name}
                        </SelectItem>
                      ))}
                    {field.dynamicOptions === 'project' &&
                      projects.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-foreground hover:bg-secondary">
                          {p.name}
                        </SelectItem>
                      ))}

                    {/* Static options (e.g. priority) */}
                    {!field.dynamicOptions &&
                      field.staticOptions?.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-foreground hover:bg-secondary">
                          {resolveOptionLabel(field, opt)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-muted border-border text-foreground"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={closeQuickAddDialog}
            disabled={isMutating}
            className="border-border text-foreground/80"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isMutating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isMutating ? (
              <Loader2 className="w-4 h-4 me-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 me-2" />
            )}
            {isAr ? 'إنشاء' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
