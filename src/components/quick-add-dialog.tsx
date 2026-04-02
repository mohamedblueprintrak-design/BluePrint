'use client';

import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
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
import { Plus } from 'lucide-react';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}

export function QuickAddDialog() {
  const { quickAddDialog, closeQuickAddDialog, language } = useApp();
  const isAr = language === 'ar';
  const { toast } = useToast();

  const isOpen = quickAddDialog !== null;

  const handleSave = () => {
    toast({
      title: isAr ? 'تم بنجاح' : 'Success',
      description: isAr ? 'تم إنشاء العنصر بنجاح' : 'Item created successfully',
    });
    closeQuickAddDialog();
  };

  const getDialogInfo = (): { title: string; fields: FormField[] } => {
    switch (quickAddDialog) {
      case 'project':
        return {
          title: isAr ? 'مشروع جديد' : 'New Project',
          fields: [
            { key: 'name', label: isAr ? 'اسم المشروع' : 'Project Name', type: 'text', placeholder: isAr ? 'أدخل اسم المشروع' : 'Enter project name' },
            { key: 'client', label: isAr ? 'العميل' : 'Client', type: 'select', options: [isAr ? 'اختر عميل' : 'Select client', isAr ? 'عميل 1' : 'Client 1', isAr ? 'عميل 2' : 'Client 2'] },
            { key: 'description', label: isAr ? 'الوصف' : 'Description', type: 'textarea', placeholder: isAr ? 'وصف المشروع' : 'Project description' },
          ],
        };
      case 'client':
        return {
          title: isAr ? 'عميل جديد' : 'New Client',
          fields: [
            { key: 'name', label: isAr ? 'اسم العميل' : 'Client Name', type: 'text', placeholder: isAr ? 'أدخل اسم العميل' : 'Enter client name' },
            { key: 'email', label: isAr ? 'البريد الإلكتروني' : 'Email', type: 'text', placeholder: 'example@email.com' },
            { key: 'phone', label: isAr ? 'الهاتف' : 'Phone', type: 'text', placeholder: '+971 XX XXX XXXX' },
          ],
        };
      case 'invoice':
        return {
          title: isAr ? 'فاتورة جديدة' : 'New Invoice',
          fields: [
            { key: 'client', label: isAr ? 'العميل' : 'Client', type: 'select', options: [isAr ? 'اختر عميل' : 'Select client', isAr ? 'عميل 1' : 'Client 1'] },
            { key: 'amount', label: isAr ? 'المبلغ' : 'Amount', type: 'text', placeholder: '0.00' },
            { key: 'dueDate', label: isAr ? 'تاريخ الاستحقاق' : 'Due Date', type: 'text', placeholder: isAr ? 'YYYY-MM-DD' : 'YYYY-MM-DD' },
          ],
        };
      case 'task':
        return {
          title: isAr ? 'مهمة جديدة' : 'New Task',
          fields: [
            { key: 'title', label: isAr ? 'العنوان' : 'Title', type: 'text', placeholder: isAr ? 'أدخل عنوان المهمة' : 'Enter task title' },
            { key: 'project', label: isAr ? 'المشروع' : 'Project', type: 'select', options: [isAr ? 'اختر مشروع' : 'Select project', isAr ? 'مشروع 1' : 'Project 1'] },
            { key: 'priority', label: isAr ? 'الأولوية' : 'Priority', type: 'select', options: [isAr ? 'اختر أولوية' : 'Select priority', isAr ? 'عالية' : 'High', isAr ? 'متوسطة' : 'Medium', isAr ? 'منخفضة' : 'Low'] },
          ],
        };
      default:
        return { title: '', fields: [] };
    }
  };

  const dialogInfo = getDialogInfo();

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
              <Label className="text-foreground/80">{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  className="bg-muted border-border text-foreground"
                  rows={3}
                />
              ) : field.type === 'select' ? (
                <Select>
                  <SelectTrigger className="bg-muted border-border text-foreground w-full">
                    <SelectValue placeholder={field.options?.[0]} />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {field.options?.map((opt) => (
                      <SelectItem
                        key={opt}
                        value={opt}
                        className="text-foreground hover:bg-secondary"
                      >
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
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
            className="border-border text-foreground/80"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 me-2" />
            {isAr ? 'إنشاء' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
