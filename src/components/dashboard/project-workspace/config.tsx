'use client';

import React from 'react';
import {
  Layers,
  Building2,
  Wrench,
  Landmark,
  FileText,
  MessageCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';

// ===== Types =====
export interface ProjectData {
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

export interface WorkflowPhase {
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

export interface ClientInteraction {
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

export interface InvoiceData {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  currency: string;
}

export interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

export interface SiteReportData {
  id: string;
  date: string;
  weatherConditions?: string;
  workCompleted?: string;
  workforceCount: number;
  notes?: string;
}

export interface DefectData {
  id: string;
  title: string;
  severity: string;
  status: string;
  location?: string;
  createdAt: string;
  resolvedDate?: string;
  reportedBy?: { id: string; name: string } | null;
}

export interface BOQItemData {
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

export interface DependencyInfo {
  blocked: boolean;
  blockedBy: string[];
  canStart: boolean;
  dependencyChain: string[];
}

// ===== Config Maps =====
export const statusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  ACTIVE: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'نشط', labelEn: 'Active' },
  COMPLETED: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مكتمل', labelEn: 'Completed' },
  PLANNING: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'تخطيط', labelEn: 'Planning' },
  ON_HOLD: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'معلق', labelEn: 'On Hold' },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'ملغى', labelEn: 'Cancelled' },
};

export const typeConfig: Record<string, { labelAr: string; labelEn: string }> = {
  CONSULTANCY: { labelAr: 'استشارات', labelEn: 'Consultancy' },
  CONSTRUCTION: { labelAr: 'بناء', labelEn: 'Construction' },
  DESIGN: { labelAr: 'تصميم', labelEn: 'Design' },
  SUPERVISION: { labelAr: 'إشراف', labelEn: 'Supervision' },
};

export const phaseStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string; dot: string }> = {
  NOT_STARTED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'لم يبدأ', labelEn: 'Not Started', dot: 'bg-slate-400' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress', dot: 'bg-blue-400' },
  COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مكتمل', labelEn: 'Completed', dot: 'bg-emerald-400' },
  ON_HOLD: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'معلق', labelEn: 'On Hold', dot: 'bg-amber-400' },
  DELAYED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'متأخر', labelEn: 'Delayed', dot: 'bg-red-400' },
  REJECTED: { color: 'text-red-500', bg: 'bg-red-500/20', labelAr: 'مرفوض', labelEn: 'Rejected', dot: 'bg-red-500' },
};

export const phaseTypeLabels: Record<string, { ar: string; en: string }> = {
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

export const categoryConfig: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
  ARCHITECTURAL: { ar: 'المعماري', en: 'Architecture', icon: <Layers className="h-4 w-4" /> },
  STRUCTURAL: { ar: 'الإنشائي', en: 'Structural', icon: <Building2 className="h-4 w-4" /> },
  MEP: { ar: 'الخدمات', en: 'MEP', icon: <Wrench className="h-4 w-4" /> },
  GOVERNMENT: { ar: 'الموافقات', en: 'Government', icon: <Landmark className="h-4 w-4" /> },
  CONTRACTING: { ar: 'العقود', en: 'Contracting', icon: <FileText className="h-4 w-4" /> },
};

export const _mepSubGroupLabels: Record<string, { ar: string; en: string }> = {
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

export const _mepGroupOrder = ['NOC', 'ELECTRICAL', 'AC_CALCULATIONS', 'SOLAR_HEATING', 'LOAD_SCHEDULE', 'PANEL_SCHEDULE', 'ELEC_SPECIFICATIONS', 'LIGHTING', 'DRAINAGE', 'SITE_DRAINAGE', 'RAIN_DRAINAGE', 'TANK_DETAILS', 'WATER_SUPPLY', 'SITE_WATER', 'GROUND_FLOOR_WATER', 'ROOF_WATER', 'ETISALAT', 'ETISALAT_GF', 'HVAC', 'CD_FIRE_SYSTEM', 'CD_EMERGENCY_LIGHTING', 'CD_FIRE_FITTING', 'CD_SCHEMATIC', 'MEP_COORDINATION'];

export const invoiceStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  DRAFT: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'مسودة', labelEn: 'Draft' },
  SENT: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مرسلة', labelEn: 'Sent' },
  PAID: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مدفوعة', labelEn: 'Paid' },
  PARTIALLY_PAID: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'مدفوعة جزئياً', labelEn: 'Partially Paid' },
  OVERDUE: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'متأخرة', labelEn: 'Overdue' },
  CANCELLED: { color: 'text-slate-500', bg: 'bg-slate-500/15', labelAr: 'ملغاة', labelEn: 'Cancelled' },
};

export const defectSeverityConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'طفيف', labelEn: 'Low' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'متوسط', labelEn: 'Medium' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'مرتفع', labelEn: 'High' },
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'حرج', labelEn: 'Critical' },
};

export const defectStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  OPEN: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'مفتوح', labelEn: 'Open' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
  RESOLVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'تم الحل', labelEn: 'Resolved' },
  CLOSED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'مغلق', labelEn: 'Closed' },
};

export const boqCategoryConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  civil: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'مدني', labelEn: 'Civil' },
  structural: { color: 'text-orange-400', bg: 'bg-orange-500/15', labelAr: 'إنشائي', labelEn: 'Structural' },
  mep: { color: 'text-cyan-400', bg: 'bg-cyan-500/15', labelAr: 'خدمات', labelEn: 'MEP' },
  finishing: { color: 'text-violet-400', bg: 'bg-violet-500/15', labelAr: 'تشطيبات', labelEn: 'Finishing' },
  external: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'أشغال خارجية', labelEn: 'External' },
};

export const interactionTypeConfig: Record<string, { color: string; bg: string; border: string; labelAr: string; labelEn: string; icon: React.ReactNode }> = {
  COMMENT: { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', labelAr: 'تعليق', labelEn: 'Comment', icon: <MessageCircle className="h-3.5 w-3.5" /> },
  APPROVAL: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', labelAr: 'موافقة', labelEn: 'Approval', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  REJECTION: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', labelAr: 'رفض', labelEn: 'Rejection', icon: <XCircle className="h-3.5 w-3.5" /> },
  REQUEST_CHANGE: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', labelAr: 'طلب تعديل', labelEn: 'Request Change', icon: <RotateCcw className="h-3.5 w-3.5" /> },
  QUESTION: { color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', labelAr: 'سؤال', labelEn: 'Question', icon: <HelpCircle className="h-3.5 w-3.5" /> },
};

export const govApprovalConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/15', labelAr: 'معلق', labelEn: 'Pending' },
  SUBMITTED: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'مقدم', labelEn: 'Submitted' },
  APPROVED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'تمت الموافقة', labelEn: 'Approved' },
  REJECTED: { color: 'text-red-400', bg: 'bg-red-500/15', labelAr: 'مرفوض', labelEn: 'Rejected' },
};

export const mepStatusConfig: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  NOT_STARTED: { color: 'text-slate-400', bg: 'bg-slate-500/15', labelAr: 'لم يبدأ', labelEn: 'Not Started' },
  IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/15', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
  COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', labelAr: 'مكتمل', labelEn: 'Completed' },
};

// ===== Role-based Tab Access =====
export const ROLE_TABS: Record<string, string[]> = {
  ADMIN: ['matrix', 'overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'boq', 'timeline', 'interactions'],
  MANAGER: ['matrix', 'overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'boq', 'timeline', 'interactions'],
  PROJECT_MANAGER: ['matrix', 'overview', 'architectural', 'structural', 'mep', 'government', 'financial', 'site', 'boq', 'timeline', 'interactions'],
  ENGINEER: ['matrix', 'overview', 'architectural', 'financial', 'boq'],
  DRAFTSMAN: ['matrix', 'overview', 'architectural', 'boq'],
  ACCOUNTANT: ['matrix', 'overview', 'financial', 'boq'],
  HR: ['matrix', 'overview'],
  SECRETARY: ['matrix', 'overview', 'documents', 'boq'],
  VIEWER: ['matrix', 'overview', 'timeline', 'boq'],
};

// ===== SLA Helper =====
export function calculateSLA(phase: WorkflowPhase, isAr: boolean): { text: string; color: string } {
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
export function computePhaseDependencies(
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
