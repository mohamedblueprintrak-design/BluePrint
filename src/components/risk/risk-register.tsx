'use client';

/**
 * Risk Register Component
 * سجل المخاطر للمشاريع
 */

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, Plus, Trash2,
    Minus, Shield, 
  CheckCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
interface RiskAction {
  id: string;
  riskId: string;
  action: string;
  assignedTo?: string;
  dueDate?: Date | null;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date | null;
  notes?: string;
}

interface Risk {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  category: 'technical' | 'financial' | 'schedule' | 'external' | 'organizational';
  probability: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // probability * impact
  status: 'open' | 'mitigated' | 'closed' | 'accepted';
  priority: 'low' | 'medium' | 'high' | 'critical';
  identifiedDate: Date;
  targetDate?: Date | null;
  closedDate?: Date | null;
  owner?: string;
  mitigationPlan?: string;
  contingencyPlan?: string;
  responseStrategy?: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  residualRisk?: number;
  riskActions?: RiskAction[];
}

interface RiskRegisterProps {
  projectId?: string;
  lang?: 'ar' | 'en';
  onRiskUpdate?: (risk: Risk) => void;
  onRiskCreate?: (risk: Partial<Risk>) => void;
  onRiskDelete?: (riskId: string) => void;
}

// Constants
const RISK_CATEGORIES: Record<string, { en: string; ar: string; color: string }> = {
  technical: { en: 'Technical', ar: 'تقني', color: '#3b82f6' },
  financial: { en: 'Financial', ar: 'مالي', color: '#10b981' },
  schedule: { en: 'Schedule', ar: 'جدول زمني', color: '#f59e0b' },
  external: { en: 'External', ar: 'خارجي', color: '#8b5cf6' },
  organizational: { en: 'Organizational', ar: 'تنظيمي', color: '#ec4899' },
};

const RISK_STATUS: Record<string, { en: string; ar: string; icon: React.ReactNode; color: string }> = {
  open: { en: 'Open', ar: 'مفتوح', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-red-500' },
  mitigated: { en: 'Mitigated', ar: 'تم التخفيف', icon: <Shield className="w-4 h-4" />, color: 'bg-amber-500' },
  closed: { en: 'Closed', ar: 'مغلق', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' },
  accepted: { en: 'Accepted', ar: 'مقبول', icon: <Minus className="w-4 h-4" />, color: 'bg-slate-500' },
};

const RESPONSE_STRATEGIES: Record<string, { en: string; ar: string }> = {
  avoid: { en: 'Avoid', ar: 'تجنب' },
  mitigate: { en: 'Mitigate', ar: 'تخفيف' },
  transfer: { en: 'Transfer', ar: 'نقل' },
  accept: { en: 'Accept', ar: 'قبول' },
};

// Get risk score color
const getRiskScoreColor = (score: number): string => {
  if (score >= 15) return '#dc2626'; // Critical - Red
  if (score >= 10) return '#f59e0b'; // High - Amber
  if (score >= 5) return '#3b82f6';  // Medium - Blue
  return '#10b981';                   // Low - Green
};

// Get priority from risk score
const getPriorityFromScore = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
};

export function RiskRegister({
  projectId,
  lang = 'ar',
  onRiskUpdate,
  onRiskCreate,
  onRiskDelete,
}: RiskRegisterProps) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'matrix'>('table');

  const isRTL = lang === 'ar';

  // Fetch risks
  useEffect(() => {
    async function fetchRisks() {
      try {
        const url = projectId 
          ? `/api/risks?projectId=${projectId}`
          : '/api/risks';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          const parsedRisks = data.data.map((risk: any) => ({
            ...risk,
            identifiedDate: new Date(risk.identifiedDate),
            targetDate: risk.targetDate ? new Date(risk.targetDate) : null,
            closedDate: risk.closedDate ? new Date(risk.closedDate) : null,
          }));
          setRisks(parsedRisks);
        }
      } catch (error) {
        console.error('Error fetching risks:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRisks();
  }, [projectId]);

  // Calculate statistics
  const stats = {
    total: risks.length,
    open: risks.filter(r => r.status === 'open').length,
    mitigated: risks.filter(r => r.status === 'mitigated').length,
    closed: risks.filter(r => r.status === 'closed').length,
    highRisk: risks.filter(r => r.riskScore >= 10).length,
    avgScore: risks.length > 0 
      ? Math.round(risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length) 
      : 0,
  };

  // Filter risks
  const filteredRisks = risks.filter(risk => {
    if (filterCategory !== 'all' && risk.category !== filterCategory) return false;
    if (filterStatus !== 'all' && risk.status !== filterStatus) return false;
    return true;
  });

  // Risk Matrix data
  const riskMatrix = useMemo(() => {
    const matrix: { [key: string]: Risk[] } = {};
    
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        matrix[`${p}-${i}`] = risks.filter(r => r.probability === p && r.impact === i);
      }
    }
    
    return matrix;
  }, [risks]);

  // Handle risk create
  const handleCreateRisk = async (risk: Partial<Risk>) => {
    try {
      const response = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(risk),
      });

      if (response.ok) {
        const data = await response.json();
        setRisks(prev => [...prev, data.data]);
        onRiskCreate?.(risk);
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating risk:', error);
    }
  };

  // Handle risk update
  const handleUpdateRisk = async (risk: Risk) => {
    try {
      const response = await fetch('/api/risks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(risk),
      });

      if (response.ok) {
        setRisks(prev => prev.map(r => r.id === risk.id ? risk : r));
        onRiskUpdate?.(risk);
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating risk:', error);
    }
  };

  // Handle risk delete
  const handleDeleteRisk = async (riskId: string) => {
    try {
      const response = await fetch(`/api/risks?id=${riskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRisks(prev => prev.filter(r => r.id !== riskId));
        onRiskDelete?.(riskId);
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting risk:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
            {lang === 'ar' ? 'سجل المخاطر' : 'Risk Register'}
          </h1>
          <p className="text-slate-400 mt-1">
            {lang === 'ar' 
              ? 'تتبع وإدارة مخاطر المشاريع' 
              : 'Track and manage project risks'}
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {lang === 'ar' ? 'إضافة خطر' : 'Add Risk'}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-slate-400">
                {lang === 'ar' ? 'إجمالي المخاطر' : 'Total Risks'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{stats.open}</p>
              <p className="text-sm text-slate-400">
                {lang === 'ar' ? 'مفتوحة' : 'Open'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">{stats.mitigated}</p>
              <p className="text-sm text-slate-400">
                {lang === 'ar' ? 'تم التخفيف' : 'Mitigated'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{stats.closed}</p>
              <p className="text-sm text-slate-400">
                {lang === 'ar' ? 'مغلقة' : 'Closed'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.avgScore}</p>
              <p className="text-sm text-slate-400">
                {lang === 'ar' ? 'متوسط الدرجة' : 'Avg Score'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'جدول' : 'Table'}
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'matrix' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'ar' ? 'مصفوفة' : 'Matrix'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <SelectValue placeholder={lang === 'ar' ? 'الفئة' : 'Category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'ar' ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(RISK_CATEGORIES).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <SelectValue placeholder={lang === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === 'ar' ? 'الكل' : 'All'}</SelectItem>
              {Object.entries(RISK_STATUS).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-slate-400">
                    {lang === 'ar' ? 'المخاطر' : 'Risk'}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {lang === 'ar' ? 'الفئة' : 'Category'}
                  </TableHead>
                  <TableHead className="text-slate-400 text-center">P</TableHead>
                  <TableHead className="text-slate-400 text-center">I</TableHead>
                  <TableHead className="text-slate-400 text-center">
                    {lang === 'ar' ? 'الدرجة' : 'Score'}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {lang === 'ar' ? 'الحالة' : 'Status'}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {lang === 'ar' ? 'الاستراتيجية' : 'Strategy'}
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    {lang === 'ar' ? 'إجراءات' : 'Actions'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRisks.map((risk) => (
                  <TableRow 
                    key={risk.id} 
                    className="border-slate-800 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => {
                      setSelectedRisk(risk);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{risk.title}</p>
                        {risk.description && (
                          <p className="text-slate-400 text-sm truncate max-w-xs">
                            {risk.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        style={{ backgroundColor: RISK_CATEGORIES[risk.category]?.color + '20', color: RISK_CATEGORIES[risk.category]?.color }}
                      >
                        {RISK_CATEGORIES[risk.category]?.[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-white">{risk.probability}</TableCell>
                    <TableCell className="text-center text-white">{risk.impact}</TableCell>
                    <TableCell className="text-center">
                      <span 
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm"
                        style={{ backgroundColor: getRiskScoreColor(risk.riskScore) }}
                      >
                        {risk.riskScore}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={RISK_STATUS[risk.status]?.color + ' text-white'}>
                        {RISK_STATUS[risk.status]?.[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {risk.responseStrategy ? RESPONSE_STRATEGIES[risk.responseStrategy]?.[lang] : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRisk(risk.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              {lang === 'ar' ? 'مصفوفة المخاطر' : 'Risk Matrix'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Matrix Header */}
                <div className="flex items-center mb-2">
                  <div className="w-20" />
                  <div className="flex-1 grid grid-cols-5 text-center text-sm text-slate-400">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                  </div>
                </div>
                <div className="text-center text-slate-400 mb-2 text-sm">
                  {lang === 'ar' ? 'التأثير →' : 'Impact →'}
                </div>

                {/* Matrix Grid */}
                {[5, 4, 3, 2, 1].map((probability) => (
                  <div key={probability} className="flex items-center mb-1">
                    <div className="w-20 text-center text-slate-400 text-sm">
                      {probability} {lang === 'ar' ? 'الاحتمال' : 'Prob'}
                    </div>
                    <div className="flex-1 grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((impact) => {
                        const cellRisks = riskMatrix[`${probability}-${impact}`] || [];
                        const score = probability * impact;
                        
                        return (
                          <div
                            key={impact}
                            className="h-16 rounded border border-slate-700 flex items-center justify-center relative cursor-pointer hover:ring-2 hover:ring-blue-500"
                            style={{ backgroundColor: getRiskScoreColor(score) + '30' }}
                          >
                            {cellRisks.length > 0 && (
                              <span 
                                className="text-white font-bold"
                                style={{ color: getRiskScoreColor(score) }}
                              >
                                {cellRisks.length}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
                <span className="text-sm text-slate-400">
                  {lang === 'ar' ? 'منخفض (1-4)' : 'Low (1-4)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }} />
                <span className="text-sm text-slate-400">
                  {lang === 'ar' ? 'متوسط (5-9)' : 'Medium (5-9)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                <span className="text-sm text-slate-400">
                  {lang === 'ar' ? 'عالي (10-14)' : 'High (10-14)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }} />
                <span className="text-sm text-slate-400">
                  {lang === 'ar' ? 'حرج (15-25)' : 'Critical (15-25)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Risk Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'تعديل الخطر' : 'Edit Risk'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRisk && (
            <RiskForm
              risk={selectedRisk}
              lang={lang}
              onSubmit={handleUpdateRisk}
              onCancel={() => setIsEditDialogOpen(false)}
              onDelete={() => handleDeleteRisk(selectedRisk.id)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Risk Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lang === 'ar' ? 'إضافة خطر جديد' : 'Add New Risk'}
            </DialogTitle>
          </DialogHeader>
          
          <RiskForm
            lang={lang}
            projectId={projectId}
            onSubmit={handleCreateRisk}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Risk Form Component
function RiskForm({
  risk,
  lang,
  projectId,
  onSubmit,
  onCancel,
  onDelete,
}: {
  risk?: Risk;
  lang: 'ar' | 'en';
  projectId?: string;
  onSubmit: (risk: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(risk?.title || '');
  const [description, setDescription] = useState(risk?.description || '');
  const [category, setCategory] = useState<Risk['category']>(risk?.category || 'technical');
  const [probability, setProbability] = useState(risk?.probability || 3);
  const [impact, setImpact] = useState(risk?.impact || 3);
  const [status, setStatus] = useState<Risk['status']>(risk?.status || 'open');
  const [responseStrategy, setResponseStrategy] = useState<Risk['responseStrategy']>(risk?.responseStrategy || 'mitigate');
  const [mitigationPlan, setMitigationPlan] = useState(risk?.mitigationPlan || '');
  const [contingencyPlan, setContingencyPlan] = useState(risk?.contingencyPlan || '');
  const [targetDate, setTargetDate] = useState(
    risk?.targetDate ? new Date(risk.targetDate).toISOString().split('T')[0] : ''
  );

  const riskScore = probability * impact;

  const handleSubmit = () => {
    onSubmit({
      id: risk?.id,
      title,
      description,
      category,
      probability,
      impact,
      riskScore,
      status,
      responseStrategy,
      mitigationPlan,
      contingencyPlan,
      targetDate: targetDate ? new Date(targetDate) : null,
      projectId,
      priority: getPriorityFromScore(riskScore),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{lang === 'ar' ? 'عنوان الخطر' : 'Risk Title'} *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'ar' ? 'وصف مختصر للخطر' : 'Brief description of the risk'}
        />
      </div>

      <div>
        <Label>{lang === 'ar' ? 'الوصف التفصيلي' : 'Description'}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={lang === 'ar' ? 'وصف تفصيلي للخطر' : 'Detailed description of the risk'}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{lang === 'ar' ? 'الفئة' : 'Category'}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RISK_CATEGORIES).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{lang === 'ar' ? 'الحالة' : 'Status'}</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RISK_STATUS).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{lang === 'ar' ? 'الاحتمال (1-5)' : 'Probability (1-5)'}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={5}
              value={probability}
              onChange={(e) => setProbability(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            />
            <div className="flex-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(probability / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label>{lang === 'ar' ? 'التأثير (1-5)' : 'Impact (1-5)'}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={5}
              value={impact}
              onChange={(e) => setImpact(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            />
            <div className="flex-1">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(impact / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score Display */}
      <div className="p-4 rounded-lg bg-slate-800 flex items-center justify-between">
        <span className="text-slate-400">
          {lang === 'ar' ? 'درجة الخطر' : 'Risk Score'}
        </span>
        <span 
          className="text-2xl font-bold"
          style={{ color: getRiskScoreColor(riskScore) }}
        >
          {riskScore} ({getPriorityFromScore(riskScore)})
        </span>
      </div>

      <div>
        <Label>{lang === 'ar' ? 'استراتيجية الاستجابة' : 'Response Strategy'}</Label>
        <Select value={responseStrategy} onValueChange={(v) => setResponseStrategy(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RESPONSE_STRATEGIES).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value[lang]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{lang === 'ar' ? 'خطة التخفيف' : 'Mitigation Plan'}</Label>
        <Textarea
          value={mitigationPlan}
          onChange={(e) => setMitigationPlan(e.target.value)}
          placeholder={lang === 'ar' ? 'الإجراءات المتخذة لتقليل الخطر' : 'Actions to reduce the risk'}
          rows={3}
        />
      </div>

      <div>
        <Label>{lang === 'ar' ? 'خطة الطوارئ' : 'Contingency Plan'}</Label>
        <Textarea
          value={contingencyPlan}
          onChange={(e) => setContingencyPlan(e.target.value)}
          placeholder={lang === 'ar' ? 'خطة بديلة في حالة تحقق الخطر' : 'Backup plan if risk materializes'}
          rows={3}
        />
      </div>

      <div>
        <Label>{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Target Date'}</Label>
        <Input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className="flex justify-between pt-4">
        {onDelete && (
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            {lang === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onCancel}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!title}>
            {lang === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add useMemo import
import { useMemo } from 'react';

export default RiskRegister;
