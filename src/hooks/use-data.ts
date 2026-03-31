/**
 * @deprecated Import from '@/hooks/api' instead.
 *
 * This file re-exports everything from '@/hooks/api' for backward compatibility.
 * All existing imports like `import { useProjects } from '@/hooks/use-data'` will
 * continue to work without any changes.
 */

'use client';

// Re-export everything from the new modular structure
export * from './api/index';
