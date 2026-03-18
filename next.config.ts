import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
  
  // TypeScript configuration - DO NOT ignore build errors in production
  typescript: {
    // Only ignore build errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.stripe.com',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
  },
  
  // Security headers - Enhanced for production security
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // HTTP Strict Transport Security - Only in production
          ...(isDev ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }]),
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
    // Server actions configuration
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Turbopack - DISABLED for Netlify compatibility
  // Netlify's plugin doesn't fully support Turbopack yet
  // turbopack: {},
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'BluePrint',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Redirects for common routes
  async redirects() {
    return [
      // Redirect old routes if any
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Rewrite rules for API routes
  async rewrites() {
    return [
      // Keep API routes intact
    ];
  },
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
