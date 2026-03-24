/**
 * Excel File Validation Utilities
 * أدوات التحقق من صحة ملفات Excel
 * 
 * Security measures for Excel file handling:
 * - File size limits
 * - MIME type validation
 * - File extension validation
 * - Content structure validation
 * - Protection against XXE attacks
 * - Maximum rows/columns limits
 */

import * as XLSX from 'xlsx';

// ============================================
// Types
// ============================================

export interface ExcelValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  data?: Record<string, unknown>[];
  headers?: string[];
  metadata?: ExcelMetadata;
}

export interface ExcelMetadata {
  sheetCount: number;
  sheetNames: string[];
  totalRows: number;
  totalColumns: number;
  fileSize: number;
}

export interface ExcelValidationOptions {
  maxFileSize?: number; // in bytes, default 10MB
  maxRows?: number; // default 10000
  maxColumns?: number; // default 100
  allowedExtensions?: string[];
  requiredHeaders?: string[];
  sheetIndex?: number; // which sheet to read, default 0
}

// ============================================
// Constants
// ============================================

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_ROWS = 10000;
const DEFAULT_MAX_COLUMNS = 100;
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/csv', // .csv alternate
];

// Error messages in Arabic and English
const ERROR_MESSAGES = {
  ar: {
    EMPTY_FILE: 'الملف فارغ',
    FILE_TOO_LARGE: 'حجم الملف كبير جداً. الحد الأقصى هو {max} ميجابايت',
    INVALID_EXTENSION: 'امتداد الملف غير صالح. الأنواع المسموحة: {allowed}',
    INVALID_MIME_TYPE: 'نوع الملف غير صالح',
    TOO_MANY_ROWS: 'عدد الصفوف يتجاوز الحد المسموح ({max})',
    TOO_MANY_COLUMNS: 'عدد الأعمدة يتجاوز الحد المسموح ({max})',
    PARSE_ERROR: 'فشل في قراءة الملف. قد يكون الملف تالفاً',
    MISSING_HEADERS: 'الملف لا يحتوي على العناوين المطلوبة: {headers}',
    NO_DATA: 'الملف لا يحتوي على بيانات',
    EMPTY_SHEET: 'الورقة فارغة',
  },
  en: {
    EMPTY_FILE: 'File is empty',
    FILE_TOO_LARGE: 'File size exceeds maximum allowed ({max}MB)',
    INVALID_EXTENSION: 'Invalid file extension. Allowed: {allowed}',
    INVALID_MIME_TYPE: 'Invalid file MIME type',
    TOO_MANY_ROWS: 'Number of rows exceeds limit ({max})',
    TOO_MANY_COLUMNS: 'Number of columns exceeds limit ({max})',
    PARSE_ERROR: 'Failed to parse file. The file may be corrupted',
    MISSING_HEADERS: 'Missing required headers: {headers}',
    NO_DATA: 'File contains no data',
    EMPTY_SHEET: 'Sheet is empty',
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Get error message in specified language
 */
function getErrorMessage(code: keyof typeof ERROR_MESSAGES.en, lang: 'ar' | 'en' = 'ar', params?: Record<string, string | number>): string {
  let message = ERROR_MESSAGES[lang][code];
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      message = message.replace(`{${key}}`, String(value));
    }
  }
  
  return message;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string, allowed: string[] = ALLOWED_EXTENSIONS): { valid: boolean; error?: string } {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  
  if (!allowed.includes(ext)) {
    return {
      valid: false,
      error: `Invalid extension "${ext}". Allowed: ${allowed.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid MIME type "${mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number = DEFAULT_MAX_FILE_SIZE): { valid: boolean; error?: string } {
  if (size > maxSize) {
    return {
      valid: false,
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds limit ${(maxSize / 1024 / 1024).toFixed(2)}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Parse and validate Excel file buffer
 * 
 * @param buffer - File buffer
 * @param options - Validation options
 * @param language - Error message language
 * @returns Validation result with parsed data
 */
export function validateAndParseExcel(
  buffer: Buffer,
  options: ExcelValidationOptions = {},
  language: 'ar' | 'en' = 'ar'
): ExcelValidationResult {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    maxRows = DEFAULT_MAX_ROWS,
    maxColumns = DEFAULT_MAX_COLUMNS,
    requiredHeaders = [],
    sheetIndex = 0,
  } = options;

  // Validate file size
  if (buffer.length === 0) {
    return {
      valid: false,
      error: getErrorMessage('EMPTY_FILE', language),
      errorCode: 'EMPTY_FILE'
    };
  }

  if (buffer.length > maxFileSize) {
    return {
      valid: false,
      error: getErrorMessage('FILE_TOO_LARGE', language, { max: maxFileSize / 1024 / 1024 }),
      errorCode: 'FILE_TOO_LARGE'
    };
  }

  let workbook: XLSX.WorkBook;
  
  try {
    // Parse workbook - using type: 'buffer' for security
    // This prevents XXE attacks by not resolving external entities
    workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellFormula: false, // Disable formula evaluation for security
      cellHTML: false, // Disable HTML parsing
      cellStyles: false, // Don't need styles
      cellDates: true, // Parse dates properly
      sheetStubs: false, // Don't include empty cells
    });
  } catch (error) {
    return {
      valid: false,
      error: getErrorMessage('PARSE_ERROR', language),
      errorCode: 'PARSE_ERROR'
    };
  }

  // Validate sheet existence
  if (!workbook.SheetNames.length) {
    return {
      valid: false,
      error: getErrorMessage('EMPTY_SHEET', language),
      errorCode: 'EMPTY_SHEET'
    };
  }

  const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return {
      valid: false,
      error: getErrorMessage('EMPTY_SHEET', language),
      errorCode: 'EMPTY_SHEET'
    };
  }

  // Get sheet range
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const rowCount = range.e.r - range.s.r + 1;
  const colCount = range.e.c - range.s.c + 1;

  // Validate row count
  if (rowCount > maxRows) {
    return {
      valid: false,
      error: getErrorMessage('TOO_MANY_ROWS', language, { max: maxRows }),
      errorCode: 'TOO_MANY_ROWS'
    };
  }

  // Validate column count
  if (colCount > maxColumns) {
    return {
      valid: false,
      error: getErrorMessage('TOO_MANY_COLUMNS', language, { max: maxColumns }),
      errorCode: 'TOO_MANY_COLUMNS'
    };
  }

  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    raw: false, // Return formatted strings instead of raw values
  });

  // Check for data
  if (jsonData.length === 0) {
    return {
      valid: false,
      error: getErrorMessage('NO_DATA', language),
      errorCode: 'NO_DATA'
    };
  }

  // Get headers from first row
  const headers = Object.keys(jsonData[0]);

  // Validate required headers
  if (requiredHeaders.length > 0) {
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        valid: false,
        error: getErrorMessage('MISSING_HEADERS', language, { headers: missingHeaders.join(', ') }),
        errorCode: 'MISSING_HEADERS'
      };
    }
  }

  // Return success with metadata
  return {
    valid: true,
    data: jsonData,
    headers,
    metadata: {
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
      totalRows: rowCount,
      totalColumns: colCount,
      fileSize: buffer.length,
    }
  };
}

/**
 * Validate Excel file from File object (browser/client-side)
 * 
 * @param file - File object from input
 * @param options - Validation options
 * @param language - Error message language
 */
export async function validateExcelFile(
  file: File,
  options: ExcelValidationOptions = {},
  language: 'ar' | 'en' = 'ar'
): Promise<ExcelValidationResult> {
  // Validate extension
  const extValidation = validateFileExtension(file.name, options.allowedExtensions);
  if (!extValidation.valid) {
    return {
      valid: false,
      error: getErrorMessage('INVALID_EXTENSION', language, { 
        allowed: (options.allowedExtensions || ALLOWED_EXTENSIONS).join(', ') 
      }),
      errorCode: 'INVALID_EXTENSION'
    };
  }

  // Validate MIME type
  const mimeValidation = validateMimeType(file.type);
  if (!mimeValidation.valid) {
    return {
      valid: false,
      error: getErrorMessage('INVALID_MIME_TYPE', language),
      errorCode: 'INVALID_MIME_TYPE'
    };
  }

  // Validate size
  const sizeValidation = validateFileSize(file.size, options.maxFileSize);
  if (!sizeValidation.valid) {
    return {
      valid: false,
      error: getErrorMessage('FILE_TOO_LARGE', language, { max: (options.maxFileSize || DEFAULT_MAX_FILE_SIZE) / 1024 / 1024 }),
      errorCode: 'FILE_TOO_LARGE'
    };
  }

  // Read file
  const buffer = await file.arrayBuffer();
  
  return validateAndParseExcel(Buffer.from(buffer), options, language);
}

/**
 * Sanitize Excel data - remove potentially dangerous content
 * 
 * @param data - Parsed Excel data
 * @returns Sanitized data
 */
export function sanitizeExcelData(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map(row => {
    const sanitizedRow: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Sanitize key (header)
      const sanitizedKey = key.toString().trim().slice(0, 255);
      
      // Sanitize value
      if (value === null || value === undefined) {
        sanitizedRow[sanitizedKey] = null;
      } else if (typeof value === 'string') {
        // Remove potential script injection, trim whitespace, limit length
        sanitizedRow[sanitizedKey] = value
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .trim()
          .slice(0, 10000); // Limit string length
      } else if (typeof value === 'number') {
        // Ensure finite numbers
        sanitizedRow[sanitizedKey] = Number.isFinite(value) ? value : null;
      } else if (value instanceof Date) {
        sanitizedRow[sanitizedKey] = value;
      } else {
        // Convert other types to string
        sanitizedRow[sanitizedKey] = String(value).trim().slice(0, 10000);
      }
    }
    
    return sanitizedRow;
  });
}

// ============================================
// Export Constants
// ============================================

export const ExcelConstants = {
  MAX_FILE_SIZE: DEFAULT_MAX_FILE_SIZE,
  MAX_ROWS: DEFAULT_MAX_ROWS,
  MAX_COLUMNS: DEFAULT_MAX_COLUMNS,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
