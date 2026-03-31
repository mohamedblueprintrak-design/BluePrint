import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isDemoUser, DEMO_DATA } from '../utils/demo-config';

const success = (data: any) => NextResponse.json({ success: true, data });
const error = (message: string, code = 'ERROR', status = 400) =>
  NextResponse.json({ success: false, error: { code, message } }, { status });

// Demo data for site visit reports
const DEMO_SITE_VISIT_REPORTS = [
  {
    id: 'demo-svr-001',
    projectId: 'demo-project-001',
    reportDate: '2024-11-15T10:00:00.000Z',
    plotNumber: 'PN-4521-RAK',
    clientName: 'شركة التطوير العقاري',
    consultantName: 'مكتب المهندس أحمد الاستشاري',
    caseType: 'BUILDING_PERMIT',
    otherDescription: '',
    municipality: 'RAK',
    department: 'هندسة البناء',
    generalDescription: 'زيارة ميدانية لمعاينة موقع المشروع والتأكد من مطابقة المخططات المعتمدة للواقع. تم فحص الحدود والارتدادات وحالة البناء الحالي.',
    boundaryGateDescription: 'الحدود واضحة ومحددة بعلامات خرسانية. يوجد بوابة رئيسية من الحديد المطاوع بعرض 4 أمتار. حالة البوابة جيدة.',
    neighbourSetbackDescription: 'الارتدادات مطابقة للمخطط المعتمد. لا يوجد تعدي على ارتدادات الجيران. المسافة الجانبية 3م والخلفية 5م.',
    buildingDescription: 'الهيكل الخرساني مكتمل بنسبة 80%. أعمال البلوكات جارية في الطابق الثاني. حالة البناء جيدة بشكل عام.',
    boundaryGatePhotos: [],
    neighbourSetbackPhotos: [],
    buildingPhotos: [],
    preparedById: 'demo-user-001',
    approvedById: null,
    status: 'SUBMITTED',
    notes: 'يحتاج متابعة لأعمال التشطيبات',
    createdAt: '2024-11-15T10:00:00.000Z',
    updatedAt: '2024-11-15T10:00:00.000Z',
    project: { name: 'برج الأعمال التجاري' },
  },
  {
    id: 'demo-svr-002',
    projectId: 'demo-project-002',
    reportDate: '2024-11-20T14:30:00.000Z',
    plotNumber: 'PN-7834-RAK',
    clientName: 'مؤسسة البناء الحديث',
    consultantName: 'شركة الخليج للاستشارات الهندسية',
    caseType: 'STRUCTURAL_INSPECTION',
    otherDescription: '',
    municipality: 'RAK',
    department: 'الرقابة الإنشائية',
    generalDescription: 'زيارة تفتيش إنشائي دوري للتأكد من جودة تنفيذ الأعمال الإنشائية والمواد المستخدمة.',
    boundaryGateDescription: 'الحدود محددة جيداً. البوابة المؤقتة بحالة متوسطة تحتاج صيانة.',
    neighbourSetbackDescription: 'تم التأكد من الارتدادات. جميع المسافات مطابقة لرخصة البناء.',
    buildingDescription: 'أعمال الأساسات مكتملة. بدء أعمال الهيكل الخرساني للأرضي. تم فحص عينات الخرسانة والنتائج إيجابية.',
    boundaryGatePhotos: [],
    neighbourSetbackPhotos: [],
    buildingPhotos: [],
    preparedById: 'demo-user-001',
    approvedById: 'demo-admin-001',
    status: 'APPROVED',
    notes: '',
    createdAt: '2024-11-20T14:30:00.000Z',
    updatedAt: '2024-11-21T09:00:00.000Z',
    project: { name: 'مجمع الفلل السكني' },
  },
  {
    id: 'demo-svr-003',
    projectId: 'demo-project-001',
    reportDate: '2024-12-01T09:00:00.000Z',
    plotNumber: 'PN-4521-RAK',
    clientName: 'شركة التطوير العقاري',
    consultantName: 'مكتب المهندس أحمد الاستشاري',
    caseType: 'FINAL_INSPECTION',
    otherDescription: '',
    municipality: 'RAK',
    department: 'هندسة البناء',
    generalDescription: 'زيارة معاينة نهائية قبل إصدار شهادة الإنجاز. تم فحص جميع عناصر المشروع.',
    boundaryGateDescription: 'تم تركيب البوابة النهائية. الحدود مرئية ومحددة بوضوح.',
    neighbourSetbackDescription: 'جميع الارتدادات مطابقة. لا يوجد أي مخالفات.',
    buildingDescription: 'جميع أعمال البناء والتشطيبات مكتملة. المشروع جاهز للاستلام.',
    boundaryGatePhotos: [],
    neighbourSetbackPhotos: [],
    buildingPhotos: [],
    preparedById: 'demo-admin-001',
    approvedById: null,
    status: 'DRAFT',
    notes: 'في انتظار موافقة البلدية النهائية',
    createdAt: '2024-12-01T09:00:00.000Z',
    updatedAt: '2024-12-01T09:00:00.000Z',
    project: { name: 'برج الأعمال التجاري' },
  },
];

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');

  // Demo mode
  if (isDemoUser(user.id)) {
    let filtered = [...DEMO_SITE_VISIT_REPORTS];
    if (projectId) filtered = filtered.filter((r) => r.projectId === projectId);
    if (status) filtered = filtered.filter((r) => r.status === status);
    return success(filtered);
  }

  try {
    const { db } = await import('@/lib/db');

    const whereClause: any = { project: { organizationId: user.organizationId } };
    if (projectId) whereClause.projectId = projectId;
    if (status) whereClause.status = status;

    const reports = await db.siteVisitReport.findMany({
      where: whereClause,
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return success(reports.map((r: any) => ({ ...r, projectName: r.project?.name })));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  // Demo mode - simulate creation
  if (isDemoUser(user.id)) {
    try {
      const body = await request.json();
      const {
        projectId,
        plotNumber,
        clientName,
        consultantName,
        caseType,
        otherDescription,
        municipality,
        department,
        generalDescription,
        boundaryGateDescription,
        neighbourSetbackDescription,
        buildingDescription,
        boundaryGatePhotos,
        neighbourSetbackPhotos,
        buildingPhotos,
        notes,
      } = body;

      if (!projectId) return error('المشروع مطلوب');

      const newReport = {
        id: `demo-svr-${Date.now()}`,
        projectId,
        reportDate: new Date().toISOString(),
        plotNumber: plotNumber || '',
        clientName: clientName || '',
        consultantName: consultantName || '',
        caseType: caseType || 'BUILDING_PERMIT',
        otherDescription: otherDescription || '',
        municipality: municipality || 'RAK',
        department: department || '',
        generalDescription: generalDescription || '',
        boundaryGateDescription: boundaryGateDescription || '',
        neighbourSetbackDescription: neighbourSetbackDescription || '',
        buildingDescription: buildingDescription || '',
        boundaryGatePhotos: boundaryGatePhotos || [],
        neighbourSetbackPhotos: neighbourSetbackPhotos || [],
        buildingPhotos: buildingPhotos || [],
        preparedById: user.id,
        approvedById: null,
        status: 'DRAFT',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: DEMO_DATA.projects.find((p) => p.id === projectId)
          ? { name: DEMO_DATA.projects.find((p) => p.id === projectId)!.name }
          : { name: 'مشروع' },
      };

      DEMO_SITE_VISIT_REPORTS.unshift(newReport);
      return success(newReport);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
    }
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const {
      projectId,
      plotNumber,
      clientName,
      consultantName,
      caseType,
      otherDescription,
      municipality,
      department,
      generalDescription,
      boundaryGateDescription,
      neighbourSetbackDescription,
      buildingDescription,
      boundaryGatePhotos,
      neighbourSetbackPhotos,
      buildingPhotos,
      notes,
    } = body;

    if (!projectId) return error('المشروع مطلوب');

    // Verify project belongs to user's organization
    const project = await db.project.findUnique({
      where: { id: projectId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!project) return error('المشروع غير موجود', 'NOT_FOUND', 404);

    const report = await db.siteVisitReport.create({
      data: {
        projectId,
        plotNumber: plotNumber || null,
        clientName: clientName || null,
        consultantName: consultantName || null,
        caseType: caseType || null,
        otherDescription: otherDescription || null,
        municipality: municipality || 'RAK',
        department: department || null,
        generalDescription: generalDescription || null,
        boundaryGateDescription: boundaryGateDescription || null,
        neighbourSetbackDescription: neighbourSetbackDescription || null,
        buildingDescription: buildingDescription || null,
        boundaryGatePhotos: boundaryGatePhotos || undefined,
        neighbourSetbackPhotos: neighbourSetbackPhotos || undefined,
        buildingPhotos: buildingPhotos || undefined,
        preparedById: user.id,
        status: 'DRAFT',
        notes: notes || null,
      },
      include: { project: { select: { name: true } } },
    });

    return success(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  if (isDemoUser(user.id)) {
    try {
      const body = await request.json();
      const { id, ...updateData } = body;

      if (!id) return error('معرف التقرير مطلوب');

      const index = DEMO_SITE_VISIT_REPORTS.findIndex((r) => r.id === id);
      if (index === -1) return error('التقرير غير موجود', 'NOT_FOUND', 404);

      DEMO_SITE_VISIT_REPORTS[index] = {
        ...DEMO_SITE_VISIT_REPORTS[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      return success(DEMO_SITE_VISIT_REPORTS[index]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
    }
  }

  try {
    const { db } = await import('@/lib/db');
    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) return error('معرف التقرير مطلوب');

    // Verify report belongs to user's organization
    const existing = await db.siteVisitReport.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } },
    });
    if (!existing || existing.project.organizationId !== user.organizationId) {
      return error('التقرير غير موجود', 'NOT_FOUND', 404);
    }

    const report = await db.siteVisitReport.update({
      where: { id },
      data: {
        ...updateFields,
        updatedAt: new Date(),
      },
      include: { project: { select: { name: true } } },
    });

    return success(report);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !user.organizationId) return error('غير مصرح', 'UNAUTHORIZED', 401);

  if (isDemoUser(user.id)) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error('معرف التقرير مطلوب');

    const index = DEMO_SITE_VISIT_REPORTS.findIndex((r) => r.id === id);
    if (index === -1) return error('التقرير غير موجود', 'NOT_FOUND', 404);

    DEMO_SITE_VISIT_REPORTS.splice(index, 1);
    return success({ message: 'تم الحذف بنجاح' });
  }

  try {
    const { db } = await import('@/lib/db');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return error('معرف التقرير مطلوب');

    // Verify report belongs to user's organization
    const existing = await db.siteVisitReport.findUnique({
      where: { id },
      include: { project: { select: { organizationId: true } } },
    });
    if (!existing || existing.project.organizationId !== user.organizationId) {
      return error('التقرير غير موجود', 'NOT_FOUND', 404);
    }

    await db.siteVisitReport.delete({ where: { id } });
    return success({ message: 'تم الحذف بنجاح' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return error(message || 'خطأ في الخادم', 'SERVER_ERROR', 500);
  }
}
