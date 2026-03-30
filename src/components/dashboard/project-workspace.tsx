'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/app-context';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  BrainCircuit,
  MessageSquare,
  Send,
  HardHat,
  Wrench,
  CreditCard,
  ClipboardList,
  Timer,
  Eye,
  Play,
  Menu,
  CircleDot,
  TrendingUp,
  Receipt,
  Landmark,
  Layers,
  FileSpreadsheet,
  Lock,
  Shield,
  Zap,
  Droplets,
  Thermometer,
  Filter,
  MessageCircle,
  HelpCircle,
  RotateCcw,
  Ban,
  PenTool,
  Waves,
  Wifi,
  Fan,
  Flame,
  LayoutGrid,
  Clock,
  Circle,
  Check,
} from 'lucide-react';
import ClientInteractionPanel from '@/components/clients/client-interaction-panel';

// ===== Types =====
interface ProjectWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  type: string;
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  progress: number;
  location?: string;
  currency: string;
  client?: { id: string; name: string; company?: string } | null;
  manager?: { id: string; name: string; avatar?: string } | null;
  _count?: { invoices: number; tasks: number; defects: number; siteReports: number; boqItems: number };
  plotNumber?: string | null;
  customerFileNumber?: string | null;
  projectType?: string | null;
  visitDate?: string | null;
  paymentReceived?: number;
  remainingBalance?: number;
  governmentApprovalStatus?: string | null;
  governmentApprovalDate?: string | null;
  licenseNumber?: string | null;
  municipalityNotes?: string | null;
  electricalStatus?: string | null;
  plumbingStatus?: string | null;
  hvacStatus?: string | null;
}

interface WorkflowPhase {
  id: string;
  projectId: string;
  phaseType: string;
  phaseCategory: string;
  status: string;
  startDate?: string;
  endDate?: string;
  slaDays: number;
  assignedToId?: string;
  assignedTo?: { id: string; name?: string; fullName?: string; avatar?: string } | null;
  notes?: string;
  order: number;
  dependsOnId?: string;
  dependsOn?: { id: string; phaseType: string; phaseCategory: string; status: string } | null;
  rejectionCount: number;
  createdAt: string;
  updatedAt: string;
  draftAssignedTo?: { id: string; name?: string; fullName?: string; avatar?: string } | null;
  draftStartDate?: string;
  draftEndDate?: string;
}

interface ClientInteraction {
  id: string;
  projectId: string;
  phaseId?: string;
  interactionType: string;
  content: string;
  respondedById?: string;
  responseContent?: string;
  responseDate?: string;
  createdAt: string;
  phase?: { id: string; phaseType: string; phaseCategory: string } | null;
  respondedBy?: { id: string; name?: string; fullName?: string; avatar?: string } | null;
}

interface InvoiceData {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  currency: string;
}

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface SiteReportData {
  id: string;
  date: string;
  weatherConditions?: string;
  workCompleted?: string;
  workforceCount: number;
  notes?: string;
}

interface DefectData {
  id: string;
  title: string;
  severity: string;
  status: string;
  location?: string;
  createdAt: string;
  resolvedDate?: string;
  reportedBy?: { id: string; name: string } | null;
}

interface BOQItemData {
  id: string;
  code?: string;
  itemNumber?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

interface DependencyInfo {
  blocked: boolean;
  blockedBy: string[];
  canStart: boolean;
  dependencyChain: string[];
}

// ===== Config Maps =====
const statusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  ACTIVE: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'نشط', labelEn: 'Active' },
  COMPLETED: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مكتمل', labelEn: 'Completed' },
  PLANNING: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'تخطيط', labelEn: 'Planning' },
  ON_HOLD: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'معلق', labelEn: 'On Hold' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'ملغى', labelEn: 'Cancelled' },
};

const typeConfig: Record<string, { labelAr: string; labelEn: string }> = {
  CONSULTANCY: { labelAr: 'استشارات', labelEn: 'Consultancy' },
  CONSTRUCTION: { labelAr: 'بناء', labelEn: 'Construction' },
  DESIGN: { labelAr: 'تصميم', labelEn: 'Design' },
  SUPERVISION: { labelAr: 'إشراف', labelEn: 'Supervision' },
};

const phaseStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string; dot: string }> = {
  NOT_STARTED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'لم يبدأ', labelEn: 'Not Started', dot: 'bg-slate-400' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress', dot: 'bg-blue-400' },
  COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مكتمل', labelEn: 'Completed', dot: 'bg-emerald-400' },
  ON_HOLD: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'معلق', labelEn: 'On Hold', dot: 'bg-amber-400' },
  DELAYED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'متأخر', labelEn: 'Delayed', dot: 'bg-red-400' },
  REJECTED: { color: 'text-red-500', bg: 'bg-red-500/20', labelAr: 'مرفوض', labelEn: 'Rejected', dot: 'bg-red-500' },
};

const phaseTypeLabels: Record<string, { ar: string; en: string }> = {
  // Architectural
  ARCHITECTURAL_SKETCH: { ar: 'التصميم التخطيطي', en: 'Schematic Design' },
  ARCHITECTURAL_CONCEPT: { ar: 'التصميم المفاهيمي', en: 'Concept Design' },
  CLIENT_APPROVAL: { ar: 'اعتماد العميل', en: 'Client Approval' },
  MODIFICATIONS: { ar: 'تعديلات التصميم', en: 'Design Modifications' },
  LETTER_OF_INTENT: { ar: 'خطاب النوايا', en: 'Letter of Intent' },
  PRELIMINARY: { ar: 'تطوير المخططات الأولية', en: 'Preliminary Drawings' },
  PRELIMINARY_APPROVAL: { ar: 'اعتماد المخططات الأولية', en: 'Preliminary Approval' },
  DESIGN_CONTRACT: { ar: 'عقد التصميم', en: 'Design Contract' },
  GREEN_BUILDING_CHECK: { ar: 'قائمة التحقق الخضراء', en: 'Green Building Checklist' },
  GREEN_BUILDING_CALC: { ar: 'حسابات المباني الخضراء', en: 'Green Building Calculations' },
  GREEN_BUILDING_CHECK_STR: { ar: 'قائمة التحقق الخضراء (إنشائي)', en: 'Green Building Checklist (Structural)' },
  THREE_D_MAX: { ar: 'التصميم الخارجي 3D', en: 'Exterior 3D Design' },
  BRAJEL: { ar: 'مستندات البراجيل', en: 'Barajeel Documents' },
  FINAL_DRAWINGS: { ar: 'المخططات النهائية', en: 'Final Drawings' },
  // Structural
  SOIL_REPORT: { ar: 'تقرير التربة', en: 'Soil Report' },
  FOUNDATION: { ar: 'القواعد', en: 'Foundation' },
  BEAMS: { ar: 'الكمرات', en: 'Beams' },
  COLUMNS: { ar: 'الأعمدة', en: 'Columns' },
  SLABS: { ar: 'البلاطات', en: 'Slabs' },
  STRUCTURAL_DETAILS: { ar: 'تفاصيل التصميم الإنشائي', en: 'Structural Details' },
  STRUCTURAL_MODELING: { ar: 'نمذجة ETABS', en: 'ETABS Modeling' },
  STRUCTURAL_CALC: { ar: 'حسابات ETABS', en: 'ETABS Calculations' },
  STRUCTURAL_SCHEDULES: { ar: 'الجداول الإنشائية', en: 'Structural Schedules' },
  STAIRCASE: { ar: 'تفاصيل الدرج', en: 'Staircase Details' },
  MUN_APPROVAL_STR: { ar: 'اعتماد البلدية للإنشائي', en: 'Municipality Approval (Structural)' },
  STRUCTURAL_DRAWINGS: { ar: 'الرسومات الإنشائية', en: 'Structural Drawings' },
  // MEP - Electrical
  NOC: { ar: 'شهادة عدم المانعة', en: 'NOC' },
  ELECTRICAL: { ar: 'الأعمال الكهربائية', en: 'Electrical Work' },
  AC_CALCULATIONS: { ar: 'حسابات التكييف', en: 'AC Calculations' },
  SOLAR_HEATING: { ar: 'التدفئة الشمسية', en: 'Solar Heating' },
  LOAD_SCHEDULE: { ar: 'جدول الأحمال', en: 'Load Schedule' },
  PANEL_SCHEDULE: { ar: 'جدول الوحات الكهربائية', en: 'Panel Schedule' },
  ELEC_SPECIFICATIONS: { ar: 'المواصفات والبراجيل', en: 'Specifications & Barajeel' },
  LIGHTING: { ar: 'الإنارة', en: 'Lighting' },
  HVAC: { ar: 'التكييف', en: 'HVAC' },
  // MEP - Drainage
  DRAINAGE: { ar: 'الصرف الصحي', en: 'Drainage' },
  SITE_DRAINAGE: { ar: 'صرف الموقع العام', en: 'Site Drainage' },
  RAIN_DRAINAGE: { ar: 'صرف مياه الأمطار', en: 'Rain Water Drainage' },
  TANK_DETAILS: { ar: 'تفاصيل الخزان', en: 'Tank Details' },
  // MEP - Water Supply
  WATER_SUPPLY: { ar: 'إمدادات المياه', en: 'Water Supply' },
  SITE_WATER: { ar: 'مياه الموقع العام', en: 'Site Water Supply' },
  GROUND_FLOOR_WATER: { ar: 'مياه الدور الأرضي', en: 'Ground Floor Water' },
  ROOF_WATER: { ar: 'مياه طابق السطح', en: 'Roof Water Supply' },
  // MEP - Etisalat
  ETISALAT: { ar: 'اتصالات الموقع العام', en: 'Etisalat - Site' },
  ETISALAT_GF: { ar: 'اتصالات الدور الأرضي', en: 'Etisalat - Ground Floor' },
  // MEP - Civil Defense
  CD_FIRE_SYSTEM: { ar: 'نظام الحريق', en: 'Fire Alarm System' },
  CD_EMERGENCY_LIGHTING: { ar: 'الإضاءة الطارئة', en: 'Emergency Lighting' },
  CD_FIRE_FITTING: { ar: 'نظام إطفاء الحريق', en: 'Fire Fighting System' },
  CD_SCHEMATIC: { ar: 'المخطط التخطيطي', en: 'Schematic Diagram' },
  MEP_COORDINATION: { ar: 'تنسيق MEP', en: 'MEP Coordination' },
  MEP_SHOP_DRAWINGS: { ar: 'مخططات تنفيذية MEP', en: 'MEP Shop Drawings' },
  // Government
  COLLECT_DOCUMENTS: { ar: 'جمع المستندات', en: 'Collect Documents' },
  RENEW_KROKY: { ar: 'تجديد الكروكي وفتح الملف', en: 'Renew Kuroky & Open File' },
  CREATE_CASE: { ar: 'إنشاء المعاملة', en: 'Create Case' },
  MUN_SUBMISSION: { ar: 'تقديم البلدية', en: 'Municipality Submission' },
  SUBMIT_REJECTED: { ar: 'إعادة تقديم مرفوض', en: 'Resubmit Rejected' },
  ARCH_STRC_APPROVAL: { ar: 'اعتماد معماري وإنشائي', en: 'Arch & Structural Approval' },
  SUBMIT_ELE_UTILITIES: { ar: 'تقديم كهرباء ومرافق', en: 'Submit Electrical & Utilities' },
  DEMARCATION: { ar: 'التحديد والتسوية', en: 'Demarcation & Leveling' },
  CHOOSE_CONTRACTOR: { ar: 'اختيار المقاول', en: 'Choose Contractor' },
  ISSUE_LICENSE: { ar: 'استخراج الرخصة', en: 'Issue License' },
  SEWA_DEWA: { ar: 'هيئة الكهرباء والماء', en: 'FEWA/DEWA' },
  ETISALAT_APPROVAL: { ar: 'موافقة الاتصالات', en: 'Etisalat Approval' },
  CD_DESIGN_APPROVAL: { ar: 'تصميم الدفاع المدني', en: 'Civil Defense Design' },
  CIVIL_DEFENSE: { ar: 'اعتماد الدفاع المدني', en: 'Civil Defense Approval' },
  // Contracting
  CONTRACT_REVIEW: { ar: 'مراجعة العقد', en: 'Contract Review' },
  CONTRACT_SIGNING: { ar: 'توقيع العقد', en: 'Contract Signing' },
};

const categoryConfig: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
  ARCHITECTURAL: { ar: 'المعماري', en: 'Architecture', icon: <Layers className="h-4 w-4" /> },
  STRUCTURAL: { ar: 'الإنشائي', en: 'Structural', icon: <Building2 className="h-4 w-4" /> },
  MEP: { ar: 'الخدمات', en: 'MEP', icon: <Wrench className="h-4 w-4" /> },
  GOVERNMENT: { ar: 'الموافقات', en: 'Government', icon: <Landmark className="h-4 w-4" /> },
  CONTRACTING: { ar: 'العقود', en: 'Contracting', icon: <FileText className="h-4 w-4" /> },
};

const mepSubGroupLabels: Record<string, { ar: string; en: string }> = {
  NOC: { ar: 'الكهرباء - شهادة عدم المانعة', en: 'Electrical - NOC' },
  ELECTRICAL: { ar: 'الكهرباء - الأعمال الكهربائية', en: 'Electrical - Electrical Work' },
  AC_CALCULATIONS: { ar: 'الكهرباء - حسابات التكييف', en: 'Electrical - AC Calculations' },
  SOLAR_HEATING: { ar: 'الكهرباء - التدفئة الشمسية', en: 'Electrical - Solar Heating' },
  LOAD_SCHEDULE: { ar: 'الكهرباء - جدول الأحمال', en: 'Electrical - Load Schedule' },
  PANEL_SCHEDULE: { ar: 'الكهرباء - جدول الوحات', en: 'Electrical - Panel Schedule' },
  ELEC_SPECIFICATIONS: { ar: 'الكهرباء - المواصفات والبراجيل', en: 'Electrical - Specifications' },
  LIGHTING: { ar: 'الكهرباء - الإنارة', en: 'Electrical - Lighting' },
  DRAINAGE: { ar: 'الصرف الصحي', en: 'Drainage' },
  SITE_DRAINAGE: { ar: 'الصرف - الموقع العام', en: 'Drainage - Site' },
  RAIN_DRAINAGE: { ar: 'الصرف - مياه الأمطار', en: 'Drainage - Rain Water' },
  TANK_DETAILS: { ar: 'الصرف - تفاصيل الخزان', en: 'Drainage - Tank' },
  WATER_SUPPLY: { ar: 'امدادات المياه', en: 'Water Supply' },
  SITE_WATER: { ar: 'المياه - الموقع العام', en: 'Water - Site' },
  GROUND_FLOOR_WATER: { ar: 'المياه - الدور الأرضي', en: 'Water - Ground Floor' },
  ROOF_WATER: { ar: 'المياه - طابق السطح', en: 'Water - Roof' },
  ETISALAT: { ar: 'الاتصالات', en: 'Etisalat' },
  ETISALAT_GF: { ar: 'الاتصالات - الدور الأرضي', en: 'Etisalat - GF' },
  HVAC: { ar: 'التكييف', en: 'HVAC' },
  CD_FIRE_SYSTEM: { ar: 'الدفاع المدني', en: 'Civil Defense' },
  CD_EMERGENCY_LIGHTING: { ar: 'الدفاع المدني - إضاءة طارئة', en: 'CD - Emergency Lighting' },
  CD_FIRE_FITTING: { ar: 'الدفاع المدني - إطفاء', en: 'CD - Fire Fighting' },
  CD_SCHEMATIC: { ar: 'الدفاع المدني - مخطط', en: 'CD - Schematic' },
  MEP_COORDINATION: { ar: 'تنسيق MEP', en: 'MEP Coordination' },
};

const mepGroupOrder = ['NOC', 'ELECTRICAL', 'AC_CALCULATIONS', 'SOLAR_HEATING', 'LOAD_SCHEDULE', 'PANEL_SCHEDULE', 'ELEC_SPECIFICATIONS', 'LIGHTING', 'DRAINAGE', 'SITE_DRAINAGE', 'RAIN_DRAINAGE', 'TANK_DETAILS', 'WATER_SUPPLY', 'SITE_WATER', 'GROUND_FLOOR_WATER', 'ROOF_WATER', 'ETISALAT', 'ETISALAT_GF', 'HVAC', 'CD_FIRE_SYSTEM', 'CD_EMERGENCY_LIGHTING', 'CD_FIRE_FITTING', 'CD_SCHEMATIC', 'MEP_COORDINATION'];

const invoiceStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  DRAFT: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'مسودة', labelEn: 'Draft' },
  SENT: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مرسلة', labelEn: 'Sent' },
  PAID: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مدفوعة', labelEn: 'Paid' },
  PARTIALLY_PAID: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'مدفوعة جزئياً', labelEn: 'Partially Paid' },
  OVERDUE: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'متأخرة', labelEn: 'Overdue' },
  CANCELLED: { color: 'text-slate-500', bg: 'bg-slate-500/15', labelAr: 'ملغاة', labelEn: 'Cancelled' },
};

const defectSeverityConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'طفيف', labelEn: 'Low' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'متوسط', labelEn: 'Medium' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'مرتفع', labelEn: 'High' },
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'حرج', labelEn: 'Critical' },
};

const defectStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  OPEN: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'مفتوح', labelEn: 'Open' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
  RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'تم الحل', labelEn: 'Resolved' },
  CLOSED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'مغلق', labelEn: 'Closed' },
};

const boqCategoryConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  civil: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'مدني', labelEn: 'Civil' },
  structural: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'إنشائي', labelEn: 'Structural' },
  mep: { color: 'text-cyan-400', bg: 'bg-cyan-500/15', labelAr: 'خدمات', labelEn: 'MEP' },
  finishing: { color: 'text-violet-400', bg: 'bg-violet-500/15', labelAr: 'تشطيبات', labelEn: 'Finishing' },
  external: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'أشغال خارجية', labelEn: 'External' },
};

const interactionTypeConfig: Record<string, { color: string; bg: string; border: string; labelAr: string; labelEn: string; icon: React.ReactNode }> = {
  COMMENT: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', labelAr: 'تعليق', labelEn: 'Comment', icon: <MessageCircle className="h-3.5 w-3.5" /> },
  APPROVAL: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', labelAr: 'موافقة', labelEn: 'Approval', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  REJECTION: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', labelAr: 'رفض', labelEn: 'Rejection', icon: <XCircle className="h-3.5 w-3.5" /> },
  REQUEST_CHANGE: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', labelAr: 'طلب تعديل', labelEn: 'Request Change', icon: <RotateCcw className="h-3.5 w-3.5" /> },
  QUESTION: { color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', labelAr: 'سؤال', labelEn: 'Question', icon: <HelpCircle className="h-3.5 w-3.5" /> },
};

const govApprovalConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'معلق', labelEn: 'Pending' },
  SUBMITTED: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مقدم', labelEn: 'Submitted' },
  APPROVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'تمت الموافقة', labelEn: 'Approved' },
  REJECTED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'مرفوض', labelEn: 'Rejected' },
};

const mepStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  NOT_STARTED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'لم يبدأ', labelEn: 'Not Started' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
  COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مكتمل', labelEn: 'Completed' },
};

// ===== Role-based Tab Access =====
const ROLE_TABS: Record<string, string[]> = {
  ADMIN: ['matrix', 'overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'boq', 'timeline', 'interactions'],
  MANAGER: ['matrix', 'overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'boq', 'timeline', 'interactions'],
  PROJECT_MANAGER: ['matrix', 'overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'boq', 'timeline', 'interactions'],
  ENGINEER: ['matrix', 'overview', 'architectural', 'financial', 'boq'],
  DRAFTSMAN: ['matrix', 'overview', 'architectural', 'boq'],
  ACCOUNTANT: ['matrix', 'overview', 'financial', 'boq'],
  HR: ['matrix', 'overview'],
  VIEWER: ['matrix', 'overview', 'timeline', 'boq'],
};

// ===== SLA Helper =====
function calculateSLA(phase: WorkflowPhase, isAr: boolean): { text: string; color: string } {
  if (phase.status !== 'IN_PROGRESS' || !phase.startDate || !phase.slaDays) {
    return { text: '—', color: 'text-slate-500' };
  }
  const start = new Date(phase.startDate).getTime();
  const now = Date.now();
  const diffMs = now - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const remaining = phase.slaDays - diffDays;

  if (remaining < 0) {
    return {
      text: isAr ? `متأخر بـ ${Math.abs(remaining)} أيام` : `Delayed by ${Math.abs(remaining)} days`,
      color: 'text-red-400',
    };
  }
  if (remaining === 0) {
    return { text: isAr ? 'ينتهي اليوم' : 'Ends today', color: 'text-amber-400' };
  }
  if (remaining <= 2) {
    return {
      text: isAr ? `متبقي ${remaining} أيام` : `${remaining} days left`,
      color: 'text-amber-400',
    };
  }
  return {
    text: isAr ? `متبقي ${remaining} أيام` : `${remaining} days left`,
    color: 'text-emerald-400',
  };
}

// ===== Dependency computation on client side =====
function computePhaseDependencies(
  phase: WorkflowPhase,
  allPhases: WorkflowPhase[],
  project: ProjectData | null
): DependencyInfo {
  if (phase.status === 'COMPLETED' || phase.status === 'IN_PROGRESS') {
    return { blocked: false, blockedBy: [], canStart: true, dependencyChain: [] };
  }

  const blockedBy: string[] = [];
  const dependencyChain: string[] = [];

  // Rule 6: Direct dependency (dependsOnId)
  if (phase.dependsOnId && phase.dependsOn && phase.dependsOn.status !== 'COMPLETED') {
    const depLabel = phaseTypeLabels[phase.dependsOn.phaseType] || { en: phase.dependsOn.phaseType };
    blockedBy.push(depLabel.en);
    dependencyChain.push(`Direct: ${depLabel.en} (${phase.dependsOn.status})`);
  }

  // Rule 1: Structural → Architectural Client Approval
  if (phase.phaseCategory === 'STRUCTURAL') {
    const archApproval = allPhases.find(
      (p) => p.phaseType === 'CLIENT_APPROVAL' && p.phaseCategory === 'ARCHITECTURAL'
    );
    if (archApproval && archApproval.status !== 'COMPLETED') {
      blockedBy.push('Architectural Client Approval');
      dependencyChain.push(`Structural Rule: Client Approval is ${archApproval.status}`);
    }
  }

  // Rule 2: Government → Final Drawings
  if (phase.phaseCategory === 'GOVERNMENT') {
    const finalDrawings = allPhases.find(
      (p) => p.phaseType === 'FINAL_DRAWINGS' && p.phaseCategory === 'ARCHITECTURAL'
    );
    if (finalDrawings && finalDrawings.status !== 'COMPLETED') {
      blockedBy.push('Final Drawings');
      dependencyChain.push(`Government Rule: Final Drawings is ${finalDrawings.status}`);
    }
  }

  // Rule 3: MEP → Architectural IN_PROGRESS
  if (phase.phaseCategory === 'MEP') {
    const archPhases = allPhases.filter((p) => p.phaseCategory === 'ARCHITECTURAL');
    const hasProgress = archPhases.some(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED'
    );
    if (!hasProgress && archPhases.length > 0) {
      blockedBy.push('Architectural phases');
      dependencyChain.push('MEP Rule: No Architectural phase is in progress');
    }
  }

  // Rule 4: Construction → At least one Government approval completed
  if (phase.phaseCategory === 'CONSTRUCTION') {
    const govPhases = allPhases.filter((p) => p.phaseCategory === 'GOVERNMENT');
    const hasApproval = govPhases.some((p) => p.status === 'COMPLETED');
    if (govPhases.length > 0 && !hasApproval) {
      blockedBy.push('Government Approvals');
      dependencyChain.push('Construction Rule: No government approval completed');
    }
  }

  // Rule 5: Contracting → Project Manager assigned
  if (phase.phaseCategory === 'CONTRACTING' && project && !project.manager) {
    blockedBy.push('Project Manager Assignment');
    dependencyChain.push('Contracting Rule: No Project Manager assigned');
  }

  return {
    blocked: blockedBy.length > 0,
    blockedBy: [...new Set(blockedBy)],
    canStart: blockedBy.length === 0,
    dependencyChain,
  };
}

// ===== Main Component =====
export default function ProjectWorkspace({ projectId, onBack }: ProjectWorkspaceProps) {
  const { language } = useApp();
  const { user } = useAuth();
  const { t, formatCurrency, formatDate, formatDateTime, isRTL } = useTranslation(language);
  const isAr = language === 'ar';

  // Data states
  const [project, setProject] = useState<ProjectData | null>(null);
  const [phases, setPhases] = useState<WorkflowPhase[]>([]);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [siteReports, setSiteReports] = useState<SiteReportData[]>([]);
  const [defects, setDefects] = useState<DefectData[]>([]);
  const [boqVariance, setBoqVariance] = useState<{
    items: Array<{
      boqItemId: string;
      itemNumber: string | null;
      description: string;
      category: string | null;
      budget: number;
      actual: number;
      variance: number;
      variancePercent: number;
      isOverBudget: boolean;
      flagged: boolean;
    }>;
    totalBudget: number;
    totalActual: number;
    totalVariance: number;
    totalVariancePercent: number;
    flaggedCount: number;
    overBudgetCount: number;
  } | null>(null);
  const [boqItems, setBoqItems] = useState<BOQItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Interaction form state
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [interactionForm, setInteractionForm] = useState({
    phaseId: '',
    interactionType: 'COMMENT',
    content: '',
    responseContent: '',
  });
  const [submittingInteraction, setSubmittingInteraction] = useState(false);

  // Interaction filter & rejection dialog state
  const [interactionFilter, setInteractionFilter] = useState<string>('ALL');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ClientInteraction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch all data
  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const getAuthHeaders = () => {
          const token = localStorage.getItem('blueprint-auth-token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        };

        const endpoints = [
          `/api/projects/${projectId}`,
          `/api/workflow?projectId=${projectId}`,
          `/api/interactions?projectId=${projectId}`,
          `/api/invoices?projectId=${projectId}`,
          `/api/tasks?projectId=${projectId}`,
          `/api/boq?projectId=${projectId}`,
          `/api/site-reports?projectId=${projectId}`,
          `/api/defects?projectId=${projectId}`,
        ];
        const responses = await Promise.allSettled(
          endpoints.map((url) =>
            fetch(url, {
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json',
              } as Record<string, string>,
            })
          )
        );

        // Project
        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
          const data = await responses[0].value.json();
          setProject(data.project || data.projects?.[0] || data.data?.project || null);
        }

        // Workflow
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
          const data = await responses[1].value.json();
          setPhases(data.data?.phases || data.phases || []);
        }

        // Interactions
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
          const data = await responses[2].value.json();
          setInteractions(data.data?.interactions || data.interactions || []);
        }

        // Invoices
        if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
          const data = await responses[3].value.json();
          setInvoices(data.data?.invoices || data.invoices || []);
        }

        // Tasks
        if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
          const data = await responses[4].value.json();
          setTasks(data.data?.tasks || data.tasks || []);
        }

        // BOQ
        if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
          const data = await responses[5].value.json();
          setBoqItems(data.data || data.boqItems || []);
        }

        // Site Reports
        if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
          const data = await responses[6].value.json();
          setSiteReports(data.data || data.reports || []);
        }

        // Defects
        if (responses[7].status === 'fulfilled' && responses[7].value.ok) {
          const data = await responses[7].value.json();
          setDefects(data.data || data.defects || []);
        }

        // BOQ Cost Variance
        try {
          const costRes = await fetch(`/api/projects/${projectId}/cost-summary`, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } as Record<string, string>,
          });
          if (costRes.ok) {
            const costData = await costRes.json();
            setBoqVariance(costData.data || null);
          }
        } catch {
          // Silently fail - variance is optional
        }
      } catch (err) {
        console.error('Failed to fetch workspace data:', err);
        setError(isAr ? 'فشل في تحميل البيانات' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, isAr]);

  // Submit interaction
  const handleSubmitInteraction = async () => {
    if (!interactionForm.content.trim() || !projectId) return;
    setSubmittingInteraction(true);
    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          phaseId: interactionForm.phaseId || null,
          interactionType: interactionForm.interactionType,
          content: interactionForm.content,
          responseContent: interactionForm.responseContent || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newInteraction = data.data?.interaction || data.interaction;
        if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
        setInteractionDialogOpen(false);
        setInteractionForm({
          phaseId: '',
          interactionType: 'COMMENT',
          content: '',
          responseContent: '',
        });
      }
    } catch (err) {
      console.error('Failed to create interaction:', err);
    } finally {
      setSubmittingInteraction(false);
    }
  };

  // Quick action: Approve interaction
  const handleQuickApprove = useCallback(
    async (interaction: ClientInteraction) => {
      setSubmittingAction(true);
      try {
        const token = localStorage.getItem('blueprint-auth-token');
        const res = await fetch('/api/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            projectId,
            phaseId: interaction.phaseId || null,
            interactionType: 'APPROVAL',
            content: isAr
              ? `تمت الموافقة على: ${interaction.content.substring(0, 80)}`
              : `Approved: ${interaction.content.substring(0, 80)}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newInteraction = data.data?.interaction || data.interaction;
          if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
          // Mark original as responded
          setInteractions((prev) =>
            prev.map((i) =>
              i.id === interaction.id
                ? {
                    ...i,
                    responseContent: isAr ? 'تمت الموافقة' : 'Approved',
                    responseDate: new Date().toISOString(),
                  }
                : i
            )
          );
        }
      } catch (err) {
        console.error('Failed to approve:', err);
      } finally {
        setSubmittingAction(false);
      }
    },
    [projectId, isAr]
  );

  // Quick action: Reject interaction (opens dialog)
  const handleQuickReject = useCallback((interaction: ClientInteraction) => {
    setRejectTarget(interaction);
    setRejectReason('');
    setRejectDialogOpen(true);
  }, []);

  // Submit rejection
  const handleSubmitRejection = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          phaseId: rejectTarget.phaseId || null,
          interactionType: 'REJECTION',
          content: rejectReason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newInteraction = data.data?.interaction || data.interaction;
        if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
        setInteractions((prev) =>
          prev.map((i) =>
            i.id === rejectTarget.id
              ? { ...i, responseContent: rejectReason, responseDate: new Date().toISOString() }
              : i
          )
        );
        setRejectDialogOpen(false);
        setRejectTarget(null);
        setRejectReason('');
      }
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Quick action: Request Change
  const handleRequestChange = useCallback(
    async (interaction: ClientInteraction) => {
      setSubmittingAction(true);
      try {
        const token = localStorage.getItem('blueprint-auth-token');
        const res = await fetch('/api/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            projectId,
            phaseId: interaction.phaseId || null,
            interactionType: 'REQUEST_CHANGE',
            content: isAr
              ? `طلب تعديل على: ${interaction.content.substring(0, 80)}`
              : `Change requested on: ${interaction.content.substring(0, 80)}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const newInteraction = data.data?.interaction || data.interaction;
          if (newInteraction) setInteractions((prev) => [newInteraction, ...prev]);
        }
      } catch (err) {
        console.error('Failed to request change:', err);
      } finally {
        setSubmittingAction(false);
      }
    },
    [projectId, isAr]
  );

  // Computed values
  const phasesByCategory = useMemo(() => {
    const grouped: Record<string, WorkflowPhase[]> = {};
    for (const p of phases) {
      const cat = p.phaseCategory || 'OTHER';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }
    return grouped;
  }, [phases]);

  // Phase dependency map
  const phaseDependencyMap = useMemo(() => {
    const map: Record<string, DependencyInfo> = {};
    for (const p of phases) {
      map[p.id] = computePhaseDependencies(p, phases, project);
    }
    return map;
  }, [phases, project]);

  const totalPaid = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
    [invoices]
  );
  const totalInvoiced = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    [invoices]
  );
  const totalBOQ = useMemo(
    () => boqItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    [boqItems]
  );
  const completedPhases = useMemo(
    () => phases.filter((p) => p.status === 'COMPLETED').length,
    [phases]
  );
  const totalPhases = phases.length;

  // BOQ by category
  const boqByCategory = useMemo(() => {
    const map: Record<string, BOQItemData[]> = {};
    for (const item of boqItems) {
      const cat = item.category || 'uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    }
    return map;
  }, [boqItems]);

  const taskStats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'DONE' || t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    return { total: tasks.length, done, inProgress };
  }, [tasks]);

  // Filtered interactions
  const filteredInteractions = useMemo(() => {
    if (interactionFilter === 'ALL') return interactions;
    return interactions.filter((i) => i.interactionType === interactionFilter);
  }, [interactions, interactionFilter]);

  // Phase status change
  const handlePhaseStatusChange = async (phaseId: string, newStatus: string) => {
    // Check if phase is blocked before allowing IN_PROGRESS
    const depInfo = phaseDependencyMap[phaseId];
    if (depInfo && depInfo.blocked && newStatus === 'IN_PROGRESS') return;

    try {
      const token = localStorage.getItem('blueprint-auth-token');
      const res = await fetch('/api/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: phaseId, status: newStatus }),
      });
      if (res.ok) {
        setPhases((prev) =>
          prev.map((p) => (p.id === phaseId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Failed to update phase:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-slate-400 text-sm">
            {isAr ? 'جاري تحميل المشروع...' : 'Loading project...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <XCircle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400">
          {error || (isAr ? 'لم يتم العثور على المشروع' : 'Project not found')}
        </p>
        <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300">
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''} me-2`} />
          {t.back}
        </Button>
      </div>
    );
  }

  const sc = statusConfig[project.status] || statusConfig.PLANNING;
  const tc = typeConfig[project.type] || { labelAr: project.type, labelEn: project.type };
  const govStatus = govApprovalConfig[project.governmentApprovalStatus || 'PENDING'];

  // ===== SUB COMPONENTS =====

  // Permission check for managing phases
  const canManagePhases = ['ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER'].includes(user?.role || '');

  // Phase Table Component with Dependency Blocking
  const PhaseTable = ({ categoryPhases }: { categoryPhases: WorkflowPhase[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-start p-3 text-slate-400 font-medium">
              {isAr ? 'المرحلة' : 'Phase'}
            </th>
            <th className="text-start p-3 text-slate-400 font-medium">{t.status}</th>
            <th className="text-start p-3 text-slate-400 font-medium">
              {isAr ? 'المسؤول' : 'Assigned'}
            </th>
            <th className="text-start p-3 text-slate-400 font-medium">
              {isAr ? 'تاريخ البداية' : 'Start'}
            </th>
            <th className="text-start p-3 text-slate-400 font-medium">
              {isAr ? 'المتبقي' : 'SLA'}
            </th>
            <th className="text-start p-3 text-slate-400 font-medium">
              {isAr ? 'الرفض' : 'Rejections'}
            </th>
            <th className="text-center p-3 text-slate-400 font-medium">{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {categoryPhases.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-500">
                {t.noData}
              </td>
            </tr>
          ) : (
            categoryPhases.map((phase) => {
              const ps =
                phaseStatusConfig[phase.status] || phaseStatusConfig.NOT_STARTED;
              const sla = calculateSLA(phase, isAr);
              const ptl =
                phaseTypeLabels[phase.phaseType] || {
                  ar: phase.phaseType,
                  en: phase.phaseType,
                };
              const depInfo = phaseDependencyMap[phase.id];
              const isBlocked = depInfo?.blocked && phase.status === 'NOT_STARTED';
              const assignedName = phase.assignedTo?.name || phase.assignedTo?.fullName;

              return (
                <tr
                  key={phase.id}
                  className={`border-b border-slate-700/30 hover:bg-slate-800/40 transition-colors ${
                    isBlocked ? 'border-s-2 border-s-orange-500/60 bg-orange-500/5' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {isBlocked ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Lock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-800 border-slate-700 text-slate-200 max-w-xs"
                          >
                            <p className="font-medium mb-1">
                              {isAr ? '🔒 مرحلة محظورة' : '🔒 Phase Blocked'}
                            </p>
                            <ul className="text-xs space-y-1">
                              {depInfo?.dependencyChain.map((chain, idx) => (
                                <li key={idx} className="text-orange-300">
                                  • {chain}
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div
                          className={`h-2 w-2 rounded-full shrink-0 ${ps.dot}`}
                        />
                      )}
                      <span className="text-white font-medium">
                        {isAr ? ptl.ar : ptl.en}
                      </span>
                      {isBlocked && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-500/10 text-orange-400 text-[10px]"
                        >
                          {isAr ? 'محظور' : 'Blocked'}
                        </Badge>
                      )}
                    </div>
                    {/* Dependency chain display */}
                    {isBlocked && depInfo && depInfo.blockedBy.length > 0 && (
                      <div className="mt-1.5 ms-5.5">
                        <p className="text-[10px] text-orange-400/80">
                          {isAr
                            ? `يعتمد على: ${depInfo.blockedBy.join(', ')}`
                            : `Depends on: ${depInfo.blockedBy.join(', ')}`}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="secondary"
                      className={`${ps.bg} ${ps.color} text-xs`}
                    >
                      {isAr ? ps.labelAr : ps.labelEn}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {assignedName ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-blue-600/30 text-blue-300 text-[10px]">
                              {assignedName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-300 text-xs">{assignedName}</span>
                        </div>
                        {/* Draft Assignment */}
                        {phase.draftAssignedTo && (
                          <div className="flex items-center gap-1 text-xs text-purple-400 mt-0.5">
                            <PenTool className="h-3 w-3" />
                            <span>{phase.draftAssignedTo.name || phase.draftAssignedTo.fullName}</span>
                            {phase.draftStartDate && (
                              <span className="text-slate-500">
                                ({formatDate(phase.draftStartDate)} - {phase.draftEndDate ? formatDate(phase.draftEndDate) : '...'})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 text-xs">
                    {phase.startDate ? formatDate(phase.startDate) : '—'}
                  </td>
                  <td className="p-3">
                    {phase.status === 'IN_PROGRESS' ? (
                      <span className={`text-xs font-medium ${sla.color}`}>
                        {sla.text}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {phase.rejectionCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-red-500/10 text-red-400 text-xs"
                      >
                        {phase.rejectionCount}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 text-xs">0</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {/* Quick Action Buttons */}
                    {canManagePhases && !isBlocked && phase.status !== 'COMPLETED' && (
                      <div className="flex gap-1 mb-1 justify-center">
                        {phase.status === 'NOT_STARTED' && (
                          <button
                            onClick={() => handlePhaseStatusChange(phase.id, 'IN_PROGRESS')}
                            className="p-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 transition-colors"
                            title={isAr ? 'ابدأ المرحلة' : 'Start Phase'}
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {phase.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handlePhaseStatusChange(phase.id, 'COMPLETED')}
                            className="p-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 transition-colors"
                            title={isAr ? 'إنهاء المرحلة' : 'Complete Phase'}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    {phase.status !== 'COMPLETED' && (
                      isBlocked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select
                                value={phase.status}
                                onValueChange={(val) =>
                                  handlePhaseStatusChange(phase.id, val)
                                }
                                disabled
                              >
                                <SelectTrigger className="h-7 w-auto border-slate-700 bg-slate-800 text-xs text-slate-500 px-2 opacity-50 cursor-not-allowed">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="NOT_STARTED" className="text-slate-300">
                                    {isAr ? 'لم يبدأ' : 'Not Started'}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {phaseDependencyMap[phase.id]?.blocked && (
                                <span className="text-xs text-amber-400/70 block mt-1">
                                  {phaseDependencyMap[phase.id]?.blockedBy.join(', ')}
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-800 border-slate-700 text-slate-200 max-w-xs"
                          >
                            {depInfo?.dependencyChain.map((chain, idx) => (
                              <p key={idx} className="text-xs text-orange-300">
                                🔒 {chain}
                              </p>
                            ))}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Select
                          value={phase.status}
                          onValueChange={(val) =>
                            handlePhaseStatusChange(phase.id, val)
                          }
                        >
                          <SelectTrigger className="h-7 w-auto border-slate-700 bg-slate-800 text-xs text-slate-300 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="NOT_STARTED" className="text-slate-300">
                              {isAr ? 'لم يبدأ' : 'Not Started'}
                            </SelectItem>
                            <SelectItem value="IN_PROGRESS" className="text-slate-300">
                              {isAr ? 'قيد التنفيذ' : 'In Progress'}
                            </SelectItem>
                            <SelectItem value="COMPLETED" className="text-slate-300">
                              {isAr ? 'مكتمل' : 'Completed'}
                            </SelectItem>
                            <SelectItem value="ON_HOLD" className="text-slate-300">
                              {isAr ? 'معلق' : 'On Hold'}
                            </SelectItem>
                            <SelectItem value="DELAYED" className="text-slate-300">
                              {isAr ? 'متأخر' : 'Delayed'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  // Category Progress Card
  const CategoryProgressCard = ({
    category,
    icon,
  }: {
    category: string;
    icon?: React.ReactNode;
  }) => {
    const catPhases = phasesByCategory[category] || [];
    if (catPhases.length === 0) return null;
    const catConfig = categoryConfig[category];
    const completed = catPhases.filter((p) => p.status === 'COMPLETED').length;
    const pct = Math.round((completed / catPhases.length) * 100);
    const blockedCount = catPhases.filter(
      (p) => phaseDependencyMap[p.id]?.blocked && p.status === 'NOT_STARTED'
    ).length;

    return (
      <div className="bg-slate-800/40 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon || catConfig?.icon}
          <span className="text-sm font-medium text-white">
            {catConfig ? (isAr ? catConfig.ar : catConfig.en) : category}
          </span>
          <Badge
            variant="secondary"
            className="bg-slate-700 text-slate-400 text-[10px] ms-auto"
          >
            {completed}/{catPhases.length}
          </Badge>
          {blockedCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-orange-500/10 text-orange-400 text-[10px]"
            >
              🔒 {blockedCount}
            </Badge>
          )}
        </div>
        <Progress value={pct} className="h-1.5 bg-slate-700" />
        <p className="text-xs text-slate-500 mt-1.5">{pct}%</p>
      </div>
    );
  };

  return (
    <div
      className="flex h-full bg-slate-950 text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== Left Sidebar ===== */}
      <aside
        className={`fixed lg:static inset-y-0 z-50 w-[260px] bg-slate-900 border-slate-800 border-e flex flex-col transition-transform duration-300 ${
          sidebarOpen
            ? 'translate-x-0'
            : isRTL
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-slate-400 hover:text-white h-8 w-8 p-0"
            >
              <ArrowLeft
                className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`}
              />
            </Button>
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'مساحة العمل' : 'Workspace'}
            </span>
          </div>
          <h2 className="font-bold text-lg text-white leading-tight">
            {project.name}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            {project.code}
          </p>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={`${sc.bg} ${sc.color} text-xs font-medium`}
          >
            {isAr ? sc.labelAr : sc.labelEn}
          </Badge>

          {/* Info rows */}
          <div className="space-y-3 text-sm">
            {project.location && (
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="text-xs">{project.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{project.plotNumber || '—'}</span>
            </div>
            {project.customerFileNumber && (
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs">{isAr ? 'رقم ملف العميل:' : 'Customer File No:'}</span>
                <span className="text-xs text-slate-200">{project.customerFileNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{project.projectType || '—'}</span>
            </div>
            {project.client && (
              <div className="flex items-center gap-2 text-slate-400">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">{project.client.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{formatDate(project.startDate)}</span>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Task 1C: Government Approval Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-slate-400 font-medium">
                {isAr ? 'الموافقة الحكومية' : 'Gov. Approval'}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={`${govStatus.bg} ${govStatus.color} text-xs w-full justify-center py-1.5`}
            >
              {isAr ? govStatus.labelAr : govStatus.labelEn}
            </Badge>
            {project.licenseNumber && (
              <div className="flex items-center gap-2 text-slate-400">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="text-[10px] font-mono">
                  {project.licenseNumber}
                </span>
              </div>
            )}

            {/* MEP Status Indicators */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {isAr ? 'حالة الخدمات' : 'MEP Status'}
              </p>
              {[
                {
                  key: 'electricalStatus' as const,
                  label: isAr ? 'كهرباء' : 'Electrical',
                  icon: <Zap className="h-3 w-3" />,
                },
                {
                  key: 'plumbingStatus' as const,
                  label: isAr ? 'سباكة' : 'Plumbing',
                  icon: <Droplets className="h-3 w-3" />,
                },
                {
                  key: 'hvacStatus' as const,
                  label: 'HVAC',
                  icon: <Thermometer className="h-3 w-3" />,
                },
              ].map((mep) => {
                const statusVal = project[mep.key] || 'NOT_STARTED';
                const cfg = mepStatusConfig[statusVal] || mepStatusConfig.NOT_STARTED;
                return (
                  <div
                    key={mep.key}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {mep.icon}
                      <span className="text-[11px]">{mep.label}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${cfg.bg} ${cfg.color} text-[10px]`}
                    >
                      {isAr ? cfg.labelAr : cfg.labelEn}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400">{t.progress}</span>
              <span className="text-white font-semibold">
                {Math.round(project.progress)}%
              </span>
            </div>
            <Progress value={project.progress} className="h-2 bg-slate-700" />
          </div>

          <Separator className="bg-slate-800" />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <DollarSign className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                {isAr ? 'الميزانية' : 'Budget'}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatCurrency(project.budget)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <TrendingUp className="h-4 w-4 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                {isAr ? 'المصروف' : 'Spent'}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatCurrency(project.spent)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">{t.tasks}</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {taskStats.total}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Layers className="h-4 w-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs text-slate-500">
                {isAr ? 'المراحل' : 'Phases'}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {completedPhases}/{totalPhases}
              </p>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Ask Blue Button */}
          <Button
            variant="outline"
            className="w-full gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={() => {
              const event = new CustomEvent('navigate', {
                detail: { page: 'ai-chat' },
              });
              window.dispatchEvent(event);
            }}
          >
            <BrainCircuit className="h-4 w-4" />
            {isAr ? 'اسأل بلو' : 'Ask Blue'}
          </Button>
        </ScrollArea>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 h-8 w-8 p-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-semibold text-white truncate">
            {project.name}
          </h2>
          <Badge
            variant="secondary"
            className={`${sc.bg} ${sc.color} text-[10px] ms-auto`}
          >
            {isAr ? sc.labelAr : sc.labelEn}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full"
          >
            {/* Tab List */}
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 lg:px-6 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                {(() => {
                  const userRole = user?.role || 'VIEWER';
                  const userDept = ((user as any)?.department || '').toUpperCase();
                  // Engineer tabs based on department (domino: Matrix shows ALL, tab shows own dept only)
                  let allowedTabs = ROLE_TABS[userRole] || ROLE_TABS.VIEWER;
                  if (userRole === 'ENGINEER' && userDept) {
                    const base = ['matrix', 'overview', 'boq'];
                    if (userDept.includes('ARCH') || userDept.includes('معمار')) allowedTabs = [...base, 'architectural'];
                    else if (userDept.includes('STRUCT') || userDept.includes('إنشائ') || userDept.includes('هيكلي')) allowedTabs = [...base, 'structural'];
                    else if (userDept.includes('ELEC') || userDept.includes('كهربائ')) allowedTabs = [...base, 'mep'];
                    else if (userDept.includes('MEP')) allowedTabs = [...base, 'mep'];
                    else if (userDept.includes('MECH') || userDept.includes('HVAC') || userDept.includes('ميكانيك') || userDept.includes('تكييف')) allowedTabs = [...base, 'mep'];
                    else if (userDept.includes('PLUMB') || userDept.includes('سباك') || userDept.includes('صرف')) allowedTabs = [...base, 'mep'];
                    else if (userDept.includes('CIVIL') || userDept.includes('مدني')) allowedTabs = [...base, 'structural'];
                  }
                  const allTabs = [
                    {
                      key: 'matrix',
                      label: isAr ? 'المصفوفة' : 'Matrix',
                      icon: <LayoutGrid className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'overview',
                      label: isAr ? 'نظرة عامة' : 'Overview',
                      icon: <Eye className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'architectural',
                      label: isAr ? 'المعماري' : 'Architecture',
                      icon: <Layers className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'structural',
                      label: isAr ? 'الإنشائي' : 'Structural',
                      icon: <Building2 className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'mep',
                      label: isAr ? 'الخدمات' : 'MEP',
                      icon: <Wrench className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'government',
                      label: isAr ? 'الموافقات' : 'Government',
                      icon: <Landmark className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'financial',
                      label: isAr ? 'المالية' : 'Financial',
                      icon: <CreditCard className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'site',
                      label: isAr ? 'الموقع' : 'Site',
                      icon: <HardHat className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'boq',
                      label: isAr ? 'جدول الكميات' : 'BOQ',
                      icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'timeline',
                      label: isAr ? 'الجدول' : 'Timeline',
                      icon: <Timer className="h-3.5 w-3.5" />,
                    },
                    {
                      key: 'interactions',
                      label: isAr ? 'التفاعلات' : 'Interactions',
                      icon: <MessageSquare className="h-3.5 w-3.5" />,
                    },
                  ];
                  return allTabs.filter((tab) =>
                    allowedTabs.includes(tab.key)
                  );
                })().map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="data-[state=active]:bg-transparent data-[state=active]:text-blue-400 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 text-slate-400 hover:text-white rounded-none px-3 py-3 gap-1.5 text-xs font-medium whitespace-nowrap"
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ===== MATRIX VIEW TAB ===== */}
            <TabsContent value="matrix" className="p-4 lg:p-6 mt-0">
              <div className="space-y-4">
                {/* Matrix Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">
                      {isAr ? 'نظرة شاملة على كل الأقسام' : 'All Departments Overview'}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    {isAr ? 'مثل شيت الإكسل - كل الأقسام في صف واحد' : 'Like Excel - all departments in one view'}
                  </span>
                </div>

                {/* Department Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(categoryConfig).map(([catKey, catInfo]) => {
                    const catPhases = phasesByCategory[catKey] || [];
                    if (catPhases.length === 0) return null;
                    const completed = catPhases.filter(p => p.status === 'COMPLETED').length;
                    const inProgress = catPhases.filter(p => p.status === 'IN_PROGRESS').length;
                    const rejected = catPhases.reduce((sum, p) => sum + (p.rejectionCount || 0), 0);
                    const total = catPhases.length;
                    const pct = Math.round((completed / total) * 100);

                    return (
                      <Card key={catKey} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {catInfo.icon}
                              <CardTitle className="text-sm font-semibold text-white">{catInfo.ar}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {rejected > 0 && (
                                <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-xs">
                                  {rejected} {isAr ? 'رفض' : 'rej'}
                                </Badge>
                              )}
                              <span className="text-slate-400">{completed}/{total}</span>
                            </div>
                          </div>
                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-700'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-slate-500">
                                {pct}% {isAr ? 'مكتمل' : 'done'}
                              </span>
                              {inProgress > 0 && (
                                <span className="text-xs text-blue-400">
                                  {inProgress} {isAr ? 'قيد التنفيذ' : 'active'}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {catPhases.map(phase => {
                              const label = phaseTypeLabels[phase.phaseType] || { ar: phase.phaseType, en: phase.phaseType };
                              const isBlocked = phaseDependencyMap[phase.id]?.blocked;
                              return (
                                <div key={phase.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/50 group">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {phase.status === 'COMPLETED' ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    ) : phase.status === 'IN_PROGRESS' ? (
                                      <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                    ) : phase.status === 'REJECTED' ? (
                                      <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                    ) : (
                                      <Circle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                    )}
                                    <span className={`text-xs truncate ${phase.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                      {isAr ? label.ar : label.en}
                                    </span>
                                    {isBlocked && (
                                      <Lock className="h-3 w-3 text-slate-600 shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {phase.rejectionCount > 0 && (
                                      <span className="text-xs text-red-400">{phase.rejectionCount}</span>
                                    )}
                                    {/* Quick Action Buttons */}
                                    {canManagePhases && phase.status !== 'COMPLETED' && !isBlocked && (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {phase.status === 'NOT_STARTED' && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handlePhaseStatusChange(phase.id, 'IN_PROGRESS'); }}
                                            className="p-0.5 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-400"
                                            title={isAr ? 'ابدأ' : 'Start'}
                                          >
                                            <Play className="h-3 w-3" />
                                          </button>
                                        )}
                                        {phase.status === 'IN_PROGRESS' && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handlePhaseStatusChange(phase.id, 'COMPLETED'); }}
                                            className="p-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400"
                                            title={isAr ? 'إنهاء' : 'Complete'}
                                          >
                                            <Check className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {isBlocked && (
                                      <span className="text-xs text-slate-600" title={phaseDependencyMap[phase.id]?.blockedBy.join(', ')}>
                                        {isAr ? 'مقفل' : 'Locked'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ===== OVERVIEW TAB ===== */}
            <TabsContent
              value="overview"
              className="p-4 lg:p-6 space-y-6 mt-0"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Details Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr ? 'تفاصيل المشروع' : 'Project Details'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">{t.type}</p>
                        <p className="text-white">
                          {isAr ? tc.labelAr : tc.labelEn}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">
                          {t.projectStatus}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`${sc.bg} ${sc.color} text-xs`}
                        >
                          {isAr ? sc.labelAr : sc.labelEn}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">
                          {t.startDate}
                        </p>
                        <p className="text-white">
                          {formatDate(project.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">
                          {t.endDate}
                        </p>
                        <p className="text-white">
                          {project.endDate
                            ? formatDate(project.endDate)
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">
                          {isAr ? 'المدير' : 'Manager'}
                        </p>
                        <p className="text-white">
                          {project.manager?.name || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">
                          {t.client}
                        </p>
                        <p className="text-white">
                          {project.client?.name || '—'}
                        </p>
                      </div>
                      {project.location && (
                        <div className="col-span-2">
                          <p className="text-slate-500 text-xs mb-1">
                            {t.projectLocation}
                          </p>
                          <p className="text-white">{project.location}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Engineering Status Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr
                        ? 'حالة المراحل الهندسية'
                        : 'Engineering Phase Status'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      'ARCHITECTURAL',
                      'STRUCTURAL',
                      'MEP',
                      'GOVERNMENT',
                    ].map((cat) => (
                      <CategoryProgressCard key={cat} category={cat} />
                    ))}
                    {totalPhases === 0 && (
                      <p className="text-slate-500 text-sm text-center py-4">
                        {t.noData}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Summary Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr ? 'الملخص المالي' : 'Financial Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">
                          {isAr ? 'قيمة العقد' : 'Contract Value'}
                        </p>
                        <p className="text-lg font-bold text-white mt-1">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">
                          {isAr ? 'المدفوع' : 'Paid'}
                        </p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">
                          {formatCurrency(totalPaid)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">
                          {isAr ? 'الفواتير' : 'Invoiced'}
                        </p>
                        <p className="text-lg font-bold text-blue-400 mt-1">
                          {formatCurrency(totalInvoiced)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-slate-500 text-xs">
                          {isAr ? 'المتبقي' : 'Remaining'}
                        </p>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                          {formatCurrency(
                            Math.max(0, project.budget - totalPaid)
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Summary Card */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white">
                      {isAr ? 'ملخص المهام' : 'Task Summary'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-white">
                          {taskStats.total}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAr ? 'الكل' : 'Total'}
                        </p>
                      </div>
                      <div className="text-center bg-blue-500/10 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-400">
                          {taskStats.inProgress}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAr ? 'قيد التنفيذ' : 'In Progress'}
                        </p>
                      </div>
                      <div className="text-center bg-emerald-500/10 rounded-lg p-3">
                        <p className="text-2xl font-bold text-emerald-400">
                          {taskStats.done}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {t.completed}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== ARCHITECTURAL TAB ===== */}
            <TabsContent
              value="architectural"
              className="p-4 lg:p-6 mt-0"
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-violet-400" />
                    <CardTitle className="text-base text-white">
                      {isAr ? 'المراحل المعمارية' : 'Architectural Phases'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhaseTable
                    categoryPhases={
                      phasesByCategory['ARCHITECTURAL'] || []
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== STRUCTURAL TAB ===== */}
            <TabsContent value="structural" className="p-4 lg:p-6 mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-400" />
                    <CardTitle className="text-base text-white">
                      {isAr ? 'المراحل الإنشائية' : 'Structural Phases'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhaseTable
                    categoryPhases={phasesByCategory['STRUCTURAL'] || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== MEP TAB ===== */}
            <TabsContent value="mep" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Electrical Sub-Group */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-red-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'الكهرباء' : 'Electrical'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['NOC', 'ELECTRICAL', 'AC_CALCULATIONS', 'SOLAR_HEATING', 'LOAD_SCHEDULE', 'PANEL_SCHEDULE', 'ELEC_SPECIFICATIONS', 'LIGHTING'].includes(p.phaseType)
                  ) || []} />
                </div>

                {/* Drainage Sub-Group */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="h-5 w-5 text-blue-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'الصرف الصحي' : 'Drainage'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['DRAINAGE', 'SITE_DRAINAGE', 'RAIN_DRAINAGE', 'TANK_DETAILS'].includes(p.phaseType)
                  ) || []} />
                </div>

                {/* Water Supply Sub-Group */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Waves className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'امدادات المياه' : 'Water Supply'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['WATER_SUPPLY', 'SITE_WATER', 'GROUND_FLOOR_WATER', 'ROOF_WATER'].includes(p.phaseType)
                  ) || []} />
                </div>

                {/* Etisalat Sub-Group */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wifi className="h-5 w-5 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'الاتصالات' : 'Etisalat'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['ETISALAT', 'ETISALAT_GF'].includes(p.phaseType)
                  ) || []} />
                </div>

                {/* HVAC Sub-Group */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Fan className="h-5 w-5 text-violet-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'التكييف' : 'HVAC'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['HVAC'].includes(p.phaseType)
                  ) || []} />
                </div>

                {/* Civil Defense Sub-Group */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="h-5 w-5 text-red-500" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'الدفاع المدني' : 'Civil Defense'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['CD_FIRE_SYSTEM', 'CD_EMERGENCY_LIGHTING', 'CD_FIRE_FITTING', 'CD_SCHEMATIC'].includes(p.phaseType)
                  ) || []} />
                </div>

                {/* MEP Coordination */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-5 w-5 text-teal-400" />
                    <h3 className="text-sm font-semibold text-slate-200">
                      {isAr ? 'تنسيق MEP' : 'MEP Coordination'}
                    </h3>
                  </div>
                  <PhaseTable categoryPhases={phasesByCategory['MEP']?.filter(p =>
                    ['MEP_COORDINATION'].includes(p.phaseType)
                  ) || []} />
                </div>
              </div>
            </TabsContent>

            {/* ===== GOVERNMENT TAB ===== */}
            <TabsContent value="government" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-amber-400" />
                      <CardTitle className="text-base text-white">
                        {isAr
                          ? 'مراحل الموافقات الحكومية'
                          : 'Government Approval Phases'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PhaseTable
                      categoryPhases={phasesByCategory['GOVERNMENT'] || []}
                    />
                  </CardContent>
                </Card>

                {/* MUN Notes History */}
                {(phasesByCategory['GOVERNMENT'] || []).some(
                  (p) => p.notes
                ) && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-white">
                        {isAr
                          ? 'ملاحظات البلدية (MUN NOT)'
                          : 'MUN Notes History'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(phasesByCategory['GOVERNMENT'] || [])
                        .filter((p) => p.notes)
                        .map((p) => {
                          const ptl =
                            phaseTypeLabels[p.phaseType] || {
                              ar: p.phaseType,
                              en: p.phaseType,
                            };
                          return (
                            <div
                              key={p.id}
                              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/10 text-amber-400 text-[10px]"
                                >
                                  {isAr ? ptl.ar : ptl.en}
                                </Badge>
                                <Badge
                                  variant="secondary"
                                  className="bg-red-500/10 text-red-400 text-[10px]"
                                >
                                  {p.rejectionCount}x{' '}
                                  {isAr ? 'رفض' : 'rejections'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {p.notes}
                              </p>
                            </div>
                          );
                        })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ===== FINANCIAL TAB ===== */}
            <TabsContent value="financial" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Contract Value Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">
                        {isAr ? 'قيمة العقد' : 'Contract Value'}
                      </p>
                      <p className="text-xl font-bold text-white mt-1">
                        {formatCurrency(project.budget)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-emerald-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">
                        {isAr ? 'إجمالي المدفوع' : 'Total Paid'}
                      </p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">
                        {formatCurrency(totalPaid)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-red-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">
                        {isAr ? 'المبلغ المتبقي' : 'Outstanding'}
                      </p>
                      <p className="text-xl font-bold text-red-400 mt-1">
                        {formatCurrency(
                          Math.max(0, project.budget - totalPaid)
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-blue-500/20">
                    <CardContent className="p-4">
                      <p className="text-xs text-slate-500">
                        {isAr ? 'نسبة التحصيل' : 'Collection Rate'}
                      </p>
                      <p className="text-xl font-bold text-blue-400 mt-1">
                        {project.budget > 0
                          ? Math.round((totalPaid / project.budget) * 100)
                          : 0}
                        %
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Overview for Engineer */}
                <Card className="bg-gradient-to-br from-blue-500/10 to-slate-900/50 border-blue-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-base text-white">
                        {isAr
                          ? 'نظرة مالية للمهندس'
                          : 'Financial Overview for Engineer'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500">
                          {isAr ? 'قيمة العقد' : 'Contract Value'}
                        </p>
                        <p className="text-lg font-bold text-white mt-1">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-500/20">
                        <p className="text-xs text-slate-500">
                          {isAr
                            ? 'المدفوعات المستلمة'
                            : 'Payments Received'}
                        </p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">
                          {formatCurrency(
                            project.paymentReceived ?? totalPaid
                          )}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/20">
                        <p className="text-xs text-slate-500">
                          {isAr ? 'الرصيد المتبقي' : 'Remaining Balance'}
                        </p>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                          {formatCurrency(
                            project.remainingBalance ??
                              Math.max(
                                0,
                                project.budget -
                                  (project.paymentReceived ?? totalPaid)
                              )
                          )}
                        </p>
                      </div>
                      {boqItems.length > 0 && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-violet-500/20">
                          <p className="text-xs text-slate-500">
                            {isAr ? 'بنود قائمة الكميات' : 'BOQ Items'}
                          </p>
                          <p className="text-lg font-bold text-violet-400 mt-1">
                            {boqItems.length}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {isAr ? 'إجمالي: ' : 'Total: '}
                            {formatCurrency(totalBOQ)}
                          </p>
                        </div>
                      )}
                    </div>
                    {boqItems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-slate-400 font-medium mb-2">
                          {isAr
                            ? 'ملخص بنود قائمة الكميات (BOQ)'
                            : 'BOQ Items Summary'}
                        </p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {boqItems.slice(0, 10).map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-slate-800/40 rounded px-3 py-1.5 text-xs"
                            >
                              <span className="text-slate-300 truncate me-3">
                                {item.code || item.itemNumber || '—'} -{' '}
                                {item.description}
                              </span>
                              <span className="text-slate-400 shrink-0">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                          {boqItems.length > 10 && (
                            <p className="text-xs text-slate-500 text-center pt-1">
                              {isAr
                                ? `+ ${boqItems.length - 10} بنود أخرى`
                                : `+ ${boqItems.length - 10} more items`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payments Table */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-emerald-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'الفواتير والمدفوعات' : 'Invoices & Payments'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {invoices.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {t.invoiceNumber}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {t.date}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {isAr ? 'الإجمالي' : 'Total'}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {t.paid}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {t.status}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((inv) => {
                              const isc =
                                invoiceStatusConfig[inv.status] ||
                                invoiceStatusConfig.DRAFT;
                              return (
                                <tr
                                  key={inv.id}
                                  className="border-b border-slate-700/30 hover:bg-slate-800/40"
                                >
                                  <td className="p-3 text-white font-mono text-xs">
                                    {inv.number}
                                  </td>
                                  <td className="p-3 text-slate-400 text-xs">
                                    {formatDate(inv.issueDate)}
                                  </td>
                                  <td className="p-3 text-white font-medium">
                                    {formatCurrency(inv.total)}
                                  </td>
                                  <td className="p-3 text-emerald-400">
                                    {formatCurrency(inv.paidAmount)}
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant="secondary"
                                      className={`${isc.bg} ${isc.color} text-xs`}
                                    >
                                      {isAr ? isc.labelAr : isc.labelEn}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== SITE TAB ===== */}
            <TabsContent value="site" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Site Reports */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'يوميات الموقع' : 'Site Daily Logs'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {siteReports.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {siteReports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">
                                {formatDate(report.date)}
                              </span>
                              {report.weatherConditions && (
                                <Badge
                                  variant="secondary"
                                  className="bg-sky-500/10 text-sky-400 text-[10px]"
                                >
                                  {report.weatherConditions}
                                </Badge>
                              )}
                            </div>
                            {report.workCompleted && (
                              <p className="text-xs text-slate-400 mb-1">
                                <span className="text-slate-500">
                                  {isAr ? 'المنجز: ' : 'Completed: '}
                                </span>
                                {report.workCompleted}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-slate-500">
                                <Users className="h-3 w-3 inline me-1" />
                                {report.workforceCount}{' '}
                                {isAr ? 'عامل' : 'workers'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Defects */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'العيوب' : 'Defects'}
                      </CardTitle>
                      {defects.filter((d) => d.status === 'OPEN').length >
                        0 && (
                        <Badge
                          variant="secondary"
                          className="bg-red-500/15 text-red-400 text-xs ms-auto"
                        >
                          {defects.filter((d) => d.status === 'OPEN').length}{' '}
                          {isAr ? 'مفتوح' : 'open'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {defects.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {isAr ? 'العنوان' : 'Title'}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {isAr ? 'الخطورة' : 'Severity'}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {t.status}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {t.date}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {defects.map((defect) => {
                              const sev =
                                defectSeverityConfig[defect.severity] ||
                                defectSeverityConfig.MEDIUM;
                              const dst =
                                defectStatusConfig[defect.status] ||
                                defectStatusConfig.OPEN;
                              return (
                                <tr
                                  key={defect.id}
                                  className="border-b border-slate-700/30 hover:bg-slate-800/40"
                                >
                                  <td className="p-3">
                                    <p className="text-white text-sm">
                                      {defect.title}
                                    </p>
                                    {defect.location && (
                                      <p className="text-slate-500 text-xs mt-0.5">
                                        {defect.location}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant="secondary"
                                      className={`${sev.bg} ${sev.color} text-xs`}
                                    >
                                      {isAr ? sev.labelAr : sev.labelEn}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant="secondary"
                                      className={`${dst.bg} ${dst.color} text-xs`}
                                    >
                                      {isAr ? dst.labelAr : dst.labelEn}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-slate-400 text-xs">
                                    {formatDate(defect.createdAt)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ===== BOQ TAB (Task 1A) ===== */}
            <TabsContent value="boq" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* BOQ Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/20">
                          <FileSpreadsheet className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {isAr ? 'إجمالي BOQ' : 'Total BOQ'}
                          </p>
                          <p className="text-xl font-bold text-white">
                            {formatCurrency(totalBOQ)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Layers className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {isAr ? 'عدد البنود' : 'Items Count'}
                          </p>
                          <p className="text-xl font-bold text-white">
                            {boqItems.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                          <DollarSign className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {isAr ? 'المصروف الفعلي' : 'Actual Spent'}
                          </p>
                          <p className="text-xl font-bold text-amber-400">
                            {formatCurrency(project.spent)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* BOQ Category Breakdown */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-violet-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'جدول الكميات (BOQ)' : 'Bill of Quantities'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {boqItems.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {isAr ? '#' : '#'}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {isAr ? 'الوصف' : 'Description'}
                              </th>
                              <th className="text-start p-3 text-slate-400 font-medium">
                                {isAr ? 'الفئة' : 'Category'}
                              </th>
                              <th className="text-center p-3 text-slate-400 font-medium">
                                {isAr ? 'الوحدة' : 'Unit'}
                              </th>
                              <th className="text-center p-3 text-slate-400 font-medium">
                                {isAr ? 'الكمية' : 'Qty'}
                              </th>
                              <th className="text-end p-3 text-slate-400 font-medium">
                                {isAr ? 'سعر الوحدة' : 'Unit Price'}
                              </th>
                              <th className="text-end p-3 text-slate-400 font-medium">
                                {isAr ? 'الإجمالي' : 'Total'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {boqItems.map((item, idx) => {
                              const catCfg = boqCategoryConfig[item.category || ''] || {
                                color: 'text-slate-400',
                                bg: 'bg-slate-500/15',
                                labelAr: item.category || '—',
                                labelEn: item.category || '—',
                              };
                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-slate-700/30 hover:bg-slate-800/40"
                                >
                                  <td className="p-3 text-slate-500 font-mono text-xs">
                                    {item.code || item.itemNumber || idx + 1}
                                  </td>
                                  <td className="p-3 text-white text-xs">
                                    {item.description}
                                  </td>
                                  <td className="p-3">
                                    <Badge
                                      variant="secondary"
                                      className={`${catCfg.bg} ${catCfg.color} text-[10px]`}
                                    >
                                      {isAr ? catCfg.labelAr : catCfg.labelEn}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-center text-slate-300 text-xs">
                                    {item.unit || '—'}
                                  </td>
                                  <td className="p-3 text-center text-white text-xs">
                                    {item.quantity}
                                  </td>
                                  <td className="p-3 text-end text-slate-300 text-xs">
                                    {formatCurrency(item.unitPrice)}
                                  </td>
                                  <td className="p-3 text-end text-white font-medium text-xs">
                                    {formatCurrency(item.totalPrice)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-600">
                              <td
                                colSpan={6}
                                className="p-3 text-end text-slate-400 font-semibold text-sm"
                              >
                                {isAr ? 'الإجمالي الكلي' : 'Grand Total'}
                              </td>
                              <td className="p-3 text-end text-emerald-400 font-bold">
                                {formatCurrency(totalBOQ)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Budget vs Actual Comparison */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-amber-400" />
                      <CardTitle className="text-base text-white">
                        {isAr ? 'الميزانية مقابل الفعلي' : 'Budget vs Actual'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500">
                          {isAr ? 'ميزانية BOQ' : 'BOQ Budget'}
                        </p>
                        <p className="text-lg font-bold text-violet-400 mt-1">
                          {formatCurrency(totalBOQ)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500">
                          {isAr ? 'المصروف الفعلي' : 'Actual Spent'}
                        </p>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                          {formatCurrency(project.spent)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500">
                          {isAr ? 'الفرق' : 'Variance'}
                        </p>
                        <p
                          className={`text-lg font-bold mt-1 ${
                            totalBOQ - project.spent >= 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {formatCurrency(totalBOQ - project.spent)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                        <p className="text-xs text-slate-500">
                          {isAr ? 'نسبة الاستنفاذ' : 'Utilization'}
                        </p>
                        <p
                          className={`text-lg font-bold mt-1 ${
                            totalBOQ > 0 &&
                            (project.spent / totalBOQ) * 100 > 90
                              ? 'text-red-400'
                              : totalBOQ > 0 &&
                                (project.spent / totalBOQ) * 100 > 70
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {totalBOQ > 0
                            ? Math.round(
                                (project.spent / totalBOQ) * 100
                              )
                            : 0}
                          %
                        </p>
                        <Progress
                          value={
                            totalBOQ > 0
                              ? Math.min(
                                  100,
                                  (project.spent / totalBOQ) * 100
                                )
                              : 0
                          }
                          className="h-1.5 bg-slate-700 mt-2"
                        />
                      </div>
                    </div>

                    {/* Category breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium">
                        {isAr ? 'تفصيل حسب الفئة' : 'By Category'}
                      </p>
                      {Object.entries(boqByCategory).map(
                        ([cat, items]) => {
                          const catTotal = items.reduce(
                            (sum, i) => sum + (i.totalPrice || 0),
                            0
                          );
                          const catCfg =
                            boqCategoryConfig[cat] || boqCategoryConfig.civil;
                          const pct =
                            totalBOQ > 0
                              ? Math.round((catTotal / totalBOQ) * 100)
                              : 0;
                          return (
                            <div
                              key={cat}
                              className="flex items-center gap-3 bg-slate-800/30 rounded-lg px-3 py-2"
                            >
                              <Badge
                                variant="secondary"
                                className={`${catCfg.bg} ${catCfg.color} text-[10px] w-20 justify-center`}
                              >
                                {isAr ? catCfg.labelAr : catCfg.labelEn}
                              </Badge>
                              <div className="flex-1">
                                <Progress
                                  value={pct}
                                  className="h-2 bg-slate-700"
                                />
                              </div>
                              <span className="text-xs text-slate-300 font-medium w-12 text-end">
                                {pct}%
                              </span>
                              <span className="text-xs text-white font-medium w-24 text-end">
                                {formatCurrency(catTotal)}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* BOQ Cost Variance Analysis */}
                {boqVariance && boqVariance.items.length > 0 && (
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-rose-400" />
                          <CardTitle className="text-base text-white">
                            {isAr ? 'تحليل تباين التكاليف' : 'Cost Variance Analysis'}
                          </CardTitle>
                        </div>
                        {boqVariance.flaggedCount > 0 && (
                          <Badge className="bg-red-500/15 text-red-400 text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {boqVariance.flaggedCount} {isAr ? 'بنود محذرة' : 'flagged'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Variance Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500">{isAr ? 'إجمالي الميزانية' : 'Total Budget'}</p>
                          <p className="text-sm font-bold text-violet-400 mt-1">{formatCurrency(boqVariance.totalBudget)}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500">{isAr ? 'إجمالي الفعلي' : 'Total Actual'}</p>
                          <p className="text-sm font-bold text-amber-400 mt-1">{formatCurrency(boqVariance.totalActual)}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500">{isAr ? 'التباين الكلي' : 'Total Variance'}</p>
                          <p className={`text-sm font-bold mt-1 ${boqVariance.totalVariance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(boqVariance.totalVariance)}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                          <p className="text-[10px] text-slate-500">{isAr ? 'نسبة التباين' : 'Variance %'}</p>
                          <p className={`text-sm font-bold mt-1 ${Math.abs(boqVariance.totalVariancePercent) > 20 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {boqVariance.totalVariancePercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Variance Items Table */}
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-slate-900">
                            <tr className="border-b border-slate-700/50">
                              <th className="text-start p-2.5 text-slate-400 font-medium text-xs">
                                {isAr ? 'البنود' : 'Item'}
                              </th>
                              <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                                {isAr ? 'الميزانية' : 'Budget'}
                              </th>
                              <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                                {isAr ? 'الفعلي' : 'Actual'}
                              </th>
                              <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                                {isAr ? 'التباين' : 'Variance'}
                              </th>
                              <th className="text-end p-2.5 text-slate-400 font-medium text-xs">
                                %
                              </th>
                              <th className="text-center p-2.5 text-slate-400 font-medium text-xs">
                                {isAr ? 'الحالة' : 'Status'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {boqVariance.items.map((item) => {
                              const isFlagged = item.flagged;
                              const isOver = item.isOverBudget;
                              return (
                                <tr
                                  key={item.boqItemId}
                                  className={`border-b border-slate-700/30 ${
                                    isFlagged ? 'bg-red-500/5 border-l-2 border-l-red-500/60' : ''
                                  }`}
                                >
                                  <td className="p-2.5">
                                    <div className="flex items-center gap-2">
                                      {isFlagged && (
                                        <AlertTriangle className={`h-3 w-3 shrink-0 ${isOver ? 'text-red-400' : 'text-amber-400'}`} />
                                      )}
                                      <span className="text-white text-xs truncate max-w-[200px]" title={item.description}>
                                        {item.description}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-end text-slate-300 text-xs">
                                    {formatCurrency(item.budget)}
                                  </td>
                                  <td className="p-2.5 text-end text-xs text-white">
                                    {formatCurrency(item.actual)}
                                  </td>
                                  <td className={`p-2.5 text-end text-xs font-medium ${item.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(item.variance)}
                                  </td>
                                  <td className={`p-2.5 text-end text-xs font-medium ${isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%
                                  </td>
                                  <td className="p-2.5 text-center">
                                    {isFlagged ? (
                                      <Badge variant="secondary" className="bg-red-500/10 text-red-400 text-[10px]">
                                        {isOver
                                          ? (isAr ? 'تجاوز' : 'Over Budget')
                                          : (isAr ? 'تحذير' : 'Warning')}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 text-[10px]">
                                        {isAr ? 'مقبول' : 'OK'}
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ===== TIMELINE TAB ===== */}
            <TabsContent value="timeline" className="p-4 lg:p-6 mt-0">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-blue-400" />
                    <CardTitle className="text-base text-white">
                      {isAr
                        ? 'الجدول الزمني للمراحل'
                        : 'Phase Timeline'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {phases.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">
                      {t.noData}
                    </p>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <div className="relative">
                        {/* Timeline line */}
                        <div
                          className={`absolute top-0 bottom-0 w-0.5 ${
                            isRTL ? 'right-[19px]' : 'left-[19px]'
                          } bg-slate-700`}
                        />

                        <div className="space-y-6">
                          {/* Category headers + phases */}
                          {Object.entries(phasesByCategory).map(
                            ([category, catPhases]) => {
                              const catConf = categoryConfig[category];
                              return (
                                <div key={category}>
                                  {/* Category label */}
                                  <div className="flex items-center gap-2 mb-3 ms-12">
                                    {catConf?.icon || (
                                      <Layers className="h-4 w-4" />
                                    )}
                                    <span className="text-sm font-semibold text-white">
                                      {catConf
                                        ? isAr
                                          ? catConf.ar
                                          : catConf.en
                                        : category}
                                    </span>
                                  </div>

                                  {/* Phase items */}
                                  {catPhases.map((phase) => {
                                    const ps =
                                      phaseStatusConfig[phase.status] ||
                                      phaseStatusConfig.NOT_STARTED;
                                    const ptl =
                                      phaseTypeLabels[phase.phaseType] || {
                                        ar: phase.phaseType,
                                        en: phase.phaseType,
                                      };
                                    const sla = calculateSLA(phase, isAr);
                                    const hasDependent =
                                      catPhases.findIndex(
                                        (p) => p.id === phase.id
                                      ) > 0;
                                    const depInfo =
                                      phaseDependencyMap[phase.id];
                                    const isBlocked =
                                      depInfo?.blocked &&
                                      phase.status === 'NOT_STARTED';

                                    return (
                                      <div
                                        key={phase.id}
                                        className="flex items-start gap-4 mb-4 group"
                                      >
                                        {/* Connector */}
                                        {hasDependent && (
                                          <div
                                            className={`absolute top-0 ${
                                              isRTL
                                                ? 'right-[18px]'
                                                : 'left-[18px]'
                                            } w-0.5 h-6 bg-slate-700`}
                                          />
                                        )}

                                        {/* Dot */}
                                        <div
                                          className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                                            phase.status === 'COMPLETED'
                                              ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                              : phase.status === 'IN_PROGRESS'
                                              ? 'bg-blue-500/20 border-2 border-blue-500 animate-pulse'
                                              : isBlocked
                                              ? 'bg-orange-500/20 border-2 border-orange-500'
                                              : phase.status === 'DELAYED' ||
                                                phase.status === 'REJECTED'
                                              ? 'bg-red-500/20 border-2 border-red-500'
                                              : 'bg-slate-800 border-2 border-slate-600'
                                          }`}
                                        >
                                          {isBlocked ? (
                                            <Lock className="h-4 w-4 text-orange-400" />
                                          ) : phase.status === 'COMPLETED' ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                          ) : phase.status === 'IN_PROGRESS' ? (
                                            <Play className="h-3 w-3 text-blue-400" />
                                          ) : phase.status === 'DELAYED' ||
                                            phase.status === 'REJECTED' ? (
                                            <AlertTriangle className="h-4 w-4 text-red-400" />
                                          ) : (
                                            <CircleDot className="h-3 w-3 text-slate-500" />
                                          )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 bg-slate-800/40 rounded-lg p-3 border border-slate-700/30 hover:border-slate-600/50 transition-colors min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-white">
                                              {isAr ? ptl.ar : ptl.en}
                                            </span>
                                            <Badge
                                              variant="secondary"
                                              className={`${ps.bg} ${ps.color} text-[10px]`}
                                            >
                                              {isAr ? ps.labelAr : ps.labelEn}
                                            </Badge>
                                            {isBlocked && (
                                              <Badge
                                                variant="secondary"
                                                className="bg-orange-500/10 text-orange-400 text-[10px]"
                                              >
                                                🔒{' '}
                                                {isAr ? 'محظور' : 'Blocked'}
                                              </Badge>
                                            )}
                                            {phase.rejectionCount > 0 && (
                                              <Badge
                                                variant="secondary"
                                                className="bg-red-500/10 text-red-400 text-[10px]"
                                              >
                                                {phase.rejectionCount}x{' '}
                                                {isAr ? 'رفض' : 'rej'}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                            {phase.assignedTo && (
                                              <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {phase.assignedTo.name ||
                                                  phase.assignedTo.fullName}
                                              </span>
                                            )}
                                            {phase.startDate && (
                                              <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(phase.startDate)}
                                              </span>
                                            )}
                                            {phase.status === 'IN_PROGRESS' && (
                                              <span className={sla.color}>
                                                {sla.text}
                                              </span>
                                            )}
                                          </div>
                                          {isBlocked &&
                                            depInfo &&
                                            depInfo.blockedBy.length > 0 && (
                                              <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-400/80">
                                                <Lock className="h-3 w-3" />
                                                <span>
                                                  {isAr
                                                    ? `يعتمد على: ${depInfo.blockedBy.join(', ')}`
                                                    : `Depends on: ${depInfo.blockedBy.join(', ')}`}
                                                </span>
                                              </div>
                                            )}
                                          {phase.notes && (
                                            <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                              {phase.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== CLIENT INTERACTIONS TAB (Task 1D) ===== */}
            <TabsContent value="interactions" className="p-4 lg:p-6 mt-0">
              <div className="space-y-6">
                {/* Header with filter and add button */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <Select
                      value={interactionFilter}
                      onValueChange={setInteractionFilter}
                    >
                      <SelectTrigger className="h-8 w-auto border-slate-700 bg-slate-800 text-xs text-slate-300 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ALL" className="text-slate-300">
                          {isAr ? 'الكل' : 'All'}
                        </SelectItem>
                        <SelectItem value="COMMENT" className="text-blue-400">
                          {isAr ? 'تعليقات' : 'Comments'}
                        </SelectItem>
                        <SelectItem value="APPROVAL" className="text-emerald-400">
                          {isAr ? 'موافقات' : 'Approvals'}
                        </SelectItem>
                        <SelectItem value="REJECTION" className="text-red-400">
                          {isAr ? 'رفوض' : 'Rejections'}
                        </SelectItem>
                        <SelectItem value="REQUEST_CHANGE" className="text-amber-400">
                          {isAr ? 'طلبات تعديل' : 'Changes'}
                        </SelectItem>
                        <SelectItem value="QUESTION" className="text-purple-400">
                          {isAr ? 'أسئلة' : 'Questions'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge
                      variant="secondary"
                      className="bg-slate-700 text-slate-400 text-[10px]"
                    >
                      {filteredInteractions.length}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => setInteractionDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {isAr ? 'إضافة تفاعل' : 'Add Interaction'}
                  </Button>
                </div>

                {/* Interactions List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {filteredInteractions.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardContent className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500">{t.noData}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredInteractions.map((interaction) => {
                      const itype =
                        interactionTypeConfig[interaction.interactionType] ||
                        interactionTypeConfig.COMMENT;

                      const ptl = interaction.phase
                        ? phaseTypeLabels[interaction.phase.phaseType]
                        : null;
                      const responderName =
                        interaction.respondedBy?.name ||
                        interaction.respondedBy?.fullName;

                      return (
                        <Card
                          key={interaction.id}
                          className={`bg-slate-900/50 ${itype.border}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <Badge
                                    variant="secondary"
                                    className={`${itype.bg} ${itype.color} text-xs gap-1`}
                                  >
                                    {itype.icon}
                                    {isAr ? itype.labelAr : itype.labelEn}
                                  </Badge>
                                  {ptl && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-slate-700 text-slate-400 text-[10px]"
                                    >
                                      {isAr ? ptl.ar : ptl.en}
                                    </Badge>
                                  )}
                                  <span className="text-[10px] text-slate-500 ms-auto">
                                    {formatDateTime(interaction.createdAt)}
                                  </span>
                                </div>

                                {/* Client message */}
                                <div className="bg-slate-800/60 rounded-lg p-3 mb-2">
                                  <p className="text-sm text-slate-200">
                                    {interaction.content}
                                  </p>
                                </div>

                                {/* Response */}
                                {interaction.responseContent && (
                                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 ms-6">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Send className="h-3 w-3 text-blue-400" />
                                      <span className="text-xs text-blue-400 font-medium">
                                        {isAr ? 'الرد' : 'Response'}
                                      </span>
                                      {responderName && (
                                        <span className="text-[10px] text-slate-500 ms-1">
                                          — {responderName}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-300">
                                      {interaction.responseContent}
                                    </p>
                                  </div>
                                )}

                                {!interaction.responseContent && (
                                  <p className="text-xs text-slate-600 italic ms-6">
                                    {isAr
                                      ? 'لا يوجد رد بعد'
                                      : 'No response yet'}
                                  </p>
                                )}
                              </div>

                              {/* Quick Actions */}
                              {!interaction.responseContent && (
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                        onClick={() =>
                                          handleQuickApprove(interaction)
                                        }
                                        disabled={submittingAction}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 border-slate-700 text-xs">
                                      {isAr ? 'موافقة' : 'Approve'}
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                        onClick={() =>
                                          handleQuickReject(interaction)
                                        }
                                        disabled={submittingAction}
                                      >
                                        <Ban className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 border-slate-700 text-xs">
                                      {isAr ? 'رفض' : 'Reject'}
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                                        onClick={() =>
                                          handleRequestChange(interaction)
                                        }
                                        disabled={submittingAction}
                                      >
                                        <RotateCcw className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 border-slate-700 text-xs">
                                      {isAr
                                        ? 'طلب تعديل'
                                        : 'Request Change'}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              )}

                              {/* Already responded indicators */}
                              {interaction.responseContent && (
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  {interaction.interactionType === 'APPROVAL' && (
                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/10">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    </div>
                                  )}
                                  {interaction.interactionType === 'REJECTION' && (
                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-red-500/10">
                                      <XCircle className="h-4 w-4 text-red-400" />
                                    </div>
                                  )}
                                  {interaction.interactionType === 'REQUEST_CHANGE' && (
                                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-amber-500/10">
                                      <RotateCcw className="h-4 w-4 text-amber-400" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>

                {/* Client Interaction Enhancement Panel */}
                <Separator className="my-6 bg-slate-800" />
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {isAr ? 'لوحة تفاعلات العميل' : 'Client Interaction Panel'}
                  </h3>
                  <ClientInteractionPanel projectId={projectId} clientId={project.client?.id} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ===== Add Interaction Dialog ===== */}
      <Dialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
      >
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {isAr ? 'إضافة تفاعل عميل' : 'Add Client Interaction'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">
                {isAr ? 'المرحلة' : 'Phase'}
              </Label>
              <Select
                value={interactionForm.phaseId}
                onValueChange={(val) =>
                  setInteractionForm({ ...interactionForm, phaseId: val })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue
                    placeholder={
                      isAr
                        ? 'اختر مرحلة (اختياري)'
                        : 'Select phase (optional)'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                  {phases.map((p) => {
                    const ptl =
                      phaseTypeLabels[p.phaseType] || {
                        ar: p.phaseType,
                        en: p.phaseType,
                      };
                    return (
                      <SelectItem
                        key={p.id}
                        value={p.id}
                        className="text-slate-300"
                      >
                        {isAr ? ptl.ar : ptl.en}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                {isAr ? 'نوع التفاعل' : 'Interaction Type'}
              </Label>
              <Select
                value={interactionForm.interactionType}
                onValueChange={(val) =>
                  setInteractionForm({
                    ...interactionForm,
                    interactionType: val,
                  })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem
                    value="COMMENT"
                    className="text-blue-400"
                  >
                    {isAr ? 'تعليق' : 'Comment'}
                  </SelectItem>
                  <SelectItem
                    value="APPROVAL"
                    className="text-emerald-400"
                  >
                    {isAr ? 'موافقة' : 'Approve'}
                  </SelectItem>
                  <SelectItem value="REJECTION" className="text-red-400">
                    {isAr ? 'رفض' : 'Reject'}
                  </SelectItem>
                  <SelectItem
                    value="REQUEST_CHANGE"
                    className="text-amber-400"
                  >
                    {isAr ? 'طلب تعديل' : 'Request Change'}
                  </SelectItem>
                  <SelectItem
                    value="QUESTION"
                    className="text-purple-400"
                  >
                    {isAr ? 'سؤال' : 'Question'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                {isAr ? 'المحتوى' : 'Content'} *
              </Label>
              <Textarea
                value={interactionForm.content}
                onChange={(e) =>
                  setInteractionForm({
                    ...interactionForm,
                    content: e.target.value,
                  })
                }
                placeholder={
                  isAr ? 'محتوى التفاعل...' : 'Interaction content...'
                }
                rows={3}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">
                {isAr ? 'الرد (اختياري)' : 'Response (optional)'}
              </Label>
              <Textarea
                value={interactionForm.responseContent}
                onChange={(e) =>
                  setInteractionForm({
                    ...interactionForm,
                    responseContent: e.target.value,
                  })
                }
                placeholder={
                  isAr ? 'رد على التفاعل...' : 'Response to interaction...'
                }
                rows={2}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setInteractionDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmitInteraction}
              disabled={
                !interactionForm.content.trim() || submittingInteraction
              }
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingInteraction && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Rejection Reason Dialog ===== */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-400" />
              {isAr ? 'سبب الرفض' : 'Rejection Reason'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">
              {isAr
                ? 'يرجى إدخال سبب الرفض. سيتم إرساله للعميل.'
                : 'Please enter the reason for rejection. It will be sent to the client.'}
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                isAr ? 'أدخل سبب الرفض...' : 'Enter rejection reason...'
              }
              rows={4}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmitRejection}
              disabled={!rejectReason.trim() || submittingAction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submittingAction && (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              )}
              {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
