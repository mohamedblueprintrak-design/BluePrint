// BluePrint - Translation System

export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    // App
    appName: 'BluePrint',
    appSubtitle: 'استشارات هندسية',
    appDescription: 'نظام متكامل لإدارة مكاتب الاستشارات الهندسية',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'حساب جديد',
    logout: 'تسجيل خروج',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    email: 'البريد الإلكتروني',
    fullName: 'الاسم الكامل',
    confirmPassword: 'تأكيد كلمة المرور',
    rememberMe: 'تذكرني',
    forgotPassword: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    loginSuccess: 'تم تسجيل الدخول بنجاح',
    loginError: 'بيانات الدخول غير صحيحة',
    registerSuccess: 'تم إنشاء الحساب بنجاح',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    projects: 'المشاريع',
    clients: 'العملاء',
    proposals: 'العروض',
    invoices: 'الفواتير',
    tasks: 'المهام',
    hr: 'الموارد البشرية',
    suppliers: 'الموردين',
    inventory: 'المخازن',
    contracts: 'العقود',
    reports: 'التقارير',
    siteDiary: 'يومية الموقع',
    documents: 'المستندات',
    knowledge: 'قاعدة المعرفة',
    aiChat: 'المساعد بلو',
    modelTest: 'اختبار النماذج',
    notifications: 'الإشعارات',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    admin: 'الإدارة',
    analytics: 'التحليلات',
    activities: 'النشاطات',
    
    // Common Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    search: 'بحث',
    filter: 'فلتر',
    export: 'تصدير',
    import: 'استيراد',
    print: 'طباعة',
    refresh: 'تحديث',
    reset: 'إعادة تعيين',
    submit: 'إرسال',
    upload: 'رفع',
    download: 'تنزيل',
    view: 'عرض',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    all: 'الكل',
    actions: 'الإجراءات',
    type: 'النوع',
    status: 'الحالة',
    date: 'التاريخ',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    active: 'نشط',
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    total: 'الإجمالي',
    error: 'خطأ',
    successSave: 'تم الحفظ بنجاح',
    successDelete: 'تم الحذف بنجاح',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    
    // Dashboard
    overview: 'نظرة عامة',
    quickStats: 'إحصائيات سريعة',
    activeProjects: 'المشاريع النشطة',
    pendingInvoices: 'الفواتير المعلقة',
    pendingTasks: 'المهام المعلقة',
    openDefects: 'العيوب المفتوحة',
    totalClients: 'العملاء',
    totalSuppliers: 'الموردين',
    totalEmployees: 'الموظفين',
    revenue: 'الإيرادات',
    expenses: 'المصروفات',
    profit: 'الربح',
    
    // Projects
    project: 'مشروع',
    newProject: 'مشروع جديد',
    projectNumber: 'رقم المشروع',
    projectName: 'اسم المشروع',
    projectLocation: 'الموقع',
    projectType: 'نوع المشروع',
    projectManager: 'مدير المشروع',
    projectStatus: 'حالة المشروع',
    projectProgress: 'تقدم المشروع',
    projectTeam: 'فريق المشروع',
    projectBudget: 'ميزانية المشروع',
    projectTimeline: 'الجدول الزمني',
    projectFiles: 'ملفات المشروع',
    
    // Clients
    client: 'عميل',
    newClient: 'عميل جديد',
    clientName: 'اسم العميل',
    clientType: 'نوع العميل',
    contactPerson: 'الشخص المسؤول',
    contactInfo: 'معلومات الاتصال',
    
    // Invoices
    invoice: 'فاتورة',
    newInvoice: 'فاتورة جديدة',
    invoiceNumber: 'رقم الفاتورة',
    invoiceDate: 'تاريخ الفاتورة',
    issueDate: 'تاريخ الإصدار',
    dueDate: 'تاريخ الاستحقاق',
    subtotal: 'المبلغ قبل الضريبة',
    vat: 'الضريبة (5%)',
    discount: 'الخصم',
    grandTotal: 'الإجمالي',
    amountPaid: 'المبلغ المدفوع',
    amountDue: 'المبلغ المستحق',
    
    // Tasks
    task: 'مهمة',
    newTask: 'مهمة جديدة',
    taskTitle: 'عنوان المهمة',
    taskDescription: 'الوصف',
    taskPriority: 'الأولوية',
    taskStatus: 'الحالة',
    assignedTo: 'مسند إلى',
    dueDateTask: 'الموعد النهائي',
    progress: 'نسبة الإنجاز',
    overdue: 'متأخر',
    
    // HR
    employee: 'موظف',
    employees: 'الموظفين',
    attendance: 'الحضور',
    leaves: 'الإجازات',
    salaries: 'الرواتب',
    checkIn: 'تسجيل دخول',
    checkOut: 'تسجيل خروج',
    workHours: 'ساعات العمل',
    leaveType: 'نوع الإجازة',
    leaveRequest: 'طلب إجازة',
    reason: 'السبب',
    daysCount: 'عدد الأيام',
    approve: 'موافقة',
    reject: 'رفض',
    presentToday: 'حاضرون اليوم',
    onLeave: 'في إجازة',
    totalSalaries: 'إجمالي الرواتب',
    
    // Suppliers
    supplier: 'مورد',
    newSupplier: 'مورد جديد',
    supplierName: 'اسم المورد',
    supplierType: 'نوع المورد',
    rating: 'التقييم',
    
    // Inventory
    material: 'مادة',
    newMaterial: 'مادة جديدة',
    materialName: 'اسم المادة',
    materialCode: 'كود المادة',
    unit: 'الوحدة',
    unitPrice: 'سعر الوحدة',
    currentStock: 'المخزون الحالي',
    minStock: 'الحد الأدنى',
    maxStock: 'الحد الأقصى',
    stockIn: 'وارد',
    stockOut: 'صادر',
    stockMovement: 'حركة المخزون',
    
    // Contracts
    contract: 'عقد',
    newContract: 'عقد جديد',
    contractNumber: 'رقم العقد',
    contractTitle: 'عنوان العقد',
    contractValue: 'قيمة العقد',
    startDate: 'تاريخ البداية',
    endDate: 'تاريخ النهاية',
    
    // Site Diary
    siteReport: 'تقرير الموقع',
    weather: 'الطقس',
    temperature: 'درجة الحرارة',
    workersCount: 'عدد العمال',
    workDescription: 'العمل المنجز',
    workArea: 'منطقة العمل',
    issues: 'المشاكل',
    safetyIssues: 'مشاكل السلامة',
    nextSteps: 'الخطوات القادمة',
    summary: 'الملخص',
    equipment: 'المعدات المستخدمة',
    materials: 'المواد المستلمة',
    photos: 'الصور',
    
    // Settings
    companySettings: 'إعدادات الشركة',
    financialSettings: 'الإعدادات المالية',
    appearance: 'المظهر',
    language: 'اللغة',
    theme: 'السمة',
    darkMode: 'الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    systemDefault: 'إعدادات النظام',
    
    // Notifications
    notificationSettings: 'إعدادات الإشعارات',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    pushNotifications: 'الإشعارات الفورية',
    
    // Additional Status
    inactive: 'غير نشط',
    cancelled: 'ملغي',
    draft: 'مسودة',
    sent: 'مُرسلة',
    paid: 'مدفوعة',
    unpaid: 'غير مدفوعة',
    
    // Priority
    priority: 'الأولوية',
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجل',
    
    // Severity
    severity: 'الخطورة',
    critical: 'حرج',
    
    // Roles
    engineer: 'مهندس',
    draftsman: 'راسم',
    accountant: 'محاسب',
    viewer: 'مشاهد',
    
    // Messages
    successUpdate: 'تم التحديث بنجاح',
    yes: 'نعم',
    no: 'لا',
    success: 'تمت العملية بنجاح',
    
    // Time
    yesterday: 'أمس',
    thisYear: 'هذه السنة',
    lastWeek: 'الأسبوع الماضي',
    lastMonth: 'الشهر الماضي',
    
    // AI
    askBlu: 'اسأل بلو...',
    send: 'إرسال',
    typing: 'يكتب...',
    selectModel: 'اختر النموذج',
    response: 'الاستجابة',
    responseTime: 'وقت الاستجابة',
    tokens: 'الرموز',
    
    // Export
    exportPDF: 'تصدير PDF',
    exportWord: 'تصدير Word',
    exportExcel: 'تصدير Excel',
    sendWhatsApp: 'إرسال واتساب',
    
    // Knowledge Base
    uaeCodes: 'أكواد الإمارات',
    concrete: 'الخرسانة',
    steel: 'الحديد',
    loads: 'الأحمال',
    foundations: 'الأساسات',
    prices: 'الأسعار',
    
    // Misc
    name: 'الاسم',
    amount: 'المبلغ',
    phone: 'الهاتف',
    address: 'العنوان',
    taxNumber: 'الرقم الضريبي',
    notes: 'ملاحظات',
    description: 'الوصف',
    category: 'الفئة',
    tags: 'الوسوم',
  },
  
  en: {
    // App
    appName: 'BluePrint',
    appSubtitle: 'Engineering Consultancy',
    appDescription: 'Comprehensive Engineering Consultancy Management System',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    email: 'Email',
    fullName: 'Full Name',
    confirmPassword: 'Confirm Password',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginSuccess: 'Login successful',
    loginError: 'Invalid credentials',
    registerSuccess: 'Account created successfully',
    
    // Navigation
    dashboard: 'Dashboard',
    projects: 'Projects',
    clients: 'Clients',
    proposals: 'Proposals',
    invoices: 'Invoices',
    tasks: 'Tasks',
    hr: 'Human Resources',
    suppliers: 'Suppliers',
    inventory: 'Inventory',
    contracts: 'Contracts',
    reports: 'Reports',
    siteDiary: 'Site Diary',
    documents: 'Documents',
    knowledge: 'Knowledge Base',
    aiChat: 'Blu Assistant',
    modelTest: 'Model Testing',
    notifications: 'Notifications',
    settings: 'Settings',
    profile: 'Profile',
    admin: 'Admin',
    analytics: 'Analytics',
    activities: 'Activities',
    
    // Common Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    print: 'Print',
    refresh: 'Refresh',
    reset: 'Reset',
    submit: 'Submit',
    upload: 'Upload',
    download: 'Download',
    view: 'View',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    noData: 'No data available',
    all: 'All',
    actions: 'Actions',
    type: 'Type',
    status: 'Status',
    date: 'Date',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    total: 'Total',
    error: 'Error',
    successSave: 'Saved successfully',
    successDelete: 'Deleted successfully',
    confirmDelete: 'Are you sure you want to delete?',
    
    // Dashboard
    overview: 'Overview',
    quickStats: 'Quick Stats',
    activeProjects: 'Active Projects',
    pendingInvoices: 'Pending Invoices',
    pendingTasks: 'Pending Tasks',
    openDefects: 'Open Defects',
    totalClients: 'Clients',
    totalSuppliers: 'Suppliers',
    totalEmployees: 'Employees',
    revenue: 'Revenue',
    expenses: 'Expenses',
    profit: 'Profit',
    
    // Projects
    project: 'Project',
    newProject: 'New Project',
    projectNumber: 'Project Number',
    projectName: 'Project Name',
    projectLocation: 'Location',
    projectType: 'Project Type',
    projectManager: 'Project Manager',
    projectStatus: 'Project Status',
    projectProgress: 'Project Progress',
    projectTeam: 'Project Team',
    projectBudget: 'Project Budget',
    projectTimeline: 'Timeline',
    projectFiles: 'Project Files',
    
    // Clients
    client: 'Client',
    newClient: 'New Client',
    clientName: 'Client Name',
    clientType: 'Client Type',
    contactPerson: 'Contact Person',
    contactInfo: 'Contact Info',
    
    // Invoices
    invoice: 'Invoice',
    newInvoice: 'New Invoice',
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    subtotal: 'Subtotal',
    vat: 'VAT (5%)',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    amountPaid: 'Amount Paid',
    amountDue: 'Amount Due',
    
    // Tasks
    task: 'Task',
    newTask: 'New Task',
    taskTitle: 'Task Title',
    taskDescription: 'Description',
    taskPriority: 'Priority',
    taskStatus: 'Status',
    assignedTo: 'Assigned To',
    dueDateTask: 'Due Date',
    progress: 'Progress',
    overdue: 'Overdue',
    
    // HR
    employee: 'Employee',
    employees: 'Employees',
    attendance: 'Attendance',
    leaves: 'Leaves',
    salaries: 'Salaries',
    checkIn: 'Check In',
    checkOut: 'Check Out',
    workHours: 'Work Hours',
    leaveType: 'Leave Type',
    leaveRequest: 'Leave Request',
    reason: 'Reason',
    daysCount: 'Days',
    approve: 'Approve',
    reject: 'Reject',
    presentToday: 'Present Today',
    onLeave: 'On Leave',
    totalSalaries: 'Total Salaries',
    
    // Suppliers
    supplier: 'Supplier',
    newSupplier: 'New Supplier',
    supplierName: 'Supplier Name',
    supplierType: 'Supplier Type',
    rating: 'Rating',
    
    // Inventory
    material: 'Material',
    newMaterial: 'New Material',
    materialName: 'Material Name',
    materialCode: 'Material Code',
    unit: 'Unit',
    unitPrice: 'Unit Price',
    currentStock: 'Current Stock',
    minStock: 'Min Stock',
    maxStock: 'Max Stock',
    stockIn: 'Stock In',
    stockOut: 'Stock Out',
    stockMovement: 'Stock Movement',
    
    // Contracts
    contract: 'Contract',
    newContract: 'New Contract',
    contractNumber: 'Contract Number',
    contractTitle: 'Contract Title',
    contractValue: 'Contract Value',
    startDate: 'Start Date',
    endDate: 'End Date',
    
    // Site Diary
    siteReport: 'Site Report',
    weather: 'Weather',
    temperature: 'Temperature',
    workersCount: 'Workers Count',
    workDescription: 'Work Done',
    workArea: 'Work Area',
    issues: 'Issues',
    safetyIssues: 'Safety Issues',
    nextSteps: 'Next Steps',
    summary: 'Summary',
    equipment: 'Equipment Used',
    materials: 'Materials Received',
    photos: 'Photos',
    
    // Settings
    companySettings: 'Company Settings',
    financialSettings: 'Financial Settings',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    systemDefault: 'System Default',
    
    // Notifications
    notificationSettings: 'Notification Settings',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    
    // Additional Status
    inactive: 'Inactive',
    cancelled: 'Cancelled',
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    unpaid: 'Unpaid',
    
    // Priority
    priority: 'Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
    
    // Severity
    severity: 'Severity',
    critical: 'Critical',
    
    // Roles
    engineer: 'Engineer',
    draftsman: 'Draftsman',
    accountant: 'Accountant',
    viewer: 'Viewer',
    
    // Messages
    successUpdate: 'Updated successfully',
    yes: 'Yes',
    no: 'No',
    success: 'Operation successful',
    
    // Time
    yesterday: 'Yesterday',
    thisYear: 'This Year',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    
    // AI
    askBlu: 'Ask Blu...',
    send: 'Send',
    typing: 'Typing...',
    selectModel: 'Select Model',
    response: 'Response',
    responseTime: 'Response Time',
    tokens: 'Tokens',
    
    // Export
    exportPDF: 'Export PDF',
    exportWord: 'Export Word',
    exportExcel: 'Export Excel',
    sendWhatsApp: 'Send WhatsApp',
    
    // Knowledge Base
    uaeCodes: 'UAE Codes',
    concrete: 'Concrete',
    steel: 'Steel',
    loads: 'Loads',
    foundations: 'Foundations',
    prices: 'Prices',
    
    // Misc
    name: 'Name',
    amount: 'Amount',
    phone: 'Phone',
    address: 'Address',
    taxNumber: 'Tax Number',
    notes: 'Notes',
    description: 'Description',
    category: 'Category',
    tags: 'Tags',
  }
} as const;

export type TranslationKey = keyof typeof translations.ar;

export function useTranslation(language: Language) {
  // Ensure we have a valid language, default to 'ar' if undefined
  const safeLanguage: Language = language || 'ar';
  const t = translations[safeLanguage];
  
  const formatCurrency = (amount: number, currency: string = 'AED') => {
    const symbols: Record<string, string> = {
      AED: safeLanguage === 'ar' ? 'درهم' : 'AED',
      SAR: safeLanguage === 'ar' ? 'ريال' : 'SAR',
      USD: '$',
      EUR: '€',
      EGP: safeLanguage === 'ar' ? 'ج.م' : 'EGP'
    };
    const symbol = symbols[currency] || currency;
    return safeLanguage === 'ar' 
      ? `${amount.toLocaleString('ar-EG')} ${symbol}`
      : `${symbol}${amount.toLocaleString('en-US')}`;
  };
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString(safeLanguage === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString(safeLanguage === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatNumber = (num: number) => {
    return num.toLocaleString(safeLanguage === 'ar' ? 'ar-EG' : 'en-US');
  };
  
  const formatPercentage = (num: number) => {
    return safeLanguage === 'ar' 
      ? `%${num.toLocaleString('ar-EG')}`
      : `${num.toLocaleString('en-US')}%`;
  };
  
  return { 
    t, 
    formatCurrency, 
    formatDate, 
    formatDateTime, 
    formatNumber,
    formatPercentage,
    isRTL: safeLanguage === 'ar'
  };
}
