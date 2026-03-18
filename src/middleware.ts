import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple middleware - let client-side handle auth
// This ensures Netlify doesn't block navigation
export function middleware(request: NextRequest) {
  // Just pass through - auth is handled client-side
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match dashboard routes only
    '/dashboard/:path*',
  ],
}
