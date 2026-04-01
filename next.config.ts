import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable X-Powered-By header for security
  poweredByHeader: false,

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Disable React Strict Mode to prevent double-render issues in dev
  reactStrictMode: false,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.stripe.com' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : [appUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'];

    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: isDev ? '*' : allowedOrigins.join(', ') },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type, Accept, X-Requested-With, X-HTTP-Method-Override, Cache-Control, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-CSRF-Token' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none';" },
        ],
      },
      {
        source: '/((?!api/).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          ...(isDev ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }]),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // NOTE: experimental.optimizePackageImports is intentionally REMOVED.
  // It causes "Cannot read properties of undefined (reading 'call')" Webpack error
  // on Windows with Next.js 15.x. If re-added, it will break the dev server.

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'BluePrint',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Redirects
  async redirects() {
    return [
      { source: '/home', destination: '/dashboard', permanent: true },
    ];
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
