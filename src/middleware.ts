import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
]

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/health',
  '/api/stripe/plans',
  '/api/stripe/webhook',
]

// Get JWT secret from environment
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET is not set!')
    throw new Error('JWT_SECRET is required')
  }
  return new TextEncoder().encode(secret)
}

// Verify JWT token
async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret())
    return {
      userId: payload.userId as string,
    }
  } catch (error) {
    return null
  }
}

// Extract token from request
function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookies
  const tokenCookie = request.cookies.get('bp_token')
  if (tokenCookie) {
    return tokenCookie.value
  }

  return null
}

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  // Check exact match for public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  // Check if it's a public API route
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return true
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    pathname.includes('.') // Static files
  ) {
    return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, verify authentication
  const token = extractToken(request)

  // If no token, redirect to login
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const decoded = await verifyToken(token)

  if (!decoded) {
    // Token is invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired. Please login again.',
          },
        },
        { status: 401 }
      )
    }

    // Clear invalid token and redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('bp_token')
    return response
  }

  // Token is valid, add user info to headers for API routes
  const response = NextResponse.next()

  // Add user ID to request headers for API routes to use
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-user-id', decoded.userId)
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|public).*)',
  ],
}
