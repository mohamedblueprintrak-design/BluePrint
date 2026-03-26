'use client';

import { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  Search,
  ChevronLeft,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// All available commands
const commands = [
  { id: '/dashboard', label: 'لوحة التحكم', icon: Home, category: 'الرئيسية' },
  { id: '/dashboard/projects', label: 'المشاريع', icon: FolderKanban, category: 'إدارة المشاريع' },
  { id: '/dashboard/tasks', label: 'المهام', icon: CheckSquare, category: 'إدارة المشاريع' },
  { id: '/dashboard/calendar', label: 'التقويم', icon: Calendar, category: 'إدارة المشاريع' },
  { id: '/dashboard/reports', label: 'التقارير', icon: FileText, category: 'إدارة المشاريع' },
  { id: '/dashboard/clients', label: 'العملاء', icon: Users, category: 'العملاء والمبيعات' },
  { id: '/dashboard/contracts', label: 'العقود', icon: FileText, category: 'العملاء والمبيعات' },
  { id: '/dashboard/proposals', label: 'العروض', icon: FileText, category: 'العملاء والمبيعات' },
  { id: '/dashboard/bidding', label: 'المناقصات', icon: Target, category: 'العملاء والمبيعات' },
  { id: '/dashboard/invoices', label: 'الفواتير', icon: DollarSign, category: 'المالية' },
  { id: '/dashboard/budgets', label: 'الميزانيات', icon: DollarSign, category: 'المالية' },
  { id: '/dashboard/boq', label: 'جدول الكميات', icon: FileText, category: 'المالية' },
  { id: '/dashboard/defects', label: 'العيوب', icon: Wrench, category: 'الجودة والسلامة' },
  { id: '/dashboard/site-diary', label: 'تقارير الموقع', icon: FileText, category: 'الجودة والسلامة' },
  { id: '/dashboard/team', label: 'الفريق', icon: Users, category: 'الموارد' },
  { id: '/dashboard/hr', label: 'الموارد البشرية', icon: Users, category: 'الموارد' },
  { id: '/dashboard/equipment', label: 'المعدات', icon: Wrench, category: 'الموارد' },
  { id: '/dashboard/documents', label: 'المستندات', icon: FileText, category: 'الموارد' },
  { id: '/dashboard/automations', label: 'الأتمتة', icon: Zap, category: 'النظام' },
  { id: '/dashboard/ai-chat', label: 'المساعد الذكي', icon: Zap, category: 'النظام' },
  { id: '/dashboard/notifications', label: 'الإشعارات', icon: Bell, category: 'النظام' },
  { id: '/dashboard/settings', label: 'الإعدادات', icon: Settings, category: 'النظام' },
  { id: '/dashboard/profile', label: 'الملف الشخصي', icon: Users, category: 'النظام' },
  { id: '/dashboard/help', label: 'المساعدة', icon: HelpCircle, category: 'النظام' },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter commands based on search
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.includes(search) ||
      cmd.category.includes(search)
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, typeof commands>);

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
        router.push(filteredCommands[selectedIndex].id);
        onOpenChange(false);
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  // Handle command selection
  const handleSelect = (id: string) => {
    router.push(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0" dir="rtl">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن صفحة أو إجراء..."
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
          <kbd className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded hidden sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <p className="px-3 py-2 text-xs text-gray-400 font-medium">{category}</p>
              {cmds.map((cmd) => {
                const Icon = cmd.icon;
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.id)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      selectedIndex === globalIndex
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-right">{cmd.label}</span>
                    {selectedIndex === globalIndex && (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>لا توجد نتائج لـ "{search}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd>
              للتنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
              للتأكيد
            </span>
          </div>
          <span>BluePrint</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
