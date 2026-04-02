'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  FolderKanban,
  CheckSquare,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Settings,
  Bell,
  Wrench,
  Target,
  Zap,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useApp } from '@/context/app-context';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  labelEn?: string;
  icon: React.ElementType;
  category: string;
  categoryEn?: string;
  action?: () => void;
}

// Navigation commands
const navCommands: CommandItem[] = [
  { id: '/dashboard', label: 'لوحة التحكم', labelEn: 'Dashboard', icon: Home, category: 'الرئيسية', categoryEn: 'Main' },
  { id: '/dashboard/projects', label: 'المشاريع', labelEn: 'Projects', icon: FolderKanban, category: 'إدارة المشاريع', categoryEn: 'Project Management' },
  { id: '/dashboard/tasks', label: 'المهام', labelEn: 'Tasks', icon: CheckSquare, category: 'إدارة المشاريع', categoryEn: 'Project Management' },
  { id: '/dashboard/reports?tab=meetings', label: 'التقويم والاجتماعات', labelEn: 'Calendar & Meetings', icon: Calendar, category: 'إدارة المشاريع', categoryEn: 'Project Management' },
  { id: '/dashboard/reports', label: 'التقارير', labelEn: 'Reports', icon: FileText, category: 'إدارة المشاريع', categoryEn: 'Project Management' },
  { id: '/dashboard/contracts?tab=clients', label: 'العملاء', labelEn: 'Clients', icon: Users, category: 'العملاء والعقود', categoryEn: 'Clients & Contracts' },
  { id: '/dashboard/contracts', label: 'العقود', labelEn: 'Contracts', icon: FileText, category: 'العملاء والعقود', categoryEn: 'Clients & Contracts' },
  { id: '/dashboard/contracts?tab=proposals', label: 'العروض', labelEn: 'Proposals', icon: FileText, category: 'العملاء والعقود', categoryEn: 'Clients & Contracts' },
  { id: '/dashboard/contracts?tab=bidding', label: 'المناقصات', labelEn: 'Bidding', icon: Target, category: 'العملاء والعقود', categoryEn: 'Clients & Contracts' },
  { id: '/dashboard/finance', label: 'الشئون المالية', labelEn: 'Finance', icon: DollarSign, category: 'المالية', categoryEn: 'Finance' },
  { id: '/dashboard/assets', label: 'المشتريات والمخزون', labelEn: 'Procurement & Inventory', icon: Wrench, category: 'المشتريات', categoryEn: 'Procurement' },
  { id: '/dashboard/site-management', label: 'إدارة الموقع', labelEn: 'Site Management', icon: Wrench, category: 'الموقع', categoryEn: 'Site' },
  { id: '/dashboard/assets?tab=equipment', label: 'المعدات', labelEn: 'Equipment', icon: Wrench, category: 'الموقع', categoryEn: 'Site' },
  { id: '/dashboard/hr', label: 'الموارد البشرية', labelEn: 'Human Resources', icon: Users, category: 'الموارد البشرية', categoryEn: 'Human Resources' },
  { id: '/dashboard/documents', label: 'المستندات', labelEn: 'Documents', icon: FileText, category: 'المستندات', categoryEn: 'Documents' },
  { id: '/dashboard/documents?tab=transmittals', label: 'التنازلات', labelEn: 'Transmittals', icon: FileText, category: 'المستندات', categoryEn: 'Documents' },
  { id: '/dashboard/ai-chat', label: 'المساعد الذكي', labelEn: 'AI Assistant', icon: Zap, category: 'النظام', categoryEn: 'System' },
  { id: '/dashboard/notifications', label: 'الإشعارات', labelEn: 'Notifications', icon: Bell, category: 'النظام', categoryEn: 'System' },
  { id: '/dashboard/settings', label: 'الإعدادات', labelEn: 'Settings', icon: Settings, category: 'النظام', categoryEn: 'System' },
  { id: '/dashboard/settings?tab=automations', label: 'الأتمتة', labelEn: 'Automations', icon: Zap, category: 'النظام', categoryEn: 'System' },
  { id: '/dashboard/profile', label: 'الملف الشخصي', labelEn: 'Profile', icon: Users, category: 'النظام', categoryEn: 'System' },
];

// Engineering-specific quick actions (built dynamically with router)
function buildActionCommands(router: ReturnType<typeof useRouter>): CommandItem[] {
  return [
    {
      id: 'action-new-project',
      label: 'مشروع جديد',
      labelEn: 'New Project',
      icon: Plus,
      category: 'إجراءات سريعة',
      categoryEn: 'Quick Actions',
      action: () => router.push('/dashboard/projects'),
    },
    {
      id: 'action-new-task',
      label: 'مهمة جديدة',
      labelEn: 'New Task',
      icon: CheckSquare,
      category: 'إجراءات سريعة',
      categoryEn: 'Quick Actions',
      action: () => router.push('/dashboard/tasks'),
    },
    {
      id: 'action-view-sla',
      label: 'عرض SLA',
      labelEn: 'View SLA',
      icon: BarChart3,
      category: 'إجراءات سريعة',
      categoryEn: 'Quick Actions',
      action: () => router.push('/dashboard/reports'),
    },
    {
      id: 'action-ask-ai',
      label: 'اسأل بلو',
      labelEn: 'Ask Blu',
      icon: Sparkles,
      category: 'إجراءات سريعة',
      categoryEn: 'Quick Actions',
      action: () => router.push('/dashboard/ai-chat'),
    },
  ];
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { isRTL, language } = useApp();

  const allCommands = useCallback((): CommandItem[] => {
    return [...buildActionCommands(router), ...navCommands];
  }, [router]);

  // Filter commands based on search (bilingual)
  const filteredCommands = allCommands().filter(
    (cmd) =>
      cmd.label.includes(search) ||
      (cmd.labelEn && cmd.labelEn.toLowerCase().includes(search.toLowerCase())) ||
      cmd.category.includes(search) ||
      (cmd.categoryEn && cmd.categoryEn.toLowerCase().includes(search.toLowerCase()))
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleCommandSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  // Handle command selection
  const handleCommandSelect = (cmd: CommandItem) => {
    if (cmd.action) {
      cmd.action();
    } else {
      router.push(cmd.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ar' ? 'ابحث عن صفحة أو إجراء...' : 'Search for a page or action...'}
            className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent text-foreground"
          />
          <kbd className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded hidden sm:inline-block border border-border">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <p className="px-3 py-2 text-xs text-muted-foreground font-medium">
                {language === 'ar' ? category : (cmds[0]?.categoryEn || category)}
              </p>
              {cmds.map((cmd) => {
                const Icon = cmd.icon;
                const globalIndex = filteredCommands.indexOf(cmd);
                const isAction = cmd.id.startsWith('action-');
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleCommandSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      selectedIndex === globalIndex
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-foreground/80 hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{language === 'ar' ? cmd.label : (cmd.labelEn || cmd.label)}</span>
                    {isAction && (
                      <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {language === 'ar' ? 'إجراء' : 'Action'}
                      </Badge>
                    )}
                    {selectedIndex === globalIndex && (
                      isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>{language === 'ar' ? `لا توجد نتائج لـ "${search}"` : `No results for "${search}"`}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↑↓</kbd>
              {language === 'ar' ? 'للتنقل' : 'Navigate'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↵</kbd>
              {language === 'ar' ? 'للتأكيد' : 'Select'}
            </span>
          </div>
          <span>BluePrint</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
