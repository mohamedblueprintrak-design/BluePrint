#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

output_path = '/home/z/my-project/download/BluePrint_Master_Roadmap.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='BluePrint_Master_Roadmap',
    author='Z.ai',
    creator='Z.ai',
    subject='Master Development Roadmap for BluePrint Engineering Consultancy SaaS'
)

# Styles
title_style = ParagraphStyle(
    'ArabicTitle',
    fontName='Microsoft YaHei',
    fontSize=28,
    leading=36,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#1a365d'),
    spaceAfter=20
)
heading1_style = ParagraphStyle(
    'ArabicHeading1',
    fontName='Microsoft YaHei',
    fontSize=18,
    leading=26,
    alignment=TA_RIGHT,
    textColor=colors.HexColor('#2c5282'),
    spaceBefore=20,
    spaceAfter=12
)
heading2_style = ParagraphStyle(
    'ArabicHeading2',
    fontName='Microsoft YaHei',
    fontSize=14,
    leading=22,
    alignment=TA_RIGHT,
    textColor=colors.HexColor('#3182ce'),
    spaceBefore=15,
    spaceAfter=8
)
body_style = ParagraphStyle(
    'ArabicBody',
    fontName='SimHei',
    fontSize=11,
    leading=20,
    alignment=TA_RIGHT,
    textColor=colors.HexColor('#2d3748'),
    spaceBefore=6,
    spaceAfter=6,
    wordWrap='CJK'
)
th_style = ParagraphStyle(
    'th',
    fontName='Microsoft YaHei',
    fontSize=10,
    alignment=TA_CENTER,
    textColor=colors.white
)
td_style = ParagraphStyle(
    'td',
    fontName='SimHei',
    fontSize=10,
    alignment=TA_CENTER,
    wordWrap='CJK'
)
td_style_small = ParagraphStyle(
    'td_small',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    wordWrap='CJK'
)
td_style_en = ParagraphStyle(
    'td_en',
    fontName='Times New Roman',
    fontSize=10,
    alignment=TA_CENTER
)
subtitle_style = ParagraphStyle(
    'Subtitle',
    fontName='SimHei',
    fontSize=16,
    leading=24,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#4a5568')
)
english_subtitle_style = ParagraphStyle(
    'EnglishSubtitle',
    fontName='Times New Roman',
    fontSize=14,
    leading=20,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#718096')
)
author_style = ParagraphStyle(
    'Author',
    fontName='SimHei',
    fontSize=12,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#718096')
)
date_style = ParagraphStyle(
    'Date',
    fontName='SimHei',
    fontSize=11,
    leading=16,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#a0aec0')
)
caption_style = ParagraphStyle(
    'Caption',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#718096')
)
status_complete = ParagraphStyle(
    'StatusComplete',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#276749')
)
status_partial = ParagraphStyle(
    'StatusPartial',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#B7791F')
)
status_missing = ParagraphStyle(
    'StatusMissing',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#C53030')
)

story = []

# =================== COVER PAGE ===================
story.append(Spacer(1, 80))
story.append(Paragraph('خارطة طريق التطوير الشاملة', title_style))
story.append(Spacer(1, 15))
story.append(Paragraph('BluePrint Engineering Consultancy SaaS', title_style))
story.append(Spacer(1, 30))
story.append(Paragraph('Master Development Roadmap', subtitle_style))
story.append(Spacer(1, 20))
story.append(Paragraph('Phase 1: Discovery & Gap Analysis', english_subtitle_style))
story.append(Spacer(1, 80))
story.append(Paragraph('تحليل الفجوات ومقارنة الوضع الحالي بالوضع المستهدف', subtitle_style))
story.append(Spacer(1, 100))
story.append(Paragraph('إعداد: BluePrint Ultimate AI Engineering Architect', author_style))
story.append(Paragraph('مارس 2026', date_style))
story.append(PageBreak())

# =================== EXECUTIVE SUMMARY ===================
story.append(Paragraph('الملخص التنفيذي', heading1_style))
story.append(Paragraph(
    'يقدم هذا التقرير تحليلاً شاملاً لمنصة BluePrint وهي منصة SaaS متكاملة لإدارة مكاتب الاستشارات الهندسية. '
    'تم فحص المستودع بشكل عميق لتحديد الحالة الحالية لكل ميزة مقارنة بالحالة المستهدفة. '
    'يغطي التحليل ستة محاور رئيسية: المساعد الهندسي الذكي، أدوات الإشراف الميداني، نظام التحكم في المستندات، '
    'إدارة المشاريع، بوابات المستخدمين، والبنية التحتية الأساسية. تم تصنيف كل ميزة إلى: مكتملة أو جزئية أو مفقودة، '
    'مع توصيات واضحة للأولويات وخطط التنفيذ.',
    body_style
))
story.append(Spacer(1, 15))

# =================== SECTION 1: AI ENGINEERING ASSISTANT ===================
story.append(Paragraph('1. المساعد الهندسي الذكي', heading1_style))
story.append(Paragraph('1.1 الحالة الحالية مقابل المستهدفة', heading2_style))

ai_data = [
    [Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الحالة الحالية</b>', th_style), Paragraph('<b>الحالة المستهدفة</b>', th_style), Paragraph('<b>الفجوة</b>', th_style)],
    [Paragraph('واجهة الدردشة الذكية', td_style), Paragraph('مكتمل', status_complete), Paragraph('محادثات متعددة، سياق هندسي', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('نماذج AI المتعددة', td_style), Paragraph('مكتمل', status_complete), Paragraph('Gemini, GPT-4, DeepSeek, Mistral', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('استخراج BOQ من الرسومات', td_style), Paragraph('مفقود', status_missing), Paragraph('OCR + AI لاستخراج الكميات', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('التقارير التلقائية', td_style), Paragraph('جزئي', status_partial), Paragraph('AI يولد تقارير من البيانات', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
    [Paragraph('تحليل الرسومات الهندسية', td_style), Paragraph('مفقود', status_missing), Paragraph('قراءة CAD/PDF واستخراج البيانات', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
]
ai_table = Table(ai_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 3.5*cm])
ai_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
]))
story.append(ai_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 1: تحليل فجوات المساعد الهندسي الذكي', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph('1.2 التوصيات', heading2_style))
story.append(Paragraph(
    '<b>أولوية عالية:</b> بناء نظام استخراج BOQ من الرسومات باستخدام OCR و AI. يتطلب تكامل مع مكتبات معالجة الصور '
    'مثل Tesseract أو خدمات Vision API. يجب أن يدعم النظام قراءة الرسومات الهندسية بتنسيقات PDF و DWG و DXF.',
    body_style
))
story.append(Paragraph(
    '<b>أولوية متوسطة:</b> تطوير نظام التقارير التلقائية الذي يستخدم AI لتحليل البيانات وإنشاء تقارير احترافية. '
    'يشمل ذلك تقارير تقدم المشاريع، التقارير المالية، وتقارير الجودة.',
    body_style
))
story.append(Spacer(1, 15))

# =================== SECTION 2: SITE SUPERVISION TOOLS ===================
story.append(Paragraph('2. أدوات الإشراف الميداني', heading1_style))
story.append(Paragraph('2.1 الحالة الحالية مقابل المستهدفة', heading2_style))

site_data = [
    [Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الحالة الحالية</b>', th_style), Paragraph('<b>الحالة المستهدفة</b>', th_style), Paragraph('<b>الفجوة</b>', th_style)],
    [Paragraph('نظام العيوب (Snagging)', td_style), Paragraph('مكتمل', status_complete), Paragraph('تتبع كامل مع الصور والموقع', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('اليوميات الميدانية', td_style), Paragraph('مكتمل', status_complete), Paragraph('تسجيل يومي، الطقس، العمال', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('نماذج الفحص المتنقلة', td_style), Paragraph('مفقود', status_missing), Paragraph('نماذج responsive، عمل offline', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('تكامل GPS والخرائط', td_style), Paragraph('مفقود', status_missing), Paragraph('تتبع المواقع على الخريطة', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('تطبيق الهاتف المحمول', td_style), Paragraph('مفقود', status_missing), Paragraph('React Native أو Flutter', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
]
site_table = Table(site_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 3.5*cm])
site_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#276749')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
]))
story.append(site_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 2: تحليل فجوات أدوات الإشراف الميداني', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph('2.2 التوصيات', heading2_style))
story.append(Paragraph(
    '<b>أولوية عالية:</b> تطوير تطبيق الهاتف المحمول باستخدام React Native أو Flutter. يجب أن يدعم العمل بدون اتصال (Offline) '
    'للمواقع البعيدة، مع مزامنة تلقائية عند الاتصال. يتضمن كاميرا مدمجة لالتقاط الصور وتسجيل الملاحظات الصوتية.',
    body_style
))
story.append(Paragraph(
    '<b>أولوية متوسطة:</b> بناء نظام نماذج الفحص المتنقلة مع قوالب قابلة للتخصيص لكل نوع من أنواع الفحص: '
    'فحص الخرسانة، فحص التشطيبات، فحص الأمان، فحص MEP.',
    body_style
))
story.append(Spacer(1, 15))

story.append(PageBreak())

# =================== SECTION 3: DOCUMENT CONTROL ===================
story.append(Paragraph('3. نظام التحكم في المستندات', heading1_style))
story.append(Paragraph('3.1 الحالة الحالية مقابل المستهدفة', heading2_style))

doc_data = [
    [Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الحالة الحالية</b>', th_style), Paragraph('<b>الحالة المستهدفة</b>', th_style), Paragraph('<b>الفجوة</b>', th_style)],
    [Paragraph('إدارة المستندات', td_style), Paragraph('مكتمل', status_complete), Paragraph('رفع، تصنيف، إصدارات', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('نظام المراسلات', td_style), Paragraph('مفقود', status_missing), Paragraph('وارد/صادر، تتبع، إقرارات', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('إدارة الإصدارات', td_style), Paragraph('جزئي', status_partial), Paragraph('تاريخ الإصدارات، مقارنة', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
    [Paragraph('سير عمل الموافقات', td_style), Paragraph('جزئي', status_partial), Paragraph('سلسلة موافقات، توقيعات', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
    [Paragraph('تكامل CAD/Revit', td_style), Paragraph('مفقود', status_missing), Paragraph('معاينة وفتح الملفات الهندسية', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
]
doc_table = Table(doc_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 3.5*cm])
doc_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#744210')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
]))
story.append(doc_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 3: تحليل فجوات نظام التحكم في المستندات', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph('3.2 التوصيات', heading2_style))
story.append(Paragraph(
    '<b>أولوية عالية:</b> بناء نظام المراسلات (Transmittal System) الكامل مع دعم الرسائل الواردة والصادرة، '
    'تتبع حالة التسليم، إقرارات الاستلام، وربط المراسلات بالمشاريع والعقود.',
    body_style
))
story.append(Paragraph(
    '<b>أولوية متوسطة:</b> تطوير واجهة لسير عمل الموافقات باستخدام نماذج Workflow الموجودة في قاعدة البيانات. '
    'يتضمن إشعارات بالموافقات المعلقة، سجل الموافقات، والتوقيعات الإلكترونية.',
    body_style
))
story.append(Spacer(1, 15))

# =================== SECTION 4: PROJECT MANAGEMENT ===================
story.append(Paragraph('4. إدارة المشاريع', heading1_style))
story.append(Paragraph('4.1 الحالة الحالية مقابل المستهدفة', heading2_style))

pm_data = [
    [Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الحالة الحالية</b>', th_style), Paragraph('<b>الحالة المستهدفة</b>', th_style), Paragraph('<b>الفجوة</b>', th_style)],
    [Paragraph('إدارة المشاريع الأساسية', td_style), Paragraph('مكتمل', status_complete), Paragraph('CRUD كامل، مراحل، ميزانيات', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('المعالم الرئيسية', td_style), Paragraph('جزئي', status_partial), Paragraph('تتبع المعالم، التقدم', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
    [Paragraph('مخطط Gantt', td_style), Paragraph('مفقود', status_missing), Paragraph('عرض زمني تفاعلي، CPM', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('إدارة الموارد', td_style), Paragraph('جزئي', status_partial), Paragraph('مواد، عمالة، معدات', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
    [Paragraph('سجل المخاطر', td_style), Paragraph('مفقود', status_missing), Paragraph('تحليل، تخفيف، متابعة', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('RFI Management', td_style), Paragraph('مفقود', status_missing), Paragraph('طلب معلومات، تتبع', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
]
pm_table = Table(pm_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 3.5*cm])
pm_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#553C9A')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
]))
story.append(pm_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 4: تحليل فجوات إدارة المشاريع', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph('4.2 التوصيات', heading2_style))
story.append(Paragraph(
    '<b>أولوية عالية:</b> بناء مخطط Gantt التفاعلي باستخدام مكتبات مثل React-Gantt-Chart أو Bryntum Gantt. '
    'يجب أن يدعم السحب والإفلات، تعديل المهام، عرض المسار الحرج، وربط المعالم بعضها ببعض.',
    body_style
))
story.append(Paragraph(
    '<b>أولوية عالية:</b> إنشاء نظام سجل المخاطر مع تحليل المخاطر الكمية والنوعية، خطط التخفيف، '
    'والمتابعة الدورية. يجب ربطه بالمشاريع والمهام والموارد.',
    body_style
))
story.append(Spacer(1, 15))

story.append(PageBreak())

# =================== SECTION 5: PORTALS ===================
story.append(Paragraph('5. بوابات المستخدمين', heading1_style))
story.append(Paragraph('5.1 الحالة الحالية مقابل المستهدفة', heading2_style))

portal_data = [
    [Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الحالة الحالية</b>', th_style), Paragraph('<b>الحالة المستهدفة</b>', th_style), Paragraph('<b>الفجوة</b>', th_style)],
    [Paragraph('إدارة العملاء', td_style), Paragraph('مكتمل', status_complete), Paragraph('ملفات، مشاريع، فواتير', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('بوابة العميل', td_style), Paragraph('مفقود', status_missing), Paragraph('عرض التقدم، التقارير، الملفات', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('بوابة المقاول', td_style), Paragraph('مفقود', status_missing), Paragraph('RFI، مواد، تقدم', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('صلاحيات الوصول', td_style), Paragraph('جزئي', status_partial), Paragraph('أدوار متعددة، حدود واضحة', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
]
portal_table = Table(portal_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 3.5*cm])
portal_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2B6CB0')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
]))
story.append(portal_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 5: تحليل فجوات بوابات المستخدمين', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph('5.2 التوصيات', heading2_style))
story.append(Paragraph(
    '<b>أولوية متوسطة:</b> بناء بوابة العميل بواجهة مبسطة تعرض تقدم المشروع، التقارير، والملفات المشتركة. '
    'يجب أن تكون للقراءة فقط مع إمكانية التواصل عبر الرسائل.',
    body_style
))
story.append(Paragraph(
    '<b>أولوية متوسطة:</b> تطوير بوابة المقاول التي تتيح تقديم طلبات المعلومات (RFI)، '
    'عرض جداول الكميات، وتحميل المستندات المطلوبة.',
    body_style
))
story.append(Spacer(1, 15))

# =================== SECTION 6: INFRASTRUCTURE ===================
story.append(Paragraph('6. البنية التحتية الأساسية', heading1_style))
story.append(Paragraph('6.1 الحالة الحالية مقابل المستهدفة', heading2_style))

infra_data = [
    [Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الحالة الحالية</b>', th_style), Paragraph('<b>الحالة المستهدفة</b>', th_style), Paragraph('<b>الفجوة</b>', th_style)],
    [Paragraph('نظام المصادقة', td_style), Paragraph('مكتمل', status_complete), Paragraph('JWT + OAuth، أدوار', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('قاعدة البيانات', td_style), Paragraph('مكتمل', status_complete), Paragraph('35+ نموذج، Prisma ORM', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('Multi-tenancy', td_style), Paragraph('مكتمل', status_complete), Paragraph('عزل المنظمات، اشتراكات', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('API Routes', td_style), Paragraph('مكتمل', status_complete), Paragraph('RESTful endpoints', td_style_small), Paragraph('لا توجد', td_style)],
    [Paragraph('نظام الدفع', td_style), Paragraph('مفقود', status_missing), Paragraph('Stripe/PayPal integration', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
    [Paragraph('الإشعارات الفورية', td_style), Paragraph('جزئي', status_partial), Paragraph('WebSocket، Push، Email', td_style_small), Paragraph('متوسطة - يحتاج تطوير', td_style)],
    [Paragraph('الاختبارات', td_style), Paragraph('مفقود', status_missing), Paragraph('Unit, Integration, E2E', td_style_small), Paragraph('كاملة - يحتاج بناء', td_style)],
]
infra_table = Table(infra_data, colWidths=[3.5*cm, 2.5*cm, 4.5*cm, 3.5*cm])
infra_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A365D')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
]))
story.append(infra_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 6: تحليل فجوات البنية التحتية', caption_style))
story.append(Spacer(1, 12))

story.append(Paragraph('6.2 التوصيات', heading2_style))
story.append(Paragraph(
    '<b>أولوية حرجة:</b> تكامل نظام الدفع Stripe لتحصيل الاشتراكات. يتضمن خطط الأسعار، الفواتير التلقائية، '
    'إدارة البطاقات، والتعامل مع حالات الفشل والاسترداد.',
    body_style
))
story.append(Paragraph(
    '<b>أولوية عالية:</b> بناء نظام اختبارات شامل باستخدام Jest و React Testing Library و Playwright. '
    'استهداف تغطية 80% على الأقل مع اختبارات الوحدة والتكامل وE2E.',
    body_style
))
story.append(Spacer(1, 15))

story.append(PageBreak())

# =================== SECTION 7: PRIORITY MATRIX ===================
story.append(Paragraph('7. مصفوفة الأولويات', heading1_style))
story.append(Paragraph('7.1 تصنيف المهام حسب الأولوية', heading2_style))

priority_data = [
    [Paragraph('<b>الأولوية</b>', th_style), Paragraph('<b>الميزة</b>', th_style), Paragraph('<b>الجهد</b>', th_style), Paragraph('<b>الأثر</b>', th_style), Paragraph('<b>الإطار الزمني</b>', th_style)],
    [Paragraph('حرجة', ParagraphStyle('crit', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#C53030'))), Paragraph('نظام الدفع Stripe', td_style), Paragraph('عالي', td_style), Paragraph('حرج', td_style), Paragraph('2-3 أسابيع', td_style)],
    [Paragraph('حرجة', ParagraphStyle('crit2', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#C53030'))), Paragraph('الاختبارات الشاملة', td_style), Paragraph('عالي', td_style), Paragraph('حرج', td_style), Paragraph('3-4 أسابيع', td_style)],
    [Paragraph('عالية', ParagraphStyle('high', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#C05621'))), Paragraph('مخطط Gantt', td_style), Paragraph('عالي', td_style), Paragraph('عالي', td_style), Paragraph('2-3 أسابيع', td_style)],
    [Paragraph('عالية', ParagraphStyle('high2', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#C05621'))), Paragraph('سجل المخاطر', td_style), Paragraph('متوسط', td_style), Paragraph('عالي', td_style), Paragraph('1-2 أسبوع', td_style)],
    [Paragraph('عالية', ParagraphStyle('high3', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#C05621'))), Paragraph('نظام المراسلات', td_style), Paragraph('متوسط', td_style), Paragraph('عالي', td_style), Paragraph('2 أسبوع', td_style)],
    [Paragraph('متوسطة', ParagraphStyle('med', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#2B6CB0'))), Paragraph('استخراج BOQ بالـ AI', td_style), Paragraph('عالي', td_style), Paragraph('عالي', td_style), Paragraph('3-4 أسابيع', td_style)],
    [Paragraph('متوسطة', ParagraphStyle('med2', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#2B6CB0'))), Paragraph('تطبيق الموبايل', td_style), Paragraph('عالي جداً', td_style), Paragraph('عالي', td_style), Paragraph('6-8 أسابيع', td_style)],
    [Paragraph('متوسطة', ParagraphStyle('med3', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#2B6CB0'))), Paragraph('بوابة العميل', td_style), Paragraph('متوسط', td_style), Paragraph('متوسط', td_style), Paragraph('1-2 أسبوع', td_style)],
    [Paragraph('منخفضة', ParagraphStyle('low', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#38A169'))), Paragraph('بوابة المقاول', td_style), Paragraph('متوسط', td_style), Paragraph('متوسط', td_style), Paragraph('1-2 أسبوع', td_style)],
    [Paragraph('منخفضة', ParagraphStyle('low2', fontName='SimHei', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#38A169'))), Paragraph('سير العمل الموافقات', td_style), Paragraph('متوسط', td_style), Paragraph('متوسط', td_style), Paragraph('2 أسبوع', td_style)],
]
priority_table = Table(priority_data, colWidths=[2*cm, 3.5*cm, 2*cm, 2*cm, 3*cm])
priority_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FED7D7')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FED7D7')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FEEBC8')),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#FEEBC8')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#FEEBC8')),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#BEE3F8')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.HexColor('#BEE3F8')),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#BEE3F8')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.HexColor('#C6F6D5')),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#C6F6D5')),
]))
story.append(priority_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 7: مصفوفة الأولويات للتطوير', caption_style))
story.append(Spacer(1, 18))

# =================== SECTION 8: SUMMARY ===================
story.append(Paragraph('8. ملخص الفجوات', heading1_style))

summary_data = [
    [Paragraph('<b>التصنيف</b>', th_style), Paragraph('<b>مكتمل</b>', th_style), Paragraph('<b>جزئي</b>', th_style), Paragraph('<b>مفقود</b>', th_style)],
    [Paragraph('المساعد الهندسي الذكي', td_style), Paragraph('2', td_style_en), Paragraph('1', td_style_en), Paragraph('2', td_style_en)],
    [Paragraph('الإشراف الميداني', td_style), Paragraph('2', td_style_en), Paragraph('0', td_style_en), Paragraph('3', td_style_en)],
    [Paragraph('التحكم في المستندات', td_style), Paragraph('1', td_style_en), Paragraph('2', td_style_en), Paragraph('2', td_style_en)],
    [Paragraph('إدارة المشاريع', td_style), Paragraph('1', td_style_en), Paragraph('2', td_style_en), Paragraph('3', td_style_en)],
    [Paragraph('بوابات المستخدمين', td_style), Paragraph('1', td_style_en), Paragraph('1', td_style_en), Paragraph('2', td_style_en)],
    [Paragraph('البنية التحتية', td_style), Paragraph('4', td_style_en), Paragraph('1', td_style_en), Paragraph('2', td_style_en)],
    [Paragraph('<b>المجموع</b>', ParagraphStyle('total', fontName='Microsoft YaHei', fontSize=10, alignment=TA_CENTER)), Paragraph('<b>11</b>', ParagraphStyle('total_num', fontName='Times New Roman', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor('#276749'))), Paragraph('<b>7</b>', ParagraphStyle('total_num2', fontName='Times New Roman', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor('#B7791F'))), Paragraph('<b>14</b>', ParagraphStyle('total_num3', fontName='Times New Roman', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor('#C53030')))],
]
summary_table = Table(summary_data, colWidths=[4*cm, 3*cm, 3*cm, 3*cm])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.HexColor('#E6F2FF')),
]))
story.append(summary_table)
story.append(Spacer(1, 6))
story.append(Paragraph('جدول 8: ملخص حالات الفجوات', caption_style))
story.append(Spacer(1, 18))

# =================== SECTION 9: NEXT STEPS ===================
story.append(Paragraph('9. الخطوات التالية', heading1_style))
story.append(Paragraph(
    'بناءً على هذا التحليل الشامل، أنتظر موافقتك على خارطة الطريق قبل البدء في PHASE 2: The Atomic Build Loop. '
    'سيتم تنفيذ المهام ملفاً واحداً في كل مرة مع ضمان الاستقرار والربط الصحيح مع المكونات الموجودة.',
    body_style
))
story.append(Spacer(1, 12))
story.append(Paragraph('<b>⚠️ نقطة التوقف:</b> أنتظر موافقتك على خارطة الطريق قبل البدء في البرمجة.', body_style))
story.append(Spacer(1, 30))
story.append(Paragraph('تم إعداد هذا التقرير بواسطة BluePrint Ultimate AI Engineering Architect', ParagraphStyle('footer', fontName='SimHei', fontSize=10, alignment=TA_CENTER, textColor=colors.HexColor('#a0aec0'))))

# Build PDF
doc.build(story)
print(f"PDF created successfully: {output_path}")
