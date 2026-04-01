/**
 * BluePrint API - Query Builder (Pagination, Filtering, Sorting)
 *
 * Parses URL search parameters into type-safe structures that map
 * directly to Prisma query options. Supports:
 * - Pagination (page / limit with configurable defaults & max)
 * - Sorting (sortBy / sortOrder with an allow-list)
 * - Field filtering (eq, ne, gt, gte, lt, lte, contains, in, between)
 * - Full-text search across multiple fields
 * - Date-range filtering (from / to / dateField)
 *
 * @module query-builder
 * @version 1.0.0
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Supported Prisma sort directions. */
export type SortOrder = 'asc' | 'desc';

/**
 * Raw pagination options parsed from query string.
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Raw sort options parsed from query string.
 */
export interface SortOptions {
  sortBy: string;
  sortOrder: SortOrder;
}

/**
 * Supported filter operators.
 */
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'between';

/**
 * A single filter condition extracted from query params.
 *
 * Filters are expected in the format: `filter[fieldName][operator]=value`
 * e.g. `filter[status][eq]=active` or `filter[amount][gte]=1000`
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string | string[];
}

/**
 * Date range filter extracted from query params.
 * Expected as: `from=2024-01-01&to=2024-12-31&dateField=createdAt`
 */
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
  dateField: string;
}

/**
 * Full-text search options.
 */
export interface SearchOptions {
  term: string;
  fields: string[];
}

/**
 * Combined query parameters after parsing.
 */
export interface ParsedQuery {
  pagination: PaginationOptions;
  sort: SortOptions;
  filters: FilterCondition[];
  dateRange?: DateRangeFilter;
  search?: SearchOptions;
}

/**
 * Configuration for the main `parseQuery` function.
 */
export interface QueryConfig {
  /** Default page number (default: 1) */
  defaultPage?: number;
  /** Default items per page (default: 20) */
  defaultLimit?: number;
  /** Maximum allowed items per page (default: 100) */
  maxLimit?: number;
  /** Default sort field (default: 'createdAt') */
  defaultSortBy?: string;
  /** Default sort direction (default: 'desc') */
  defaultSortOrder?: SortOrder;
  /** Allow-list of sortable fields. If empty, all fields are allowed. */
  allowedSortFields?: string[];
  /** Map of model fields allowed for filtering { fieldName: [operators] } */
  allowedFilters?: Record<string, FilterOperator[]>;
  /** Fields to include in full-text search */
  searchFields?: string[];
  /** Default date field for date range filters (default: 'createdAt') */
  defaultDateField?: string;
}

/** Default query configuration values. */
const DEFAULT_CONFIG: Required<QueryConfig> = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
  allowedSortFields: [],
  allowedFilters: {},
  searchFields: [],
  defaultDateField: 'createdAt',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pagination Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses and validates pagination parameters from URL search params.
 *
 * @param searchParams - URL search params (from `new URL(request.url).searchParams`).
 * @param defaults - Override default page / limit / maxLimit.
 * @returns Validated `PaginationOptions`.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults?: { page?: number; limit?: number; maxLimit?: number },
): PaginationOptions {
  const maxLimit = defaults?.maxLimit ?? DEFAULT_CONFIG.maxLimit;
  const defaultLimit = defaults?.limit ?? DEFAULT_CONFIG.defaultLimit;
  const defaultPage = defaults?.page ?? DEFAULT_CONFIG.defaultPage;

  let page = parseInt(searchParams.get('page') || '', 10);
  let limit = parseInt(searchParams.get('limit') || '', 10);

  if (isNaN(page) || page < 1) page = defaultPage;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses sort parameters from URL search params.
 *
 * Expects `sortBy` and `sortOrder` query parameters.
 * Validates `sortBy` against an optional allow-list.
 *
 * @param searchParams - URL search params.
 * @param allowedFields - Optional array of allowed sort fields.
 * @param defaults - Override default sortBy / sortOrder.
 * @returns Validated `SortOptions`.
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields?: string[],
  defaults?: { sortBy?: string; sortOrder?: SortOrder },
): SortOptions {
  const defaultSortBy = defaults?.sortBy ?? DEFAULT_CONFIG.defaultSortBy;
  const defaultSortOrder = defaults?.sortOrder ?? DEFAULT_CONFIG.defaultSortOrder;

  let sortBy = searchParams.get('sortBy') || defaultSortBy;
  const rawOrder = searchParams.get('sortOrder') || defaultSortOrder;
  let sortOrder: SortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

  // If allow-list is provided, ensure sortBy is in it
  if (allowedFields && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  return { sortBy, sortOrder };
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supported filter operators set.
 */
const VALID_OPERATORS = new Set<string>([
  'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
  'contains', 'startsWith', 'endsWith',
  'in', 'between',
]);

/**
 * Parses filter conditions from URL search params.
 *
 * Expected formats:
 * - `filter[status][eq]=active`
 * - `filter[priority][in]=high,medium`
 * - `filter[createdAt][gte]=2024-01-01`
 * - `filter[budget][between]=1000,5000`
 *
 * @param searchParams - URL search params.
 * @param allowedFilters - Map of allowed fields to their permitted operators.
 *                         If empty, all fields and operators are accepted.
 * @returns Array of `FilterCondition`.
 */
export function parseFilterParams(
  searchParams: URLSearchParams,
  allowedFilters?: Record<string, FilterOperator[]>,
): FilterCondition[] {
  const conditions: FilterCondition[] = [];

  for (const [key, value] of searchParams.entries()) {
    // Match filter[field][operator] pattern
    const match = key.match(/^filter\[(.+?)\]\[(.+?)\]$/);
    if (!match) continue;

    const field = match[1];
    const operator = match[2] as FilterOperator;

    if (!VALID_OPERATORS.has(operator)) continue;

    // Check against allow-list if provided
    if (allowedFilters) {
      const fieldAllowed = allowedFilters[field];
      if (!fieldAllowed) continue;
      if (!fieldAllowed.includes(operator)) continue;
    }

    // Handle multi-value operators (in, between)
    if (operator === 'in' || operator === 'between') {
      conditions.push({
        field,
        operator,
        value: value.split(',').map((v) => v.trim()),
      });
    } else {
      conditions.push({ field, operator, value });
    }
  }

  return conditions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date Range Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses date-range parameters from URL search params.
 *
 * Expected: `from=2024-01-01&to=2024-12-31&dateField=createdAt`
 *
 * @param searchParams - URL search params.
 * @param defaultDateField - Fallback field name if `dateField` param is missing.
 * @returns `DateRangeFilter` if both `from` and `to` are present, else `undefined`.
 */
export function parseDateRange(
  searchParams: URLSearchParams,
  defaultDateField: string = DEFAULT_CONFIG.defaultDateField,
): DateRangeFilter | undefined {
  const fromStr = searchParams.get('from');
  const toStr = searchParams.get('to');

  if (!fromStr && !toStr) return undefined;

  const dateField = searchParams.get('dateField') || defaultDateField;

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  // Validate dates
  if (from && isNaN(from.getTime())) return undefined;
  if (to && isNaN(to.getTime())) return undefined;

  return { from, to, dateField };
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses full-text search parameters from URL search params.
 *
 * Expected: `search=keyword` (the fields to search are configured, not user-supplied).
 *
 * @param searchParams - URL search params.
 * @param fields - Array of model fields to search across.
 * @returns `SearchOptions` if `search` param is present and non-empty.
 */
export function parseSearchParams(
  searchParams: URLSearchParams,
  fields: string[],
): SearchOptions | undefined {
  const term = searchParams.get('search')?.trim();
  if (!term || fields.length === 0) return undefined;
  return { term, fields };
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma Query Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts `PaginationOptions` to Prisma `skip` and `take` values.
 *
 * @param options - Validated pagination options.
 * @returns Object with `skip` and `take` ready for Prisma.
 *
 * @example
 * ```ts
 * const { skip, take } = buildPrismaPagination({ page: 2, limit: 20 });
 * // => { skip: 20, take: 20 }
 * ```
 */
export function buildPrismaPagination(options: PaginationOptions): {
  skip: number;
  take: number;
} {
  return {
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  };
}

/**
 * Converts `SortOptions` to Prisma `orderBy` clause.
 *
 * Supports dot-notation for nested fields (e.g. `'client.name'`).
 *
 * @param options - Validated sort options.
 * @returns Prisma `orderBy` compatible object.
 *
 * @example
 * ```ts
 * buildPrismaOrderBy({ sortBy: 'name', sortOrder: 'asc' });
 * // => { name: 'asc' }
 *
 * buildPrismaOrderBy({ sortBy: 'client.name', sortOrder: 'desc' });
 * // => { client: { name: 'desc' } }
 * ```
 */
export function buildPrismaOrderBy(options: SortOptions): Record<string, unknown> {
  const parts = options.sortBy.split('.');
  if (parts.length === 1) {
    return { [parts[0]]: options.sortOrder };
  }

  // Nested: e.g. 'client.name' => { client: { name: 'desc' } }
  const result: Record<string, unknown> = {};
  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = options.sortOrder;
  return result;
}

/**
 * Converts filter conditions to a Prisma `where` clause.
 *
 * Automatically casts numeric / boolean values. Supports all major operators.
 *
 * @param filters - Array of parsed filter conditions.
 * @param numericFields - Fields that should be treated as numbers.
 * @returns Prisma `where` compatible object.
 *
 * @example
 * ```ts
 * buildPrismaWhere([
 *   { field: 'status', operator: 'eq', value: 'active' },
 *   { field: 'budget', operator: 'gte', value: '10000' },
 * ], ['budget', 'amount']);
 * // => { status: { equals: 'active' }, budget: { gte: 10000 } }
 * ```
 */
export function buildPrismaWhere(
  filters: FilterCondition[],
  numericFields: string[] = [],
): Record<string, unknown> {
  if (filters.length === 0) return {};

  const where: Record<string, unknown> = {};

  for (const filter of filters) {
    let value: unknown = filter.value;

    // Auto-cast numeric fields
    if (numericFields.includes(filter.field)) {
      if (Array.isArray(value)) {
        value = value.map((v) => Number(v));
      } else {
        value = Number(value);
      }
    }

    // Auto-cast boolean-like values
    if (!Array.isArray(value) && (value === 'true' || value === 'false')) {
      value = value === 'true';
    }

    switch (filter.operator) {
      case 'eq':
        where[filter.field] = { equals: value };
        break;
      case 'ne':
        where[filter.field] = { not: value };
        break;
      case 'gt':
        where[filter.field] = { gt: value as number };
        break;
      case 'gte':
        where[filter.field] = { gte: value as number };
        break;
      case 'lt':
        where[filter.field] = { lt: value as number };
        break;
      case 'lte':
        where[filter.field] = { lte: value as number };
        break;
      case 'contains':
        where[filter.field] = { contains: value as string, mode: 'insensitive' };
        break;
      case 'startsWith':
        where[filter.field] = { startsWith: value as string, mode: 'insensitive' };
        break;
      case 'endsWith':
        where[filter.field] = { endsWith: value as string, mode: 'insensitive' };
        break;
      case 'in':
        where[filter.field] = { in: value as string[] | number[] };
        break;
      case 'between': {
        const arr = value as string[] | number[];
        if (arr.length === 2) {
          where[filter.field] = { gte: arr[0] as number, lte: arr[1] as number };
        }
        break;
      }
    }
  }

  return where;
}

/**
 * Builds a Prisma `OR` condition for full-text search across multiple fields.
 *
 * @param fields - Model fields to search across.
 * @param term - The search term.
 * @returns Prisma `where` compatible `OR` clause, or `undefined` if no fields.
 *
 * @example
 * ```ts
 * buildSearchCondition(['name', 'description'], 'foundation');
 * // => { OR: [{ name: { contains: 'foundation', mode: 'insensitive' } }, { description: { ... } }] }
 * ```
 */
export function buildSearchCondition(
  fields: string[],
  term: string,
): Record<string, unknown> | undefined {
  if (fields.length === 0 || !term.trim()) return undefined;

  const conditions = fields.map((field) => ({
    [field]: { contains: term, mode: 'insensitive' as const },
  }));

  return { OR: conditions };
}

/**
 * Builds a Prisma date-range filter clause.
 *
 * @param dateRange - Parsed date range options.
 * @returns Prisma `where` compatible date range clause, or `undefined`.
 */
export function buildDateRangeCondition(
  dateRange: DateRangeFilter,
): Record<string, unknown> | undefined {
  const condition: Record<string, unknown> = {};

  if (dateRange.from) {
    condition.gte = dateRange.from;
  }
  if (dateRange.to) {
    // Include the entire end day
    const to = new Date(dateRange.to);
    to.setHours(23, 59, 59, 999);
    condition.lte = to;
  }

  if (Object.keys(condition).length === 0) return undefined;

  return { [dateRange.dateField]: condition };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Parse Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses all query parameters (pagination, sorting, filtering, search, date range)
 * from a URL's search params in a single call.
 *
 * @param searchParams - URL search params from the incoming request.
 * @param config - Optional configuration overrides.
 * @returns A fully parsed `ParsedQuery` object ready for Prisma.
 *
 * @example
 * ```ts
 * // In a GET handler:
 * const { searchParams } = new URL(request.url);
 * const query = parseQuery(searchParams, {
 *   allowedSortFields: ['name', 'status', 'createdAt'],
 *   allowedFilters: {
 *     status: ['eq', 'in'],
 *     priority: ['eq', 'in'],
 *   },
 *   searchFields: ['name', 'code', 'description'],
 *   numericFields: ['budget', 'progress'],
 * });
 *
 * const { skip, take } = buildPrismaPagination(query.pagination);
 * const orderBy = buildPrismaOrderBy(query.sort);
 * const where = {
 *   ...buildPrismaWhere(query.filters, config.numericFields),
 *   ...buildSearchCondition(query.search?.fields ?? [], query.search?.term ?? ''),
 *   ...buildDateRangeCondition(query.dateRange!),
 * };
 *
 * const items = await db.project.findMany({ skip, take, orderBy, where });
 * const total = await db.project.count({ where });
 * ```
 */
export function parseQuery(
  searchParams: URLSearchParams,
  config?: QueryConfig,
): ParsedQuery {
  const merged: Required<QueryConfig> = { ...DEFAULT_CONFIG, ...config };

  const pagination = parsePaginationParams(searchParams, {
    page: merged.defaultPage,
    limit: merged.defaultLimit,
    maxLimit: merged.maxLimit,
  });

  const sort = parseSortParams(
    searchParams,
    merged.allowedSortFields.length > 0 ? merged.allowedSortFields : undefined,
    {
      sortBy: merged.defaultSortBy,
      sortOrder: merged.defaultSortOrder,
    },
  );

  const filters = parseFilterParams(
    searchParams,
    Object.keys(merged.allowedFilters).length > 0
      ? merged.allowedFilters
      : undefined,
  );

  const dateRange = parseDateRange(searchParams, merged.defaultDateField);

  const search =
    merged.searchFields.length > 0
      ? parseSearchParams(searchParams, merged.searchFields)
      : undefined;

  return { pagination, sort, filters, dateRange, search };
}
