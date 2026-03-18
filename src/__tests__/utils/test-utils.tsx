/**
 * Test Utilities
 * أدوات مساعدة للاختبارات
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock Providers wrapper for testing
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
}

/**
 * Custom render function that includes providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Create mock function with typed return
 */
export function createMock<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): jest.MockedFunction<T> {
  return jest.fn(implementation) as unknown as jest.MockedFunction<T>;
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Mock API response
 */
export function mockApiResponse<T>(data: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response;
}

/**
 * Create mock fetch that returns specific response
 */
export function createMockFetch(responses: Record<string, unknown>) {
  return jest.fn((url: string) => {
    const endpoint = Object.keys(responses).find(key => url.includes(key));
    if (endpoint) {
      return Promise.resolve(mockApiResponse(responses[endpoint] as Record<string, unknown>));
    }
    return Promise.resolve(mockApiResponse({ error: 'Not found' }, 404));
  });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { customRender as render };
