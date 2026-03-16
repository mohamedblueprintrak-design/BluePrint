'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useTranslation } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Search, Copy, Check, Beaker, Layers, Wind, Building, DollarSign,
  Zap, Thermometer, Droplets, Ruler, Hammer, Shield, ArrowDownNarrowWide,
  Cylinder, ArrowDownWideNarrow
} from 'lucide-react';

// Knowledge data structure
interface KnowledgeItem {
  id: string;
  titleAr: string;
  titleEn: string;
  valueAr: string;
  valueEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'concrete' | 'steel' | 'loads' | 'foundations' | 'prices';
  tags: string[];
  icon?: React.ReactNode;
}

// Knowledge base data
const KNOWLEDGE_DATA: KnowledgeItem[] = [
  // Concrete Tab
  {
    id: 'conc-1',
    titleAr: 'مقاومة الخرسانة',
    titleEn: 'Concrete Strength',
    valueAr: 'fcu = 25 N/mm²',
    valueEn: 'fcu = 25 N/mm²',
    descriptionAr: 'الحد الأدنى لمقاومة الخرسانة للعناصر الإنشائية حسب كود الإمارات',
    descriptionEn: 'Minimum concrete strength for structural elements per UAE code',
    category: 'concrete',
    tags: ['resistance', 'strength', 'structural'],
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 'conc-2',
    titleAr: 'نسبة الماء/الأسمنت',
    titleEn: 'Water/Cement Ratio',
    valueAr: 'w/c ≤ 0.45',
    valueEn: 'w/c ≤ 0.45',
    descriptionAr: 'الحد الأقصى لنسبة الماء إلى الأسمنت للخرسانة العادية',
    descriptionEn: 'Maximum water to cement ratio for normal concrete',
    category: 'concrete',
    tags: ['ratio', 'water', 'cement'],
    icon: <Droplets className="w-5 h-5" />
  },
  {
    id: 'conc-3',
    titleAr: 'فترة المعالجة',
    titleEn: 'Curing Period',
    valueAr: '7 أيام (الحد الأدنى)',
    valueEn: '7 days (minimum)',
    descriptionAr: 'الحد الأدنى لفترة معالجة الخرسانة للحفاظ على الرطوبة',
    descriptionEn: 'Minimum curing period to maintain moisture for concrete',
    category: 'concrete',
    tags: ['curing', 'time', 'moisture'],
    icon: <Thermometer className="w-5 h-5" />
  },
  {
    id: 'conc-4',
    titleAr: 'الغطاء الخرساني للأعمدة',
    titleEn: 'Cover for Columns',
    valueAr: '40 مم',
    valueEn: '40 mm',
    descriptionAr: 'الغطاء الخرساني الأدنى للأعمدة في البيئة العادية',
    descriptionEn: 'Minimum concrete cover for columns in normal environment',
    category: 'concrete',
    tags: ['cover', 'columns', 'protection'],
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: 'conc-5',
    titleAr: 'الغطاء الخرساني للكمرات',
    titleEn: 'Cover for Beams',
    valueAr: '25 مم',
    valueEn: '25 mm',
    descriptionAr: 'الغطاء الخرساني الأدنى للكمرات في البيئة العادية',
    descriptionEn: 'Minimum concrete cover for beams in normal environment',
    category: 'concrete',
    tags: ['cover', 'beams', 'protection'],
    icon: <Layers className="w-5 h-5" />
  },
  {
    id: 'conc-6',
    titleAr: 'الغطاء الخرساني للعناصر الخارجية',
    titleEn: 'Cover for External Elements',
    valueAr: '50 مم',
    valueEn: '50 mm',
    descriptionAr: 'الغطاء الخرساني الأدنى للعناصر المعرضة للظروف الجوية',
    descriptionEn: 'Minimum concrete cover for elements exposed to weather',
    category: 'concrete',
    tags: ['cover', 'external', 'weather'],
    icon: <Wind className="w-5 h-5" />
  },
  
  // Steel Tab
  {
    id: 'steel-1',
    titleAr: 'درجة الحديد',
    titleEn: 'Steel Grade',
    valueAr: 'Grade 60 (fy = 420 N/mm²)',
    valueEn: 'Grade 60 (fy = 420 N/mm²)',
    descriptionAr: 'درجة الحديد المستخدمة في التسليح حسب المواصفات الإماراتية',
    descriptionEn: 'Steel grade used for reinforcement per UAE specifications',
    category: 'steel',
    tags: ['grade', 'reinforcement', 'strength'],
    icon: <Hammer className="w-5 h-5" />
  },
  {
    id: 'steel-2',
    titleAr: 'نسبة التسليح الأدنى للكمرات',
    titleEn: 'Min. Reinforcement Ratio (Beams)',
    valueAr: 'ρmin = 0.25%',
    valueEn: 'ρmin = 0.25%',
    descriptionAr: 'نسبة التسليح الأدنى للكمرات لمنع التشقق',
    descriptionEn: 'Minimum reinforcement ratio for beams to prevent cracking',
    category: 'steel',
    tags: ['ratio', 'beams', 'minimum'],
    icon: <Ruler className="w-5 h-5" />
  },
  {
    id: 'steel-3',
    titleAr: 'نسبة التسليح الأدنى للأعمدة',
    titleEn: 'Min. Reinforcement Ratio (Columns)',
    valueAr: 'ρmin = 1.0%',
    valueEn: 'ρmin = 1.0%',
    descriptionAr: 'نسبة التسليح الأدنى للأعمدة',
    descriptionEn: 'Minimum reinforcement ratio for columns',
    category: 'steel',
    tags: ['ratio', 'columns', 'minimum'],
    icon: <Cylinder className="w-5 h-5" />
  },
  {
    id: 'steel-4',
    titleAr: 'أقطار القضبان الشائعة',
    titleEn: 'Common Bar Diameters',
    valueAr: '10, 12, 14, 16, 20, 25, 32 مم',
    valueEn: '10, 12, 14, 16, 20, 25, 32 mm',
    descriptionAr: 'الأقطار المتوفرة لقضبان التسليح في السوق الإماراتي',
    descriptionEn: 'Available reinforcement bar diameters in UAE market',
    category: 'steel',
    tags: ['diameter', 'bars', 'sizes'],
    icon: <Ruler className="w-5 h-5" />
  },
  {
    id: 'steel-5',
    titleAr: 'طول التشابك',
    titleEn: 'Splicing Length',
    valueAr: 'Ld = 40db (تقريباً)',
    valueEn: 'Ld = 40db (approximately)',
    descriptionAr: 'طول التشابك للقضبان في الشد، حيث db قطر القضيب',
    descriptionEn: 'Splicing length for bars in tension, where db is bar diameter',
    category: 'steel',
    tags: ['splicing', 'length', 'tension'],
    icon: <ArrowDownWideNarrow className="w-5 h-5" />
  },
  {
    id: 'steel-6',
    titleAr: 'الحد الأقصى للتسليح',
    titleEn: 'Maximum Reinforcement',
    valueAr: 'ρmax = 4%',
    valueEn: 'ρmax = 4%',
    descriptionAr: 'الحد الأقصى لنسبة التسليح في المقاطع الخرسانية',
    descriptionEn: 'Maximum reinforcement ratio in concrete sections',
    category: 'steel',
    tags: ['maximum', 'ratio', 'reinforcement'],
    icon: <ArrowDownNarrowWide className="w-5 h-5" />
  },
  
  // Loads Tab
  {
    id: 'load-1',
    titleAr: 'وزن الخرسانة',
    titleEn: 'Concrete Unit Weight',
    valueAr: '25 kN/m³',
    valueEn: '25 kN/m³',
    descriptionAr: 'الوزن الحجمي للخرسانة العادية المسلحة',
    descriptionEn: 'Unit weight of reinforced normal concrete',
    category: 'loads',
    tags: ['weight', 'dead', 'concrete'],
    icon: <Building2 className="w-5 h-5" />
  },
  {
    id: 'load-2',
    titleAr: 'الحمل الحي للسكن',
    titleEn: 'Residential Live Load',
    valueAr: '2.0 kN/m²',
    valueEn: '2.0 kN/m²',
    descriptionAr: 'الحمل الحي المفترض للمباني السكنية',
    descriptionEn: 'Assumed live load for residential buildings',
    category: 'loads',
    tags: ['live', 'residential', 'building'],
    icon: <Building className="w-5 h-5" />
  },
  {
    id: 'load-3',
    titleAr: 'الحمل الحي للمكاتب',
    titleEn: 'Office Live Load',
    valueAr: '2.5 kN/m²',
    valueEn: '2.5 kN/m²',
    descriptionAr: 'الحمل الحي المفترض للمكاتب',
    descriptionEn: 'Assumed live load for offices',
    category: 'loads',
    tags: ['live', 'office', 'building'],
    icon: <Building className="w-5 h-5" />
  },
  {
    id: 'load-4',
    titleAr: 'الحمل الحي للمستودعات',
    titleEn: 'Warehouse Live Load',
    valueAr: '5.0 kN/m²',
    valueEn: '5.0 kN/m²',
    descriptionAr: 'الحمل الحي المفترض للمستودعات ومناطق التخزين',
    descriptionEn: 'Assumed live load for warehouses and storage areas',
    category: 'loads',
    tags: ['live', 'warehouse', 'storage'],
    icon: <Building className="w-5 h-5" />
  },
  {
    id: 'load-5',
    titleAr: 'السرعة الأساسية للرياح',
    titleEn: 'Basic Wind Speed',
    valueAr: '45 m/s (تقريباً)',
    valueEn: '45 m/s (approximately)',
    descriptionAr: 'السرعة الأساسية للرياح في الإمارات حسب المنطقة',
    descriptionEn: 'Basic wind speed in UAE depending on region',
    category: 'loads',
    tags: ['wind', 'speed', 'environmental'],
    icon: <Wind className="w-5 h-5" />
  },
  {
    id: 'load-6',
    titleAr: 'معامل الزلزال',
    titleEn: 'Seismic Coefficient',
    valueAr: 'Z = 0.15g - 0.20g',
    valueEn: 'Z = 0.15g - 0.20g',
    descriptionAr: 'معامل المنطقة الزلزالية للإمارات يختلف حسب الموقع',
    descriptionEn: 'Seismic zone coefficient for UAE varies by location',
    category: 'loads',
    tags: ['seismic', 'earthquake', 'environmental'],
    icon: <Zap className="w-5 h-5" />
  },
  
  // Foundations Tab
  {
    id: 'found-1',
    titleAr: 'القدرة التحميلية للتربة',
    titleEn: 'Soil Bearing Capacity',
    valueAr: '150 - 300 kN/m² (نموذجي)',
    valueEn: '150 - 300 kN/m² (typical)',
    descriptionAr: 'القدرة التحميلية المسموحة للتربة النموذجية في الإمارات',
    descriptionEn: 'Allowable bearing capacity for typical soil in UAE',
    category: 'foundations',
    tags: ['soil', 'bearing', 'capacity'],
    icon: <Layers className="w-5 h-5" />
  },
  {
    id: 'found-2',
    titleAr: 'عمق الأساس الأدنى',
    titleEn: 'Minimum Foundation Depth',
    valueAr: '0.9 م',
    valueEn: '0.9 m',
    descriptionAr: 'الحد الأدنى لعمق الأساسات للوقاية من تقلبات الرطوبة',
    descriptionEn: 'Minimum foundation depth to protect from moisture changes',
    category: 'foundations',
    tags: ['depth', 'foundation', 'minimum'],
    icon: <ArrowDownNarrowWide className="w-5 h-5" />
  },
  {
    id: 'found-3',
    titleAr: 'معالجة تربة السبخا',
    titleEn: 'Sabkha Soil Treatment',
    valueAr: 'استبدال / تحسين التربة',
    valueEn: 'Soil replacement / improvement',
    descriptionAr: 'معالجة تربة السبخا المالحة تتطلب استبدال أو تحسين التربة',
    descriptionEn: 'Treatment of salty Sabkha soil requires replacement or improvement',
    category: 'foundations',
    tags: ['sabkha', 'soil', 'treatment'],
    icon: <Droplets className="w-5 h-5" />
  },
  {
    id: 'found-4',
    titleAr: 'قدرة الركائز',
    titleEn: 'Pile Capacity',
    valueAr: '500 - 3000 kN (نموذجي)',
    valueEn: '500 - 3000 kN (typical)',
    descriptionAr: 'القدرة التحميلية للركائز حسب القطر والعمق ونوع التربة',
    descriptionEn: 'Pile capacity depends on diameter, depth, and soil type',
    category: 'foundations',
    tags: ['piles', 'capacity', 'deep'],
    icon: <ArrowDownNarrowWide className="w-5 h-5" />
  },
  {
    id: 'found-5',
    titleAr: 'عمق الركائز',
    titleEn: 'Pile Depth',
    valueAr: '12 - 25 م (نموذجي)',
    valueEn: '12 - 25 m (typical)',
    descriptionAr: 'العمق النموذجي للركائز في الإمارات',
    descriptionEn: 'Typical depth of piles in UAE',
    category: 'foundations',
    tags: ['piles', 'depth', 'deep'],
    icon: <Cylinder className="w-5 h-5" />
  },
  {
    id: 'found-6',
    titleAr: 'فحوصات التربة المطلوبة',
    titleEn: 'Required Soil Tests',
    valueAr: 'SPT, CPT, اختبار الحمل',
    valueEn: 'SPT, CPT, Load Test',
    descriptionAr: 'الفحوصات المطلوبة لدراسة التربة قبل التصميم',
    descriptionEn: 'Required tests for soil investigation before design',
    category: 'foundations',
    tags: ['tests', 'investigation', 'soil'],
    icon: <Beaker className="w-5 h-5" />
  },
  
  // Prices Tab
  {
    id: 'price-1',
    titleAr: 'سعر الخرسانة C25',
    titleEn: 'Concrete C25 Price',
    valueAr: '280 - 350 درهم/م³',
    valueEn: '280 - 350 AED/m³',
    descriptionAr: 'السعر الحالي للخرسانة العادية مقاومة 25 N/mm²',
    descriptionEn: 'Current price for normal concrete with 25 N/mm² strength',
    category: 'prices',
    tags: ['concrete', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-2',
    titleAr: 'سعر الحديد Grade 60',
    titleEn: 'Steel Grade 60 Price',
    valueAr: '2,500 - 3,000 درهم/طن',
    valueEn: '2,500 - 3,000 AED/ton',
    descriptionAr: 'السعر الحالي لحديد التسليح درجة 60',
    descriptionEn: 'Current price for Grade 60 reinforcement steel',
    category: 'prices',
    tags: ['steel', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-3',
    titleAr: 'سعر طوب الأسمنت',
    titleEn: 'Cement Blocks Price',
    valueAr: '0.8 - 1.2 درهم/قطعة',
    valueEn: '0.8 - 1.2 AED/piece',
    descriptionAr: 'سعر طوب الأسمنت الأبيض المقاس القياسي',
    descriptionEn: 'Price for standard size white cement blocks',
    category: 'prices',
    tags: ['blocks', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-4',
    titleAr: 'سعر الأسمنت',
    titleEn: 'Cement Price',
    valueAr: '15 - 18 درهم/كيس (50 كجم)',
    valueEn: '15 - 18 AED/bag (50 kg)',
    descriptionAr: 'سعر شيكارة الأسمنت البورتلاندي',
    descriptionEn: 'Price for Portland cement bags',
    category: 'prices',
    tags: ['cement', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-5',
    titleAr: 'سعر الرمل',
    titleEn: 'Sand Price',
    valueAr: '40 - 60 درهم/م³',
    valueEn: '40 - 60 AED/m³',
    descriptionAr: 'سعر الرمل النظيف للخلطات الخرسانية',
    descriptionEn: 'Price for clean sand for concrete mixes',
    category: 'prices',
    tags: ['sand', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-6',
    titleAr: 'سعر الركام (الحصى)',
    titleEn: 'Aggregate Price',
    valueAr: '50 - 80 درهم/م³',
    valueEn: '50 - 80 AED/m³',
    descriptionAr: 'سعر الركام الصخري للخلطات الخرسانية',
    descriptionEn: 'Price for rock aggregate for concrete mixes',
    category: 'prices',
    tags: ['aggregate', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-7',
    titleAr: 'سعر الجبس بورد',
    titleEn: 'Gypsum Board Price',
    valueAr: '25 - 40 درهم/لوح',
    valueEn: '25 - 40 AED/sheet',
    descriptionAr: 'سعر ألواح الجبس بورد القياسية',
    descriptionEn: 'Price for standard gypsum board sheets',
    category: 'prices',
    tags: ['gypsum', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'price-8',
    titleAr: 'سعر البلاط السيراميك',
    titleEn: 'Ceramic Tiles Price',
    valueAr: '40 - 150 درهم/م²',
    valueEn: '40 - 150 AED/m²',
    descriptionAr: 'سعر بلاط السيراميك حسب الجودة والتصميم',
    descriptionEn: 'Price for ceramic tiles depending on quality and design',
    category: 'prices',
    tags: ['tiles', 'price', 'materials'],
    icon: <DollarSign className="w-5 h-5" />
  }
];

// Category configuration
const CATEGORY_CONFIG = {
  concrete: {
    labelAr: 'الخرسانة',
    labelEn: 'Concrete',
    color: 'bg-blue-500/20 text-blue-400',
    borderColor: 'border-blue-500/30',
    icon: <Layers className="w-4 h-4" />
  },
  steel: {
    labelAr: 'الحديد',
    labelEn: 'Steel',
    color: 'bg-orange-500/20 text-orange-400',
    borderColor: 'border-orange-500/30',
    icon: <Hammer className="w-4 h-4" />
  },
  loads: {
    labelAr: 'الأحمال',
    labelEn: 'Loads',
    color: 'bg-green-500/20 text-green-400',
    borderColor: 'border-green-500/30',
    icon: <ArrowDownNarrowWide className="w-4 h-4" />
  },
  foundations: {
    labelAr: 'الأساسات',
    labelEn: 'Foundations',
    color: 'bg-purple-500/20 text-purple-400',
    borderColor: 'border-purple-500/30',
    icon: <Building className="w-4 h-4" />
  },
  prices: {
    labelAr: 'الأسعار',
    labelEn: 'Prices',
    color: 'bg-yellow-500/20 text-yellow-400',
    borderColor: 'border-yellow-500/30',
    icon: <DollarSign className="w-4 h-4" />
  }
};

export function KnowledgePage() {
  const { language, isRTL } = useApp();
  const { t } = useTranslation(language);
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('concrete');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filter knowledge items
  const filteredItems = useMemo(() => {
    return KNOWLEDGE_DATA.filter(item => {
      const matchesSearch = 
        item.titleAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.valueAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.valueEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);
  
  // Group items by category for tabs
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, KnowledgeItem[]> = {
      concrete: [],
      steel: [],
      loads: [],
      foundations: [],
      prices: []
    };
    
    filteredItems.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });
    
    return grouped;
  }, [filteredItems]);
  
  // Copy to clipboard
  const handleCopy = async (item: KnowledgeItem) => {
    const text = language === 'ar' 
      ? `${item.titleAr}: ${item.valueAr}\n${item.descriptionAr}`
      : `${item.titleEn}: ${item.valueEn}\n${item.descriptionEn}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      toast({
        title: language === 'ar' ? 'تم النسخ' : 'Copied',
        description: language === 'ar' ? 'تم نسخ المعلومات إلى الحافظة' : 'Information copied to clipboard'
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: t.error,
        description: language === 'ar' ? 'فشل في نسخ المحتوى' : 'Failed to copy content',
        variant: 'destructive'
      });
    }
  };
  
  // Render knowledge card
  const renderKnowledgeCard = (item: KnowledgeItem) => {
    const config = CATEGORY_CONFIG[item.category];
    const isCopied = copiedId === item.id;
    
    return (
      <Card 
        key={item.id}
        className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all group ${config.borderColor}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                {item.icon || <Building2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-white text-sm line-clamp-1">
                  {language === 'ar' ? item.titleAr : item.titleEn}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-0.5">
                  {config.icon && <span className="inline-block me-1">{config.icon}</span>}
                  {language === 'ar' ? config.labelAr : config.labelEn}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 flex-shrink-0 ${isCopied ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}
              onClick={() => handleCopy(item)}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Value */}
          <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
            <p className="text-white font-mono text-lg text-center">
              {language === 'ar' ? item.valueAr : item.valueEn}
            </p>
          </div>
          
          {/* Description */}
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
            {language === 'ar' ? item.descriptionAr : item.descriptionEn}
          </p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs bg-slate-700/50 text-slate-400 hover:text-slate-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render tab content
  const renderTabContent = (category: keyof typeof CATEGORY_CONFIG) => {
    const items = itemsByCategory[category] || [];
    const config = CATEGORY_CONFIG[category];
    
    return (
      <TabsContent value={category} className="mt-0">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className={`inline-flex p-4 rounded-full ${config.color} mb-4`}>
              <Search className="w-8 h-8" />
            </div>
            <p className="text-slate-400">
              {language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results found'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {items.map(renderKnowledgeCard)}
            </div>
          </ScrollArea>
        )}
      </TabsContent>
    );
  };
  
  // Stats
  const stats = {
    total: KNOWLEDGE_DATA.length,
    concrete: KNOWLEDGE_DATA.filter(i => i.category === 'concrete').length,
    steel: KNOWLEDGE_DATA.filter(i => i.category === 'steel').length,
    loads: KNOWLEDGE_DATA.filter(i => i.category === 'loads').length,
    foundations: KNOWLEDGE_DATA.filter(i => i.category === 'foundations').length,
    prices: KNOWLEDGE_DATA.filter(i => i.category === 'prices').length
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            {language === 'ar' ? 'قاعدة المعرفة' : 'Knowledge Base'}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' 
              ? 'مرجع شامل لأكواد ومواصفات البناء في الإمارات'
              : 'Comprehensive reference for UAE building codes and specifications'}
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">{language === 'ar' ? 'إجمالي' : 'Total'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Layers className="w-3 h-3 text-blue-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.concrete}</p>
            <p className="text-xs text-slate-400">{language === 'ar' ? 'خرسانة' : 'Concrete'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Hammer className="w-3 h-3 text-orange-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.steel}</p>
            <p className="text-xs text-slate-400">{language === 'ar' ? 'حديد' : 'Steel'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowDownNarrowWide className="w-3 h-3 text-green-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.loads}</p>
            <p className="text-xs text-slate-400">{language === 'ar' ? 'أحمال' : 'Loads'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building className="w-3 h-3 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.foundations}</p>
            <p className="text-xs text-slate-400">{language === 'ar' ? 'أساسات' : 'Found.'}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-yellow-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats.prices}</p>
            <p className="text-xs text-slate-400">{language === 'ar' ? 'أسعار' : 'Prices'}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={language === 'ar' ? 'ابحث في قاعدة المعرفة...' : 'Search knowledge base...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder={language === 'ar' ? 'جميع الفئات' : 'All Categories'} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  {config.icon}
                  {language === 'ar' ? config.labelAr : config.labelEn}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 bg-slate-900/50 border border-slate-800 p-1 h-auto">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 data-[state=active]:bg-slate-800 data-[state=active]:text-white"
            >
              {config.icon}
              <span className="text-xs sm:text-sm">
                {language === 'ar' ? config.labelAr : config.labelEn}
              </span>
              <Badge 
                variant="secondary" 
                className="h-4 min-w-4 px-1 text-[10px] bg-slate-700/50 text-slate-400"
              >
                {itemsByCategory[key]?.length || 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {renderTabContent('concrete')}
        {renderTabContent('steel')}
        {renderTabContent('loads')}
        {renderTabContent('foundations')}
        {renderTabContent('prices')}
      </Tabs>
      
      {/* Footer Note */}
      <Card className="bg-slate-900/30 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-white text-sm font-medium">
                {language === 'ar' ? 'ملاحظة هامة' : 'Important Note'}
              </h4>
              <p className="text-slate-400 text-xs mt-1">
                {language === 'ar' 
                  ? 'القيم المذكورة هي للإرشاد العام فقط. يرجى الرجوع للكود الإماراتي للبناء والمواصفات الرسمية للحصول على القيم الدقيقة.'
                  : 'Values mentioned are for general guidance only. Please refer to UAE Building Code and official specifications for accurate values.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
