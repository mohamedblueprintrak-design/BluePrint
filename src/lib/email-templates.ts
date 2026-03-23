// Email templates for BluePrint SaaS Platform
// All templates are in Arabic as per platform requirements

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Base email template wrapper
function wrapEmailTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .content p {
      color: #374151;
      line-height: 1.8;
      margin-bottom: 16px;
    }
    .info-box {
      background-color: #f3f4f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      color: #1f2937;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .warning {
      background-color: #fef3c7;
      border-right: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
    .success {
      background-color: #d1fae5;
      border-right: 4px solid #10b981;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BluePrint</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} BluePrint - منصة إدارة مكاتب الاستشارات الهندسية</p>
      <p>هذه الرسالة آلية، يرجى عدم الرد عليها مباشرة</p>
    </div>
  </div>
</body>
</html>
  `;
}

export const emailTemplates = {
  /**
   * Welcome email for new users
   */
  welcome: (name: string, loginUrl?: string): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">مرحباً ${name} 👋</h2>
      <p>نرحب بك في منصة <strong>BluePrint</strong> لإدارة مكاتب الاستشارات الهندسية.</p>
      <p>تم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى جميع خدمات المنصة.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">الاسم</span>
          <span class="info-value">${name}</span>
        </div>
      </div>
      <p>يمكنك تسجيل الدخول والبدء باستخدام المنصة فوراً.</p>
      ${loginUrl ? `<a href="${loginUrl}" class="button">تسجيل الدخول</a>` : ''}
      <p>إذا كانت لديك أي استفسارات، فلا تتردد في التواصل معنا.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'مرحباً بك في BluePrint',
      html: wrapEmailTemplate(content, 'مرحباً بك'),
      text: `مرحباً ${name}،\n\nنرحب بك في منصة BluePrint لإدارة مكاتب الاستشارات الهندسية.\n\nتم إنشاء حسابك بنجاح. يمكنك الآن الوصول إلى جميع خدمات المنصة.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Invoice created notification
   */
  invoiceCreated: (
    clientName: string,
    invoiceNumber: string,
    amount: number,
    dueDate?: string,
    invoiceUrl?: string
  ): EmailTemplate => {
    const formattedAmount = new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);

    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">فاتورة جديدة 📄</h2>
      <p>عزيزي/عزيزتي ${clientName}،</p>
      <p>تم إنشاء فاتورة جديدة باسمك في منصة BluePrint.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">رقم الفاتورة</span>
          <span class="info-value">${invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">المبلغ الإجمالي</span>
          <span class="info-value" style="color: #1e40af; font-size: 18px;">${formattedAmount}</span>
        </div>
        ${dueDate ? `
        <div class="info-row">
          <span class="info-label">تاريخ الاستحقاق</span>
          <span class="info-value">${dueDate}</span>
        </div>
        ` : ''}
      </div>
      ${invoiceUrl ? `<a href="${invoiceUrl}" class="button">عرض الفاتورة</a>` : ''}
      <p>يرجى مراجعة الفاتورة وإتمام عملية الدفع في الوقت المحدد.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: `فاتورة جديدة: ${invoiceNumber}`,
      html: wrapEmailTemplate(content, 'فاتورة جديدة'),
      text: `عزيزي/عزيزتي ${clientName}،\n\nتم إنشاء فاتورة جديدة باسمك.\n\nرقم الفاتورة: ${invoiceNumber}\nالمبلغ: ${formattedAmount}\n${dueDate ? `تاريخ الاستحقاق: ${dueDate}\n` : ''}\nيرجى مراجعة الفاتورة وإتمام عملية الدفع.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Task assigned notification
   */
  taskAssigned: (
    userName: string,
    taskTitle: string,
    projectName: string,
    dueDate?: string,
    priority?: string,
    taskUrl?: string
  ): EmailTemplate => {
    const priorityColors: Record<string, string> = {
      urgent: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#16a34a',
    };

    const priorityLabels: Record<string, string> = {
      urgent: 'عاجل جداً',
      high: 'عالي',
      medium: 'متوسط',
      low: 'منخفض',
    };

    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">مهمة جديدة 📋</h2>
      <p>مرحباً ${userName}،</p>
      <p>تم تعيين مهمة جديدة لك في منصة BluePrint.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">عنوان المهمة</span>
          <span class="info-value">${taskTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">المشروع</span>
          <span class="info-value">${projectName}</span>
        </div>
        ${priority ? `
        <div class="info-row">
          <span class="info-label">الأولوية</span>
          <span class="info-value" style="color: ${priorityColors[priority] || '#374151'};">${priorityLabels[priority] || priority}</span>
        </div>
        ` : ''}
        ${dueDate ? `
        <div class="info-row">
          <span class="info-label">تاريخ الاستحقاق</span>
          <span class="info-value">${dueDate}</span>
        </div>
        ` : ''}
      </div>
      ${taskUrl ? `<a href="${taskUrl}" class="button">عرض المهمة</a>` : ''}
      <p>يرجى مراجعة المهمة والبدء في تنفيذها.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: `مهمة جديدة: ${taskTitle}`,
      html: wrapEmailTemplate(content, 'مهمة جديدة'),
      text: `مرحباً ${userName}،\n\nتم تعيين مهمة جديدة لك.\n\nعنوان المهمة: ${taskTitle}\nالمشروع: ${projectName}\n${priority ? `الأولوية: ${priorityLabels[priority] || priority}\n` : ''}${dueDate ? `تاريخ الاستحقاق: ${dueDate}\n` : ''}\nيرجى مراجعة المهمة والبدء في تنفيذها.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Leave approved notification
   */
  leaveApproved: (
    userName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    daysCount: number
  ): EmailTemplate => {
    const leaveTypeLabels: Record<string, string> = {
      annual: 'إجازة سنوية',
      sick: 'إجازة مرضية',
      emergency: 'إجازة طارئة',
      maternity: 'إجازة أمومة',
      paternity: 'إجازة أبوة',
      marriage: 'إجازة زواج',
      bereavement: 'إجازة عزاء',
      unpaid: 'إجازة غير مدفوعة',
    };

    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تم الموافقة على طلب الإجازة ✅</h2>
      <p>مرحباً ${userName}،</p>
      <div class="success">
        <strong>تهانينا!</strong> تم الموافقة على طلب الإجازة الخاص بك.
      </div>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">نوع الإجازة</span>
          <span class="info-value">${leaveTypeLabels[leaveType] || leaveType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">من تاريخ</span>
          <span class="info-value">${startDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">إلى تاريخ</span>
          <span class="info-value">${endDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">عدد الأيام</span>
          <span class="info-value">${daysCount} يوم</span>
        </div>
      </div>
      <p>نتمنى لك إجازة سعيدة!</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'تم الموافقة على طلب الإجازة',
      html: wrapEmailTemplate(content, 'الموافقة على الإجازة'),
      text: `مرحباً ${userName}،\n\nتم الموافقة على طلب الإجازة الخاص بك.\n\nنوع الإجازة: ${leaveTypeLabels[leaveType] || leaveType}\nمن: ${startDate}\nإلى: ${endDate}\nعدد الأيام: ${daysCount} يوم\n\nنتمنى لك إجازة سعيدة!\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Leave rejected notification
   */
  leaveRejected: (
    userName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    rejectionReason?: string
  ): EmailTemplate => {
    const leaveTypeLabels: Record<string, string> = {
      annual: 'إجازة سنوية',
      sick: 'إجازة مرضية',
      emergency: 'إجازة طارئة',
      maternity: 'إجازة أمومة',
      paternity: 'إجازة أبوة',
      marriage: 'إجازة زواج',
      bereavement: 'إجازة عزاء',
      unpaid: 'إجازة غير مدفوعة',
    };

    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تم رفض طلب الإجازة ❌</h2>
      <p>مرحباً ${userName}،</p>
      <p>نأسف لإبلاغك بأنه تم رفض طلب الإجازة الخاص بك.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">نوع الإجازة</span>
          <span class="info-value">${leaveTypeLabels[leaveType] || leaveType}</span>
        </div>
        <div class="info-row">
          <span class="info-label">من تاريخ</span>
          <span class="info-value">${startDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">إلى تاريخ</span>
          <span class="info-value">${endDate}</span>
        </div>
      </div>
      ${rejectionReason ? `
      <div class="warning">
        <strong>سبب الرفض:</strong> ${rejectionReason}
      </div>
      ` : ''}
      <p>إذا كان لديك أي استفسارات، يرجى التواصل مع إدارة الموارد البشرية.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'تم رفض طلب الإجازة',
      html: wrapEmailTemplate(content, 'رفض الإجازة'),
      text: `مرحباً ${userName}،\n\nنأسف لإبلاغك بأنه تم رفض طلب الإجازة الخاص بك.\n\nنوع الإجازة: ${leaveTypeLabels[leaveType] || leaveType}\nمن: ${startDate}\nإلى: ${endDate}\n${rejectionReason ? `\nسبب الرفض: ${rejectionReason}\n` : ''}\nإذا كان لديك أي استفسارات، يرجى التواصل مع إدارة الموارد البشرية.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Password reset email
   */
  passwordReset: (userName: string, resetLink: string, expiresInMinutes: number = 30): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">إعادة تعيين كلمة المرور 🔐</h2>
      <p>مرحباً ${userName}،</p>
      <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
      <div class="warning">
        <strong>تنبيه:</strong> ستنتهي صلاحية هذا الرابط خلال ${expiresInMinutes} دقيقة.
      </div>
      <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
      <a href="${resetLink}" class="button">إعادة تعيين كلمة المرور</a>
      <p>إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'إعادة تعيين كلمة المرور',
      html: wrapEmailTemplate(content, 'إعادة تعيين كلمة المرور'),
      text: `مرحباً ${userName}،\n\nتلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.\n\nاضغط على الرابط التالي لإعادة تعيين كلمة المرور:\n${resetLink}\n\nسينتهي هذا الرابط خلال ${expiresInMinutes} دقيقة.\n\nإذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Project assignment notification
   */
  projectAssigned: (
    userName: string,
    projectName: string,
    role?: string,
    projectUrl?: string
  ): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تم إضافتك إلى مشروع جديد 🏗️</h2>
      <p>مرحباً ${userName}،</p>
      <p>تم إضافتك إلى فريق عمل مشروع جديد في منصة BluePrint.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">اسم المشروع</span>
          <span class="info-value">${projectName}</span>
        </div>
        ${role ? `
        <div class="info-row">
          <span class="info-label">دورك في المشروع</span>
          <span class="info-value">${role}</span>
        </div>
        ` : ''}
      </div>
      ${projectUrl ? `<a href="${projectUrl}" class="button">عرض المشروع</a>` : ''}
      <p>يمكنك الآن الوصول إلى جميع تفاصيل المشروع ومتابعة التقدم.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: `تم إضافتك إلى مشروع: ${projectName}`,
      html: wrapEmailTemplate(content, 'مشروع جديد'),
      text: `مرحباً ${userName}،\n\nتم إضافتك إلى فريق عمل مشروع جديد.\n\nاسم المشروع: ${projectName}\n${role ? `دورك في المشروع: ${role}\n` : ''}\nيمكنك الآن الوصول إلى جميع تفاصيل المشروع.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Payment received notification
   */
  paymentReceived: (
    clientName: string,
    invoiceNumber: string,
    amount: number,
    paymentDate: string,
    paymentMethod?: string
  ): EmailTemplate => {
    const formattedAmount = new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
    }).format(amount);

    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تم استلام الدفع 💰</h2>
      <p>عزيزي/عزيزتي ${clientName}،</p>
      <div class="success">
        <strong>شكراً لك!</strong> تم استلام دفعتك بنجاح.
      </div>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">رقم الفاتورة</span>
          <span class="info-value">${invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">المبلغ المدفوع</span>
          <span class="info-value" style="color: #16a34a; font-size: 18px;">${formattedAmount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">تاريخ الدفع</span>
          <span class="info-value">${paymentDate}</span>
        </div>
        ${paymentMethod ? `
        <div class="info-row">
          <span class="info-label">طريقة الدفع</span>
          <span class="info-value">${paymentMethod}</span>
        </div>
        ` : ''}
      </div>
      <p>نشكرك على ثقتك بنا.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: `تم استلام الدفع - الفاتورة ${invoiceNumber}`,
      html: wrapEmailTemplate(content, 'تأكيد الدفع'),
      text: `عزيزي/عزيزتي ${clientName}،\n\nتم استلام دفعتك بنجاح.\n\nرقم الفاتورة: ${invoiceNumber}\nالمبلغ: ${formattedAmount}\nتاريخ الدفع: ${paymentDate}\n${paymentMethod ? `طريقة الدفع: ${paymentMethod}\n` : ''}\nنشكرك على ثقتك بنا.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Task due reminder
   */
  taskDueReminder: (
    userName: string,
    taskTitle: string,
    projectName: string,
    dueDate: string,
    daysRemaining: number,
    taskUrl?: string
  ): EmailTemplate => {
    const isOverdue = daysRemaining < 0;
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تذكير بموعد تسليم المهمة ${isOverdue ? '⚠️' : '⏰'}</h2>
      <p>مرحباً ${userName}،</p>
      ${isOverdue ? `
        <div class="warning">
          <strong>تنبيه!</strong> هذه المهمة متأخرة بمقدار ${Math.abs(daysRemaining)} يوم.
        </div>
      ` : `
        <p>هذا تذكير بموعد تسليم المهمة القادم.</p>
      `}
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">عنوان المهمة</span>
          <span class="info-value">${taskTitle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">المشروع</span>
          <span class="info-value">${projectName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">تاريخ الاستحقاق</span>
          <span class="info-value">${dueDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">الأيام المتبقية</span>
          <span class="info-value" style="color: ${isOverdue ? '#dc2626' : daysRemaining <= 1 ? '#ea580c' : '#16a34a'};">
            ${isOverdue ? `متأخر ${Math.abs(daysRemaining)} يوم` : `${daysRemaining} يوم`}
          </span>
        </div>
      </div>
      ${taskUrl ? `<a href="${taskUrl}" class="button">عرض المهمة</a>` : ''}
      <p>يرجى إعطاء الأولوية لهذه المهمة.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: `تذكير: ${taskTitle} ${isOverdue ? '(متأخر)' : ''}`,
      html: wrapEmailTemplate(content, 'تذكير بمهمة'),
      text: `مرحباً ${userName}،\n\n${isOverdue ? 'تنبيه! هذه المهمة متأخرة.' : 'هذا تذكير بموعد تسليم المهمة القادم.'}\n\nعنوان المهمة: ${taskTitle}\nالمشروع: ${projectName}\nتاريخ الاستحقاق: ${dueDate}\n${isOverdue ? `متأخر ${Math.abs(daysRemaining)} يوم` : `متبقي ${daysRemaining} يوم`}\n\nيرجى إعطاء الأولوية لهذه المهمة.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Email verification template
   */
  emailVerification: (
    userName: string,
    verificationLink: string,
    expiresInHours: number = 24
  ): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تحقق من بريدك الإلكتروني ✉️</h2>
      <p>مرحباً ${userName}،</p>
      <p>شكراً لتسجيلك في منصة <strong>BluePrint</strong>. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.</p>
      <div class="warning">
        <strong>تنبيه:</strong> ستنتهي صلاحية هذا الرابط خلال ${expiresInHours} ساعة.
      </div>
      <p>اضغط على الزر أدناه للتحقق من بريدك الإلكتروني:</p>
      <a href="${verificationLink}" class="button">التحقق من البريد الإلكتروني</a>
      <p style="color: #6b7280; font-size: 14px;">إذا لم تعمل الزر، يمكنك نسخ هذا الرابط ولصقه في المتصفح:</p>
      <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">${verificationLink}</p>
      <p>إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة بأمان.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'تحقق من بريدك الإلكتروني - BluePrint',
      html: wrapEmailTemplate(content, 'التحقق من البريد الإلكتروني'),
      text: `مرحباً ${userName}،\n\nشكراً لتسجيلك في منصة BluePrint.\n\nيرجى التحقق من بريدك الإلكتروني بالضغط على الرابط التالي:\n${verificationLink}\n\nسينتهي هذا الرابط خلال ${expiresInHours} ساعة.\n\nإذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Email verification success template
   */
  emailVerified: (
    userName: string,
    loginUrl?: string
  ): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تم التحقق من بريدك الإلكتروني ✅</h2>
      <p>مرحباً ${userName}،</p>
      <div class="success">
        <strong>تهانينا!</strong> تم التحقق من بريدك الإلكتروني بنجاح.
      </div>
      <p>يمكنك الآن الوصول الكامل إلى جميع ميزات منصة BluePrint.</p>
      ${loginUrl ? `<a href="${loginUrl}" class="button">تسجيل الدخول</a>` : ''}
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'تم التحقق من بريدك الإلكتروني - BluePrint',
      html: wrapEmailTemplate(content, 'تم التحقق من البريد'),
      text: `مرحباً ${userName}،\n\nتم التحقق من بريدك الإلكتروني بنجاح.\n\nيمكنك الآن الوصول الكامل إلى جميع ميزات منصة BluePrint.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Two-Factor Authentication enabled template
   */
  twoFactorEnabled: (
    userName: string
  ): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تم تفعيل المصادقة الثنائية 🔐</h2>
      <p>مرحباً ${userName}،</p>
      <div class="success">
        <strong>تم بنجاح!</strong> تم تفعيل المصادقة الثنائية على حسابك.
      </div>
      <p>حسابك الآن محمي بطريقة إضافية. عند تسجيل الدخول، ستحتاج إلى إدخال الرمز من تطبيق المصادقة الخاص بك.</p>
      <div class="info-box">
        <p style="margin: 0;"><strong>نصائح مهمة:</strong></p>
        <ul style="margin: 10px 0; padding-right: 20px;">
          <li>احتفظ برموز الاسترداد في مكان آمن</li>
          <li>لا تشارك رموز المصادقة مع أي شخص</li>
          <li>إذا فقدت الوصول، استخدم رموز الاسترداد</li>
        </ul>
      </div>
      <p>إذا لم تقم بتفعيل هذه الميزة، يرجى التواصل مع الدعم فوراً.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'تم تفعيل المصادقة الثنائية - BluePrint',
      html: wrapEmailTemplate(content, 'تفعيل المصادقة الثنائية'),
      text: `مرحباً ${userName}،\n\nتم تفعيل المصادقة الثنائية على حسابك بنجاح.\n\nحسابك الآن محمي بطريقة إضافية.\n\nإذا لم تقم بتفعيل هذه الميزة، يرجى التواصل مع الدعم فوراً.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * Two-Factor Authentication code template
   */
  twoFactorCode: (
    userName: string,
    code: string,
    expiresInMinutes: number = 5
  ): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">رمز التحقق الخاص بك 🔑</h2>
      <p>مرحباً ${userName}،</p>
      <p>إليك رمز التحقق الخاص بك:</p>
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
        ${code}
      </div>
      <div class="warning">
        <strong>تنبيه:</strong> سينتهي هذا الرمز خلال ${expiresInMinutes} دقائق.
      </div>
      <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة وتأمين حسابك.</p>
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: `رمز التحقق: ${code} - BluePrint`,
      html: wrapEmailTemplate(content, 'رمز التحقق'),
      text: `مرحباً ${userName}،\n\nرمز التحقق الخاص بك هو: ${code}\n\nسينتهي هذا الرمز خلال ${expiresInMinutes} دقائق.\n\nإذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },

  /**
   * New login notification
   */
  newLoginNotification: (
    userName: string,
    device: string,
    location: string,
    time: string,
    securityUrl?: string
  ): EmailTemplate => {
    const content = `
      <h2 style="margin-top: 0; color: #1f2937;">تسجيل دخول جديد 🖥️</h2>
      <p>مرحباً ${userName}،</p>
      <p>تم تسجيل الدخول إلى حسابك من جهاز جديد.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">الجهاز</span>
          <span class="info-value">${device}</span>
        </div>
        <div class="info-row">
          <span class="info-label">الموقع</span>
          <span class="info-value">${location}</span>
        </div>
        <div class="info-row">
          <span class="info-label">الوقت</span>
          <span class="info-value">${time}</span>
        </div>
      </div>
      <div class="warning">
        <strong>إذا لم تكن أنت:</strong> قد يكون هناك شخص آخر يستخدم حسابك.
      </div>
      ${securityUrl ? `<a href="${securityUrl}" class="button" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);">تأمين حسابي</a>` : ''}
      <p>مع أطيب التحيات،<br>فريق BluePrint</p>
    `;

    return {
      subject: 'تسجيل دخول جديد - BluePrint',
      html: wrapEmailTemplate(content, 'تسجيل دخول جديد'),
      text: `مرحباً ${userName}،\n\nتم تسجيل الدخول إلى حسابك من جهاز جديد.\n\nالجهاز: ${device}\nالموقع: ${location}\nالوقت: ${time}\n\nإذا لم تكن أنت، يرجى تأمين حسابك فوراً.\n\nمع أطيب التحيات،\nفريق BluePrint`,
    };
  },
};

export default emailTemplates;
