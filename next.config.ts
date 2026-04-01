import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // CRITICAL FIX: These packages are server-only and must NOT be bundled for the client.
  // If webpack tries to bundle them client-side, chunk resolution fails with
  // "Cannot read properties of undefined (reading 'call')" during RSC deserialization.
  serverExternalPackages: [
    'bcryptjs',       // Password hashing (was incorrectly listed as 'bcrypt')
    'winston',        // Logging framework
    'winston-daily-rotate-file', // Winston transport
    'redis',          // Redis client (used by rate limiter)
    'socket.io',      // Server-side WebSocket library
    'jsonwebtoken',   // JWT signing/verification
    'nodemailer',     // Email sending
    'sharp',          // Image processing
    '@prisma/client', // Prisma database client
    'jspdf',          // PDF generation (CJS, problematic in client bundle)
    'jspdf-autotable',// PDF table generation
  ],

  // CRITICAL FIX: Webpack configuration to prevent chunk loading failures
  // - Ensures server-only modules are not bundled for client
  // - Prevents undefined module factories in RSC chunk loading
  webpack: (config, { isServer }) => {
    // Prevent webpack from trying to bundle server-only modules on client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        path: false,
        crypto: false,
      };
    }

    // Ensure consistent chunk IDs to prevent RSC module resolution failures
    config.optimization = {
      ...config.optimization,
      chunkIds: 'named',
      moduleIds: 'named',
    };

    return config;
  },

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

  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'BluePrint',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  async redirects() {
    return [
      { source: '/home', destination: '/dashboard', permanent: true },
    ];
  },

  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
