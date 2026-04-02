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
    titleEn: 'Quick Start',
    icon: Book,
    articles: [
      { title: 'كيفية إنشاء حساب جديد', titleEn: 'How to create a new account', link: '#' },
      { title: 'التعرف على واجهة النظام', titleEn: 'Getting to know the interface', link: '#' },
      { title: 'إنشاء أول مشروع لك', titleEn: 'Create your first project', link: '#' },
      { title: 'إضافة أعضاء الفريق', titleEn: 'Add team members', link: '#' },
    ],
  },
  {
    title: 'إدارة المشاريع',
    titleEn: 'Project Management',
    icon: FileText,
    articles: [
      { title: 'إنشاء وتعديل المشاريع', titleEn: 'Create and edit projects', link: '#' },
      { title: 'إدارة المهام والأنشطة', titleEn: 'Manage tasks and activities', link: '#' },
      { title: 'تتبع التقدم والمواعيد', titleEn: 'Track progress and deadlines', link: '#' },
      { title: 'تقارير الموقع اليومية', titleEn: 'Daily site reports', link: '#' },
    ],
  },
  {
    title: 'الإعدادات',
    titleEn: 'Settings',
    icon: Settings,
    articles: [
      { title: 'إعدادات الحساب الشخصي', titleEn: 'Account settings', link: '#' },
      { title: 'إدارة الصلاحيات والأدوار', titleEn: 'Manage permissions and roles', link: '#' },
      { title: 'تخصيص النظام', titleEn: 'Customize the system', link: '#' },
      { title: 'النسخ الاحتياطي', titleEn: 'Backup', link: '#' },
    ],
  },
  {
    title: 'الأمان والخصوصية',
    titleEn: 'Security & Privacy',
    icon: Shield,
    articles: [
      { title: 'حماية حسابك', titleEn: 'Protect your account', link: '#' },
      { title: 'التحقق بخطوتين', titleEn: 'Two-factor authentication', link: '#' },
      { title: 'سياسة الخصوصية', titleEn: 'Privacy policy', link: '#' },
      { title: 'إدارة البيانات', titleEn: 'Data management', link: '#' },
    ],
  },
];

const faqs = [
  {
    question: 'كيف يمكنني إعادة تعيين كلمة المرور؟',
    questionEn: 'How can I reset my password?',
    answer: 'يمكنك إعادة تعيين كلمة المرور من صفحة تسجيل الدخول بالضغط على "نسيت كلمة المرور" وإدخال بريدك الإلكتروني.',
    answerEn: 'You can reset your password from the login page by clicking "Forgot Password" and entering your email.',
  },
  {
    question: 'كيف أضيف مستخدمين جدد للفريق؟',
    questionEn: 'How do I add new team members?',
    answer: 'من صفحة الفريق، اضغط على "إضافة عضو" وأدخل بيانات المستخدم الجديد. يمكنك تحديد دوره وصلاحياته.',
    answerEn: 'From the Team page, click "Add Member" and enter the new user details. You can set their role and permissions.',
  },
  {
    question: 'هل يمكنني تصدير البيانات من النظام؟',
    questionEn: 'Can I export data from the system?',
    answer: 'نعم، يمكنك تصدير البيانات بتنسيقات متعددة (Excel, PDF, CSV) من معظم صفحات النظام.',
    answerEn: 'Yes, you can export data in multiple formats (Excel, PDF, CSV) from most system pages.',
  },
  {
    question: 'كيف أحصل على دعم فني؟',
    questionEn: 'How do I get technical support?',
    answer: 'يمكنك التواصل معنا عبر البريد الإلكتروني أو الهاتف. فريق الدعم متاح من الأحد إلى الخميس.',
    answerEn: 'You can contact us via email or phone. Support is available Sunday through Thursday.',
  },
  {
    question: 'هل بياناتي آمنة؟',
    questionEn: 'Is my data secure?',
    answer: 'نعم، نستخدم أحدث تقنيات التشفير والأمان لحماية بياناتك مع نسخ احتياطي يومي.',
    answerEn: 'Yes, we use the latest encryption and security technologies with daily backups.',
  },
];

export default function HelpPage() {
  const { language, isRTL } = useApp();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">{isAr ? 'مركز المساعدة' : 'Help Center'}</h1>
        <p className="text-muted-foreground">{isAr ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?'}</p>
      </div>

      {/* Search */}
      <Card className="max-w-2xl mx-auto bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={isAr ? 'ابحث في مركز المساعدة...' : 'Search help center...'}
              className={`${isRTL ? 'pr-12' : 'pl-12'} py-6 text-lg bg-muted border-border text-foreground`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Book, title: isAr ? 'الدليل الشامل' : 'User Guide', desc: isAr ? 'تعلم جميع الميزات' : 'Learn all features', color: 'text-blue-400' },
          { icon: Video, title: isAr ? 'فيديوهات تعليمية' : 'Video Tutorials', desc: isAr ? 'شروحات مصورة' : 'Visual guides', color: 'text-green-400' },
          { icon: MessageCircle, title: isAr ? 'المجتمع' : 'Community', desc: isAr ? 'اطرح سؤالك' : 'Ask your question', color: 'text-violet-400' },
          { icon: Mail, title: isAr ? 'تواصل معنا' : 'Contact Us', desc: isAr ? 'دعم مباشر' : 'Direct support', color: 'text-amber-400' },
        ].map((item) => (
          <Card key={item.title} className="bg-card border-border hover:border-border transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-2`} />
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {helpCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Icon className="w-5 h-5 text-blue-400" />
                  {isAr ? category.title : category.titleEn}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, i) => (
                    <li key={i}>
                      <a
                        href={article.link}
                        className="flex items-center justify-between text-foreground/80 hover:text-blue-400 transition-colors py-1"
                      >
                        <span>{isAr ? article.title : (article as any).titleEn}</span>
                        <ExternalLink className="w-4 h-4 shrink-0" />
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            {isAr ? 'الأسئلة الشائعة' : 'FAQs'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className={`text-foreground hover:text-blue-400 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {isAr ? faq.question : (faq as any).questionEn}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {isAr ? faq.answer : (faq as any).answerEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">{isAr ? 'لم تجد ما تبحث عنه؟' : "Didn't find what you're looking for?"}</h3>
            <p className="text-muted-foreground mb-4">{isAr ? 'فريق الدعم الفني جاهز لمساعدتك' : 'Our support team is ready to help'}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Mail className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                support@blueprint.com
              </Button>
              <Button variant="outline" className="border-border text-foreground/80 hover:bg-accent">
                <Phone className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                +966 11 XXX XXXX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
