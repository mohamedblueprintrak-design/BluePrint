/**
 * Tests for Excel Validation Utilities
 */

import {
  validateFileExtension,
  validateMimeType,
  validateFileSize,
  validateAndParseExcel,
  sanitizeExcelData,
  ExcelConstants,
} from '@/lib/excel-validator';
import * as XLSX from 'xlsx';

// ============================================
// File Extension Validation Tests
// ============================================

describe('validateFileExtension', () => {
  it('should accept valid .xlsx extension', () => {
    const result = validateFileExtension('test.xlsx');
    expect(result.valid).toBe(true);
  });

  it('should accept valid .xls extension', () => {
    const result = validateFileExtension('test.xls');
    expect(result.valid).toBe(true);
  });

  it('should accept valid .csv extension', () => {
    const result = validateFileExtension('test.csv');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid extensions', () => {
    const result = validateFileExtension('test.pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid extension');
  });

  it('should reject files without extension', () => {
    const result = validateFileExtension('testfile');
    expect(result.valid).toBe(false);
  });

  it('should handle uppercase extensions', () => {
    const result = validateFileExtension('TEST.XLSX');
    expect(result.valid).toBe(true);
  });

  it('should respect custom allowed extensions', () => {
    const result = validateFileExtension('test.xlsx', ['.pdf', '.doc']);
    expect(result.valid).toBe(false);
  });
});

// ============================================
// MIME Type Validation Tests
// ============================================

describe('validateMimeType', () => {
  it('should accept xlsx MIME type', () => {
    const result = validateMimeType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(result.valid).toBe(true);
  });

  it('should accept xls MIME type', () => {
    const result = validateMimeType('application/vnd.ms-excel');
    expect(result.valid).toBe(true);
  });

  it('should accept csv MIME type', () => {
    const result = validateMimeType('text/csv');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid MIME types', () => {
    const result = validateMimeType('application/pdf');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid MIME type');
  });
});

// ============================================
// File Size Validation Tests
// ============================================

describe('validateFileSize', () => {
  it('should accept files within size limit', () => {
    const result = validateFileSize(1024, 2048);
    expect(result.valid).toBe(true);
  });

  it('should reject files exceeding size limit', () => {
    const result = validateFileSize(10 * 1024 * 1024 + 1, 10 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds limit');
  });

  it('should use default max size when not specified', () => {
    const result = validateFileSize(1024);
    expect(result.valid).toBe(true);
  });

  it('should accept empty files', () => {
    const result = validateFileSize(0);
    expect(result.valid).toBe(true);
  });
});

// ============================================
// Excel Parsing Validation Tests
// ============================================

describe('validateAndParseExcel', () => {
  // Helper to create test Excel buffer
  function createTestExcelBuffer(data: Record<string, unknown>[]): Buffer {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  it('should parse valid Excel file', () => {
    const data = [{ name: 'Test', value: 123 }];
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer);
    
    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].name).toBe('Test');
  });

  it('should reject empty buffer', () => {
    const result = validateAndParseExcel(Buffer.alloc(0));
    
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('EMPTY_FILE');
  });

  it('should reject buffer exceeding size limit', () => {
    const data = [{ name: 'Test' }];
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer, { maxFileSize: 1 }); // 1 byte limit
    
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('FILE_TOO_LARGE');
  });

  it('should extract headers from data', () => {
    const data = [
      { firstName: 'John', lastName: 'Doe', age: 30 }
    ];
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer);
    
    expect(result.valid).toBe(true);
    expect(result.headers).toContain('firstName');
    expect(result.headers).toContain('lastName');
    expect(result.headers).toContain('age');
  });

  it('should validate required headers', () => {
    const data = [{ name: 'Test' }];
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer, {
      requiredHeaders: ['name', 'email']
    });
    
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('MISSING_HEADERS');
  });

  it('should pass when all required headers exist', () => {
    const data = [{ name: 'Test', email: 'test@example.com' }];
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer, {
      requiredHeaders: ['name', 'email']
    });
    
    expect(result.valid).toBe(true);
  });

  it('should return metadata about the file', () => {
    const data = [
      { a: 1, b: 2 },
      { a: 3, b: 4 }
    ];
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer);
    
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.totalRows).toBeGreaterThan(0);
    expect(result.metadata?.sheetCount).toBe(1);
    expect(result.metadata?.sheetNames).toContain('Sheet1');
  });

  it('should reject files with too many rows', () => {
    // Create data with many rows
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const buffer = createTestExcelBuffer(data);
    
    const result = validateAndParseExcel(buffer, { maxRows: 50 });
    
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('TOO_MANY_ROWS');
  });

  it('should reject invalid buffer (not Excel)', () => {
    // xlsx library can parse any text as a single cell, so it returns NO_DATA
    // For truly malformed Excel files, it would return PARSE_ERROR
    const buffer = Buffer.from('This is not an Excel file');
    
    const result = validateAndParseExcel(buffer);
    
    // The text gets parsed but has no valid data rows
    expect(result.valid).toBe(false);
    expect(['PARSE_ERROR', 'NO_DATA']).toContain(result.errorCode);
  });

  it('should support Arabic error messages', () => {
    const result = validateAndParseExcel(Buffer.alloc(0), {}, 'ar');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('الملف فارغ');
  });

  it('should support English error messages', () => {
    const result = validateAndParseExcel(Buffer.alloc(0), {}, 'en');
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('File is empty');
  });
});

// ============================================
// Data Sanitization Tests
// ============================================

describe('sanitizeExcelData', () => {
  it('should preserve valid data', () => {
    const data = [
      { name: 'John Doe', age: 30, active: true }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0].name).toBe('John Doe');
    expect(result[0].age).toBe(30);
  });

  it('should remove HTML tags from values', () => {
    const data = [
      { name: '<script>alert("XSS")</script>John' }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0].name).toBe('alert("XSS")John');
  });

  it('should remove javascript: protocol', () => {
    const data = [
      { url: 'javascript:alert("XSS")' }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0].url).toBe('alert("XSS")');
  });

  it('should trim whitespace', () => {
    const data = [
      { name: '  John Doe  ' }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0].name).toBe('John Doe');
  });

  it('should handle null values', () => {
    const data = [
      { name: null, value: undefined }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0].name).toBeNull();
    expect(result[0].value).toBeNull();
  });

  it('should handle non-finite numbers', () => {
    const data = [
      { value: Infinity, value2: NaN }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0].value).toBeNull();
    expect(result[0].value2).toBeNull();
  });

  it('should limit string length', () => {
    const longString = 'a'.repeat(20000);
    const data = [
      { text: longString }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect((result[0].text as string).length).toBe(10000);
  });

  it('should sanitize header names', () => {
    const data = [
      { '  name  ': 'John' }
    ];
    
    const result = sanitizeExcelData(data);
    
    expect(result[0]).toHaveProperty('name');
  });
});

// ============================================
// Constants Tests
// ============================================

describe('ExcelConstants', () => {
  it('should define MAX_FILE_SIZE as 10MB', () => {
    expect(ExcelConstants.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });

  it('should define MAX_ROWS as 10000', () => {
    expect(ExcelConstants.MAX_ROWS).toBe(10000);
  });

  it('should define MAX_COLUMNS as 100', () => {
    expect(ExcelConstants.MAX_COLUMNS).toBe(100);
  });

  it('should include xlsx in allowed extensions', () => {
    expect(ExcelConstants.ALLOWED_EXTENSIONS).toContain('.xlsx');
  });
});
