import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware handles routing for Netlify compatibility
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookies or authorization header
  const token = request.cookies.get('bp_token')?.value
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register', '/api/auth', '/_next', '/favicon.ico']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // If trying to access protected route without token, redirect to login
  if (!isPublicPath && !token && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // If logged in and trying to access login page, redirect to dashboard
  if (pathname === '/login' && token) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
