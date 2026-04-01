/**
 * BluePrint API - Error Code System
 *
 * Centralised, categorised error codes with bilingual (Arabic / English)
 * messages. Every error returned by the API references one of these codes
 * so that front-end applications can localise or take programmatic action.
 *
 * @module error-codes
 * @version 1.0.0
 */

// ─────────────────────────────────────────────────────────────────────────────
// Error Code Enum
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Machine-readable error codes grouped by category.
 *
 * Convention: `{CATEGORY}_{SPECIFIC_ERROR}` – all uppercase with underscores.
 */
export enum ErrorCode {
  // ── Authentication ─────────────────────────────────────────────────────
  /** The supplied email / password combination is invalid. */
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  /** The JWT or session token has expired. */
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  /** The user account has been disabled by an administrator. */
  AUTH_ACCOUNT_DISABLED = 'AUTH_ACCOUNT_DISABLED',
  /** Two-factor authentication is required to complete the request. */
  AUTH_2FA_REQUIRED = 'AUTH_2FA_REQUIRED',
  /** The email address has not been verified yet. */
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  /** The chosen password does not meet the strength policy. */
  AUTH_PASSWORD_WEAK = 'AUTH_PASSWORD_WEAK',
  /** Too many authentication attempts; the client is being rate-limited. */
  AUTH_RATE_LIMITED = 'AUTH_RATE_LIMITED',
  /** The supplied token or session is invalid or malformed. */
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  /** The user is already authenticated; the action cannot be repeated. */
  AUTH_ALREADY_AUTHENTICATED = 'AUTH_ALREADY_AUTHENTICATED',

  // ── Validation ─────────────────────────────────────────────────────────
  /** One or more input values failed validation. */
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  /** A required field is missing from the request body. */
  VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD',
  /** The provided email address format is invalid. */
  VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  /** The value does not match the expected format (e.g. UUID, date). */
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  /** A string value exceeds the maximum allowed length. */
  VALIDATION_TOO_LONG = 'VALIDATION_TOO_LONG',
  /** A numeric value is outside the allowed range. */
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',

  // ── Resource ───────────────────────────────────────────────────────────
  /** The requested resource does not exist. */
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  /** A resource with the same unique identifier already exists. */
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  /** The request conflicts with the current state of the resource. */
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  /** The resource has been soft-deleted and is no longer accessible. */
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  /** The resource is locked by another user or process. */
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // ── Permission ─────────────────────────────────────────────────────────
  /** The authenticated user does not have permission for this action. */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** The user's role is insufficient for the requested operation. */
  PERMISSION_INSUFFICIENT_ROLE = 'PERMISSION_INSUFFICIENT_ROLE',
  /** The resource belongs to a different organisation. */
  PERMISSION_WRONG_ORGANIZATION = 'PERMISSION_WRONG_ORGANIZATION',

  // ── Project ────────────────────────────────────────────────────────────
  /** Cannot delete a project that is currently active. */
  PROJECT_CANNOT_DELETE_ACTIVE = 'PROJECT_CANNOT_DELETE_ACTIVE',
  /** The requested status transition is not allowed. */
  PROJECT_INVALID_STATUS_TRANSITION = 'PROJECT_INVALID_STATUS_TRANSITION',
  /** The project budget has been exceeded. */
  PROJECT_BUDGET_EXCEEDED = 'PROJECT_BUDGET_EXCEEDED',
  /** The project has already been archived. */
  PROJECT_ALREADY_ARCHIVED = 'PROJECT_ALREADY_ARCHIVED',
  /** A project with the same code already exists. */
  PROJECT_CODE_EXISTS = 'PROJECT_CODE_EXISTS',

  // ── Invoice ────────────────────────────────────────────────────────────
  /** Cannot modify an invoice that has already been paid. */
  INVOICE_CANNOT_MODIFY_PAID = 'INVOICE_CANNOT_MODIFY_PAID',
  /** The invoice has already been sent to the client. */
  INVOICE_ALREADY_SENT = 'INVOICE_ALREADY_SENT',
  /** The invoice number already exists. */
  INVOICE_NUMBER_EXISTS = 'INVOICE_NUMBER_EXISTS',
  /** Invoice amount cannot be zero or negative. */
  INVOICE_INVALID_AMOUNT = 'INVOICE_INVALID_AMOUNT',
  /** The invoice due date is in the past. */
  INVOICE_PAST_DUE_DATE = 'INVOICE_PAST_DUE_DATE',

  // ── Task ───────────────────────────────────────────────────────────────
  /** The specified task dependency creates a circular reference. */
  TASK_INVALID_DEPENDENCY = 'TASK_INVALID_DEPENDENCY',
  /** The task SLA has been breached. */
  TASK_SLA_BREACHED = 'TASK_SLA_BREACHED',
  /** Cannot delete a task that has uncompleted sub-tasks. */
  TASK_HAS_SUBTASKS = 'TASK_HAS_SUBTASKS',
  /** The task is already assigned to the specified user. */
  TASK_ALREADY_ASSIGNED = 'TASK_ALREADY_ASSIGNED',

  // ── Contract ───────────────────────────────────────────────────────────
  /** The contract has expired. */
  CONTRACT_EXPIRED = 'CONTRACT_EXPIRED',
  /** The contract value exceeds the approved budget. */
  CONTRACT_VALUE_EXCEEDS_BUDGET = 'CONTRACT_VALUE_EXCEEDS_BUDGET',

  // ── Material / Procurement ─────────────────────────────────────────────
  /** Insufficient stock for the requested quantity. */
  MATERIAL_INSUFFICIENT_STOCK = 'MATERIAL_INSUFFICIENT_STOCK',
  /** The purchase order has already been approved. */
  PO_ALREADY_APPROVED = 'PO_ALREADY_APPROVED',
  /** The purchase order has already been received. */
  PO_ALREADY_RECEIVED = 'PO_ALREADY_RECEIVED',

  // ── Leave ──────────────────────────────────────────────────────────────
  /** The employee does not have enough leave balance. */
  LEAVE_INSUFFICIENT_BALANCE = 'LEAVE_INSUFFICIENT_BALANCE',
  /** The leave request overlaps with an existing approved leave. */
  LEAVE_OVERLAP = 'LEAVE_OVERLAP',
  /** The leave request has already been processed. */
  LEAVE_ALREADY_PROCESSED = 'LEAVE_ALREADY_PROCESSED',

  // ── Transmittal ────────────────────────────────────────────────────────
  /** The transmittal reference already exists. */
  TRANSMITTAL_REF_EXISTS = 'TRANSMITTAL_REF_EXISTS',

  // ── Defect ─────────────────────────────────────────────────────────────
  /** The defect severity is not within the allowed range. */
  DEFECT_INVALID_SEVERITY = 'DEFECT_INVALID_SEVERITY',

  // ── System ─────────────────────────────────────────────────────────────
  /** An error occurred while communicating with the database. */
  SYSTEM_DATABASE_ERROR = 'SYSTEM_DATABASE_ERROR',
  /** An error occurred with the caching layer. */
  SYSTEM_CACHE_ERROR = 'SYSTEM_CACHE_ERROR',
  /** An external service (payment, email, AI, etc.) returned an error. */
  SYSTEM_EXTERNAL_SERVICE_ERROR = 'SYSTEM_EXTERNAL_SERVICE_ERROR',
  /** The system is currently under maintenance. */
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  /** A file upload exceeded the maximum allowed size. */
  SYSTEM_FILE_TOO_LARGE = 'SYSTEM_FILE_TOO_LARGE',
  /** The uploaded file type is not supported. */
  SYSTEM_UNSUPPORTED_FILE_TYPE = 'SYSTEM_UNSUPPORTED_FILE_TYPE',
  /** The system has reached its storage limit. */
  SYSTEM_STORAGE_LIMIT = 'SYSTEM_STORAGE_LIMIT',
}

// ─────────────────────────────────────────────────────────────────────────────
// Supported Languages
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedLanguage = 'en' | 'ar';

// ─────────────────────────────────────────────────────────────────────────────
// Error Messages (Bilingual)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps every `ErrorCode` to an object with English and Arabic messages.
 */
export const ErrorMessages: Record<ErrorCode, { en: string; ar: string }> = {
  // ── Authentication ─────────────────────────────────────────────────────
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    en: 'Invalid email or password. Please check your credentials and try again.',
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.',
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    en: 'Your session has expired. Please sign in again.',
    ar: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
  },
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: {
    en: 'Your account has been disabled. Please contact your administrator.',
    ar: 'تم تعطيل حسابك. يرجى الاتصال بالمسؤول.',
  },
  [ErrorCode.AUTH_2FA_REQUIRED]: {
    en: 'Two-factor authentication is required. Please provide your verification code.',
    ar: 'مطلوب المصادقة الثنائية. يرجى تقديم رمز التحقق الخاص بك.',
  },
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: {
    en: 'Your email address has not been verified. Please check your inbox.',
    ar: 'لم يتم التحقق من عنوان بريدك الإلكتروني. يرجى التحقق من صندوق الوارد الخاص بك.',
  },
  [ErrorCode.AUTH_PASSWORD_WEAK]: {
    en: 'The password does not meet the security requirements. Use at least 8 characters with a mix of letters, numbers, and symbols.',
    ar: 'كلمة المرور لا تلبي متطلبات الأمان. استخدم 8 أحرف على الأقل مع مزيج من الأحرف والأرقام والرموز.',
  },
  [ErrorCode.AUTH_RATE_LIMITED]: {
    en: 'Too many authentication attempts. Please wait before trying again.',
    ar: 'محاولات مصادقة كثيرة جدًا. يرجى الانتظار قبل المحاولة مرة أخرى.',
  },
  [ErrorCode.AUTH_INVALID_TOKEN]: {
    en: 'The provided authentication token is invalid or malformed.',
    ar: 'رمز المصادقة المقدم غير صالح أو مشوه.',
  },
  [ErrorCode.AUTH_ALREADY_AUTHENTICATED]: {
    en: 'You are already authenticated. Please sign out before performing this action.',
    ar: 'أنت بالفعل مصادق. يرجى تسجيل الخروج قبل تنفيذ هذا الإجراء.',
  },

  // ── Validation ─────────────────────────────────────────────────────────
  [ErrorCode.VALIDATION_INVALID_INPUT]: {
    en: 'Validation failed. Please check your input and try again.',
    ar: 'فشل التحقق. يرجى التحقق من الإدخال والمحاولة مرة أخرى.',
  },
  [ErrorCode.VALIDATION_MISSING_FIELD]: {
    en: 'A required field is missing from the request.',
    ar: 'حقل مطلوب مفقود من الطلب.',
  },
  [ErrorCode.VALIDATION_INVALID_EMAIL]: {
    en: 'The provided email address is not valid.',
    ar: 'عنوان البريد الإلكتروني المقدم غير صالح.',
  },
  [ErrorCode.VALIDATION_INVALID_FORMAT]: {
    en: 'The value format is invalid.',
    ar: 'تنسيق القيمة غير صالح.',
  },
  [ErrorCode.VALIDATION_TOO_LONG]: {
    en: 'The value exceeds the maximum allowed length.',
    ar: 'القيمة تتجاوز الحد الأقصى للطول المسموح.',
  },
  [ErrorCode.VALIDATION_OUT_OF_RANGE]: {
    en: 'The value is outside the allowed range.',
    ar: 'القيمة خارج النطاق المسموح.',
  },

  // ── Resource ───────────────────────────────────────────────────────────
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    en: 'The requested resource was not found.',
    ar: 'المورد المطلوب غير موجود.',
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    en: 'A resource with this identifier already exists.',
    ar: 'مورد بهذا المعرف موجود بالفعل.',
  },
  [ErrorCode.RESOURCE_CONFLICT]: {
    en: 'The request conflicts with the current state of the resource.',
    ar: 'يتعارض الطلب مع الحالة الحالية للمورد.',
  },
  [ErrorCode.RESOURCE_DELETED]: {
    en: 'The resource has been deleted.',
    ar: 'تم حذف المورد.',
  },
  [ErrorCode.RESOURCE_LOCKED]: {
    en: 'The resource is currently locked and cannot be modified.',
    ar: 'المورد مقفل حاليًا ولا يمكن تعديله.',
  },

  // ── Permission ─────────────────────────────────────────────────────────
  [ErrorCode.PERMISSION_DENIED]: {
    en: 'You do not have permission to perform this action.',
    ar: 'ليس لديك إذن لتنفيذ هذا الإجراء.',
  },
  [ErrorCode.PERMISSION_INSUFFICIENT_ROLE]: {
    en: 'Your role does not have sufficient privileges for this operation.',
    ar: 'دورك ليس لديه صلاحيات كافية لهذه العملية.',
  },
  [ErrorCode.PERMISSION_WRONG_ORGANIZATION]: {
    en: 'This resource belongs to a different organization.',
    ar: 'هذا المورد يتبع منظمة مختلفة.',
  },

  // ── Project ────────────────────────────────────────────────────────────
  [ErrorCode.PROJECT_CANNOT_DELETE_ACTIVE]: {
    en: 'Cannot delete a project that is currently active. Archive it first.',
    ar: 'لا يمكن حذف مشروع نشط حاليًا. قم بأرشفته أولاً.',
  },
  [ErrorCode.PROJECT_INVALID_STATUS_TRANSITION]: {
    en: 'The requested status transition is not allowed for this project.',
    ar: 'انتقال الحالة المطلوب غير مسموح به لهذا المشروع.',
  },
  [ErrorCode.PROJECT_BUDGET_EXCEEDED]: {
    en: 'The project budget has been exceeded. Please review and adjust.',
    ar: 'تم تجاوز ميزانية المشروع. يرجى المراجعة والتعديل.',
  },
  [ErrorCode.PROJECT_ALREADY_ARCHIVED]: {
    en: 'This project has already been archived.',
    ar: 'تم أرشفة هذا المشروع بالفعل.',
  },
  [ErrorCode.PROJECT_CODE_EXISTS]: {
    en: 'A project with this code already exists.',
    ar: 'مشروع بهذا الكود موجود بالفعل.',
  },

  // ── Invoice ────────────────────────────────────────────────────────────
  [ErrorCode.INVOICE_CANNOT_MODIFY_PAID]: {
    en: 'Cannot modify an invoice that has already been paid.',
    ar: 'لا يمكن تعديل فاتورة تم دفعها بالفعل.',
  },
  [ErrorCode.INVOICE_ALREADY_SENT]: {
    en: 'The invoice has already been sent to the client and cannot be edited.',
    ar: 'تم إرسال الفاتورة بالفعل إلى العميل ولا يمكن تعديلها.',
  },
  [ErrorCode.INVOICE_NUMBER_EXISTS]: {
    en: 'An invoice with this number already exists.',
    ar: 'فاتورة بهذا الرقم موجودة بالفعل.',
  },
  [ErrorCode.INVOICE_INVALID_AMOUNT]: {
    en: 'Invoice amount must be greater than zero.',
    ar: 'يجب أن يكون مبلغ الفاتورة أكبر من الصفر.',
  },
  [ErrorCode.INVOICE_PAST_DUE_DATE]: {
    en: 'The invoice due date cannot be in the past.',
    ar: 'لا يمكن أن يكون تاريخ استحقاق الفاتورة في الماضي.',
  },

  // ── Task ───────────────────────────────────────────────────────────────
  [ErrorCode.TASK_INVALID_DEPENDENCY]: {
    en: 'This dependency creates a circular reference and is not allowed.',
    ar: 'هذا التبعية تنشئ مرجعًا دائريًا وهو غير مسموح.',
  },
  [ErrorCode.TASK_SLA_BREACHED]: {
    en: 'The task SLA deadline has been breached.',
    ar: 'تم تجاوز الموعد النهائي لاتفاقية مستوى الخدمة للمهمة.',
  },
  [ErrorCode.TASK_HAS_SUBTASKS]: {
    en: 'Cannot delete a task that has uncompleted sub-tasks.',
    ar: 'لا يمكن حذف مهمة بها مهام فرعية غير مكتملة.',
  },
  [ErrorCode.TASK_ALREADY_ASSIGNED]: {
    en: 'The task is already assigned to the specified user.',
    ar: 'المهمة معينة بالفعل للمستخدم المحدد.',
  },

  // ── Contract ───────────────────────────────────────────────────────────
  [ErrorCode.CONTRACT_EXPIRED]: {
    en: 'This contract has expired and can no longer be modified.',
    ar: 'هذا العقد منتهي الصلاحية ولم يعد يمكن تعديله.',
  },
  [ErrorCode.CONTRACT_VALUE_EXCEEDS_BUDGET]: {
    en: 'The contract value exceeds the approved project budget.',
    ar: 'قيمة العقد تتجاوز ميزانية المشروع المعتمدة.',
  },

  // ── Material / Procurement ─────────────────────────────────────────────
  [ErrorCode.MATERIAL_INSUFFICIENT_STOCK]: {
    en: 'Insufficient stock for the requested quantity.',
    ar: 'مخزون غير كافي للكمية المطلوبة.',
  },
  [ErrorCode.PO_ALREADY_APPROVED]: {
    en: 'This purchase order has already been approved.',
    ar: 'تمت الموافقة على أمر الشراء هذا بالفعل.',
  },
  [ErrorCode.PO_ALREADY_RECEIVED]: {
    en: 'This purchase order has already been marked as received.',
    ar: 'تم تسليم أمر الشراء هذا بالفعل.',
  },

  // ── Leave ──────────────────────────────────────────────────────────────
  [ErrorCode.LEAVE_INSUFFICIENT_BALANCE]: {
    en: 'Insufficient leave balance for the requested dates.',
    ar: 'رصيد إجازة غير كافٍ للتواريخ المطلوبة.',
  },
  [ErrorCode.LEAVE_OVERLAP]: {
    en: 'The leave request overlaps with an existing approved leave.',
    ar: 'يتداخل طلب الإجازة مع إجازة معتمدة موجودة.',
  },
  [ErrorCode.LEAVE_ALREADY_PROCESSED]: {
    en: 'This leave request has already been processed.',
    ar: 'تمت معالجة طلب الإجازة هذا بالفعل.',
  },

  // ── Transmittal ────────────────────────────────────────────────────────
  [ErrorCode.TRANSMITTAL_REF_EXISTS]: {
    en: 'A transmittal with this reference number already exists.',
    ar: 'إحالة بهذا الرقم المرجعي موجودة بالفعل.',
  },

  // ── Defect ─────────────────────────────────────────────────────────────
  [ErrorCode.DEFECT_INVALID_SEVERITY]: {
    en: 'The defect severity is not within the allowed range.',
    ar: 'شدة العيب غير ضمن النطاق المسموح.',
  },

  // ── System ─────────────────────────────────────────────────────────────
  [ErrorCode.SYSTEM_DATABASE_ERROR]: {
    en: 'A database error occurred. Please try again later.',
    ar: 'حدث خطأ في قاعدة البيانات. يرجى المحاولة لاحقًا.',
  },
  [ErrorCode.SYSTEM_CACHE_ERROR]: {
    en: 'A caching error occurred. Please try again.',
    ar: 'حدث خطأ في التخزين المؤقت. يرجى المحاولة مرة أخرى.',
  },
  [ErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR]: {
    en: 'An external service error occurred. Please try again later.',
    ar: 'حدث خطأ في خدمة خارجية. يرجى المحاولة لاحقًا.',
  },
  [ErrorCode.SYSTEM_MAINTENANCE]: {
    en: 'The system is currently under maintenance. Please try again later.',
    ar: 'النظام تحت الصيانة حاليًا. يرجى المحاولة لاحقًا.',
  },
  [ErrorCode.SYSTEM_FILE_TOO_LARGE]: {
    en: 'The uploaded file exceeds the maximum allowed size.',
    ar: 'الملف المرفوع يتجاوز الحجم الأقصى المسموح.',
  },
  [ErrorCode.SYSTEM_UNSUPPORTED_FILE_TYPE]: {
    en: 'The uploaded file type is not supported.',
    ar: 'نوع الملف المرفوع غير مدعوم.',
  },
  [ErrorCode.SYSTEM_STORAGE_LIMIT]: {
    en: 'The system has reached its storage limit. Please contact your administrator.',
    ar: 'وصل النظام إلى حد التخزين. يرجى الاتصال بالمسؤول.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Code Categories
// ─────────────────────────────────────────────────────────────────────────────

/** HTTP status code defaults per error category prefix. */
export const ErrorHttpStatus: Partial<Record<ErrorCode, number>> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: 403,
  [ErrorCode.AUTH_2FA_REQUIRED]: 403,
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.AUTH_PASSWORD_WEAK]: 400,
  [ErrorCode.AUTH_RATE_LIMITED]: 429,
  [ErrorCode.AUTH_INVALID_TOKEN]: 401,
  [ErrorCode.AUTH_ALREADY_AUTHENTICATED]: 409,

  [ErrorCode.VALIDATION_INVALID_INPUT]: 422,
  [ErrorCode.VALIDATION_MISSING_FIELD]: 422,
  [ErrorCode.VALIDATION_INVALID_EMAIL]: 422,
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 422,
  [ErrorCode.VALIDATION_TOO_LONG]: 422,
  [ErrorCode.VALIDATION_OUT_OF_RANGE]: 422,

  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_DELETED]: 410,
  [ErrorCode.RESOURCE_LOCKED]: 423,

  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.PERMISSION_INSUFFICIENT_ROLE]: 403,
  [ErrorCode.PERMISSION_WRONG_ORGANIZATION]: 403,

  [ErrorCode.PROJECT_CANNOT_DELETE_ACTIVE]: 409,
  [ErrorCode.PROJECT_INVALID_STATUS_TRANSITION]: 409,
  [ErrorCode.PROJECT_BUDGET_EXCEEDED]: 409,
  [ErrorCode.PROJECT_ALREADY_ARCHIVED]: 409,
  [ErrorCode.PROJECT_CODE_EXISTS]: 409,

  [ErrorCode.INVOICE_CANNOT_MODIFY_PAID]: 409,
  [ErrorCode.INVOICE_ALREADY_SENT]: 409,
  [ErrorCode.INVOICE_NUMBER_EXISTS]: 409,
  [ErrorCode.INVOICE_INVALID_AMOUNT]: 422,
  [ErrorCode.INVOICE_PAST_DUE_DATE]: 422,

  [ErrorCode.TASK_INVALID_DEPENDENCY]: 422,
  [ErrorCode.TASK_SLA_BREACHED]: 409,
  [ErrorCode.TASK_HAS_SUBTASKS]: 409,
  [ErrorCode.TASK_ALREADY_ASSIGNED]: 409,

  [ErrorCode.CONTRACT_EXPIRED]: 409,
  [ErrorCode.CONTRACT_VALUE_EXCEEDS_BUDGET]: 409,

  [ErrorCode.MATERIAL_INSUFFICIENT_STOCK]: 409,
  [ErrorCode.PO_ALREADY_APPROVED]: 409,
  [ErrorCode.PO_ALREADY_RECEIVED]: 409,

  [ErrorCode.LEAVE_INSUFFICIENT_BALANCE]: 409,
  [ErrorCode.LEAVE_OVERLAP]: 409,
  [ErrorCode.LEAVE_ALREADY_PROCESSED]: 409,

  [ErrorCode.TRANSMITTAL_REF_EXISTS]: 409,
  [ErrorCode.DEFECT_INVALID_SEVERITY]: 422,

  [ErrorCode.SYSTEM_DATABASE_ERROR]: 500,
  [ErrorCode.SYSTEM_CACHE_ERROR]: 500,
  [ErrorCode.SYSTEM_EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.SYSTEM_MAINTENANCE]: 503,
  [ErrorCode.SYSTEM_FILE_TOO_LARGE]: 413,
  [ErrorCode.SYSTEM_UNSUPPORTED_FILE_TYPE]: 415,
  [ErrorCode.SYSTEM_STORAGE_LIMIT]: 507,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the human-readable message for an error code in the
 * specified language (defaults to English).
 *
 * @param code - The `ErrorCode` value.
 * @param lang - Language key (`'en'` or `'ar'`). Defaults to `'en'`.
 * @returns The localised error message string.
 *
 * @example
 * ```ts
 * getErrorMessage(ErrorCode.AUTH_INVALID_CREDENTIALS, 'ar');
 * // => 'البريد الإلكتروني أو كلمة المرور غير صحيحة …'
 * ```
 */
export function getErrorMessage(
  code: ErrorCode,
  lang: SupportedLanguage = 'en',
): string {
  return ErrorMessages[code]?.[lang] ?? 'An unknown error occurred.';
}

/**
 * Returns the default HTTP status code associated with the given error code.
 *
 * @param code - The `ErrorCode` value.
 * @returns Numeric HTTP status (defaults to 500).
 */
export function getHttpStatus(code: ErrorCode): number {
  return ErrorHttpStatus[code] ?? 500;
}

/**
 * Returns the category prefix for a given error code.
 *
 * @param code - The `ErrorCode` value.
 * @returns The uppercase category string (e.g. `'AUTH'`, `'VALIDATION'`).
 */
export function getErrorCategory(code: ErrorCode): string {
  const index = code.indexOf('_');
  return index > 0 ? code.slice(0, index) : 'UNKNOWN';
}
