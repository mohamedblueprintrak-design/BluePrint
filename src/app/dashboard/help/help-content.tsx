'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Settings,
  Shield,
} from 'lucide-react';
import { useApp } from '@/context/app-context';

const helpCategories = [
  {
    title: 'البدء السريع',
    icon: Book,
    articles: [
      { title: 'كيفية إنشاء حساب جديد', link: '#' },
      { title: 'التعرف على واجهة النظام', link: '#' },
      { title: 'إنشاء أول مشروع لك', link: '#' },
      { title: 'إضافة أعضاء الفريق', link: '#' },
    ],
  },
  {
    title: 'إدارة المشاريع',
    icon: FileText,
    articles: [
      { title: 'إنشاء وتعديل المشاريع', link: '#' },
      { title: 'إدارة المهام والأنشطة', link: '#' },
      { title: 'تتبع التقدم والمواعيد', link: '#' },
      { title: 'تقارير الموقع اليومية', link: '#' },
    ],
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    articles: [
      { title: 'إعدادات الحساب الشخصي', link: '#' },
      { title: 'إدارة الصلاحيات والأدوار', link: '#' },
      { title: 'تخصيص النظام', link: '#' },
      { title: 'النسخ الاحتياطي', link: '#' },
    ],
  },
  {
    title: 'الأمان والخصوصية',
    icon: Shield,
    articles: [
      { title: 'حماية حسابك', link: '#' },
      { title: 'التحقق بخطوتين', link: '#' },
      { title: 'سياسة الخصوصية', link: '#' },
      { title: 'إدارة البيانات', link: '#' },
    ],
  },
];

const faqs = [
  {
    question: 'كيف يمكنني إعادة تعيين كلمة المرور؟',
    answer:
      'يمكنك إعادة تعيين كلمة المرور من صفحة تسجيل الدخول بالضغط على "نسيت كلمة المرور" وإدخال بريدك الإلكتروني. سيتم إرسال رابط لإعادة تعيين كلمة المرور.',
  },
  {
    question: 'كيف أضيف مستخدمين جدد للفريق؟',
    answer:
      'من صفحة الفريق، اضغط على "إضافة عضو" وأدخل بيانات المستخدم الجديد. يمكنك تحديد دوره وصلاحياته في النظام.',
  },
  {
    question: 'هل يمكنني تصدير البيانات من النظام؟',
    answer:
      'نعم، يمكنك تصدير البيانات بتنسيقات متعددة (Excel, PDF, CSV) من معظم صفحات النظام باستخدام زر التصدير.',
  },
  {
    question: 'كيف أحصل على دعم فني؟',
    answer:
      'يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف. فريق الدعم متاح من الأحد إلى الخميس، من 9 صباحاً حتى 5 مساءً.',
  },
  {
    question: 'هل بياناتي آمنة؟',
    answer:
      'نعم، نستخدم أحدث تقنيات التشفير والأمان لحماية بياناتك. يتم عمل نسخ احتياطي يومي وتخزين البيانات في سيرفرات آمنة.',
  },
];

export default function HelpPage() {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{isAr ? 'مركز المساعدة' : 'Help Center'}</h1>
        <p className="text-gray-500">{isAr ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?'}</p>
      </div>

      {/* Search */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={isAr ? 'ابحث في مركز المساعدة...' : 'Search help center...'}
              className="pr-12 py-6 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Book className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">{isAr ? 'الدليل الشامل' : 'User Guide'}</h3>
            <p className="text-sm text-gray-500">{isAr ? 'تعلم جميع الميزات' : 'Learn all features'}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Video className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">{isAr ? 'فيديوهات تعليمية' : 'Video Tutorials'}</h3>
            <p className="text-sm text-gray-500">{isAr ? 'شروحات مصورة' : 'Visual guides'}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">{isAr ? 'المجتمع' : 'Community'}</h3>
            <p className="text-sm text-gray-500">{isAr ? 'اطرح سؤالك' : 'Ask your question'}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Mail className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">{isAr ? 'تواصل معنا' : 'Contact Us'}</h3>
            <p className="text-sm text-gray-500">{isAr ? 'دعم مباشر' : 'Direct support'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {helpCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, i) => (
                    <li key={i}>
                      <a
                        href={article.link}
                        className="flex items-center justify-between text-gray-600 hover:text-blue-600 transition-colors py-1"
                      >
                        <span>{article.title}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            {isAr ? 'الأسئلة الشائعة' : 'FAQs'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-right">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{isAr ? 'لم تجد ما تبحث عنه؟' : "Didn't find what you're looking for?"}</h3>
            <p className="text-gray-600 mb-4">{isAr ? 'فريق الدعم الفني جاهز لمساعدتك' : 'Our support team is ready to help'}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default">
                <Mail className="w-4 h-4 ml-2" />
                support@blueprint.com
              </Button>
              <Button variant="outline">
                <Phone className="w-4 h-4 ml-2" />
                +966 11 XXX XXXX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
