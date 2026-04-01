/**
 * @module performance/webpack-config
 * @description Next.js bundle optimization configuration reference and guidelines
 * for the BluePrint SaaS platform. Provides commented configuration examples for
 * chunk splitting, tree shaking, image optimization, font optimization, and
 * dynamic import strategies.
 *
 * IMPORTANT: This file serves as documentation and reference. Apply configurations
 * to `next.config.ts` as needed.
 *
 * @example
 * // To use dynamic imports in your pages:
 * import dynamic from 'next/dynamic';
 * const HeavyChart = dynamic(() => import('@/components/charts/RevenueChart'), {
 *   loading: () => <ChartSkeleton />,
 *   ssr: false,
 * });
 */

// ─── Chunk Splitting Strategy ────────────────────────────────────────────────
//
// Next.js automatically handles code splitting, but you can customize it
// for better caching and loading performance.
//
// Add to next.config.ts:
//
// ```typescript
// const nextConfig = {
//   experimental: {
//     // Optimize chunk loading
//     optimizePackageImports: [
//       'lucide-react',
//       'recharts',
//       'framer-motion',
//       'date-fns',
//       '@radix-ui/react-icons',
//     ],
//   },
//   // Output configuration for standalone deployment
//   output: 'standalone',
// };
//
// module.exports = nextConfig;
// ```
//
// RECOMMENDED CHUNK GROUPS:
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ Group          │ Contents                                               │
// ├──────────────────────────────────────────────────────────────────────────┤
// │ framework      │ React, React DOM, Next.js core (~150KB)               │
// │ commons        │ Shared utilities, shadcn/ui primitives (~80KB)        │
// │ vendors        │ Third-party libs (recharts, framer-motion, etc.)      │
// │ pages          │ Per-page specific code                                 │
// └──────────────────────────────────────────────────────────────────────────┘


// ─── Module Federation Hints ─────────────────────────────────────────────────
//
// For micro-frontend architecture (future consideration):
//
// ```typescript
// // Use dynamic imports with named exports for lazy loading
// const ProjectModule = dynamic(
//   () => import('@blueprint/projects').then(mod => mod.ProjectDashboard),
//   { loading: () => <PageLoader /> }
// );
// ```
//
// RECOMMENDED MODULE BOUNDARIES:
// - Dashboard charts (recharts) → Load on /dashboard only
// - Project management components → Load on /projects/* only
// - Invoice PDF generation → Load on demand (user action)
// - Rich text editor (@mdxeditor/editor) → Load on form focus


// ─── Tree Shaking Optimizations ──────────────────────────────────────────────
//
// Next.js handles tree-shaking automatically, but follow these guidelines:
//
// 1. AVOID BARREL EXPORTS for large modules:
//    ❌ import { Button, Card, Dialog } from '@/components/ui'; // May prevent tree-shaking
//    ✅ import { Button } from '@/components/ui/button';
//    ✅ import { Card } from '@/components/ui/card';
//
// 2. USE NAMED IMPORTS from libraries:
//    ❌ import _ from 'lodash';         // Imports entire library
//    ✅ import { debounce } from 'lodash-es'; // Tree-shakeable
//
// 3. LUCIDE ICONS (already tree-shakeable):
//    ✅ import { Building2, ClipboardList, FileText } from 'lucide-react';
//
// 4. DATE-FNS (already tree-shakeable):
//    ✅ import { format, addDays } from 'date-fns';
//
// 5. RECHARTS (partially tree-shakeable):
//    ✅ import { LineChart, Line, XAxis, YAxis } from 'recharts';
//    Note: Recharts bundles are large. Consider dynamic import for chart pages.


// ─── Image Optimization Settings ─────────────────────────────────────────────
//
// Next.js Image component configuration:
//
// ```typescript
// // next.config.ts
// const nextConfig = {
//   images: {
//     // Remote image domains used in the app
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: '**.blueprint-app.com',
//       },
//     ],
//     // Image formats to optimize
//     formats: ['image/avif', 'image/webp'],
//     // Device sizes for responsive images
//     deviceSizes: [640, 750, 828, 1080, 1200, 1920],
//     // Image sizes for srcset
//     imageSizes: [16, 32, 48, 64, 96, 128, 256],
//   },
// };
// ```
//
// BEST PRACTICES:
// - Always specify `width` and `height` or use `fill` prop
// - Use `priority` only for above-the-fold images (LCP optimization)
// - Use `placeholder="blur"` with blurDataURL for progressive loading
// - Set appropriate `sizes` attribute for responsive images:
//   <Image sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />


// ─── Font Optimization Settings ──────────────────────────────────────────────
//
// Use next/font for automatic font optimization:
//
// ```typescript
// // src/app/layout.tsx
// import { Inter, Cairo } from 'next/font/google';
//
// const inter = Inter({
//   subsets: ['latin'],
//   display: 'swap',
//   variable: '--font-inter',
// });
//
// const cairo = Cairo({
//   subsets: ['arabic'],
//   display: 'swap',
//   variable: '--font-cairo',
//   preload: true, // Only preload the current locale font
// });
//
// // Apply via className on <body>
// // className={`${inter.variable} ${cairo.variable}`}
// ```
//
// FONT LOADING STRATEGY:
// - Preload only the primary font for the current locale
// - Lazy-load the secondary font after hydration
// - Use `display: 'swap'` to prevent FOIT (Flash of Invisible Text)
// - Consider self-hosting fonts for faster loading:
//
// ```typescript
// import localFont from 'next/font/local';
//
// const primaryFont = localFont({
//   src: [
//     { path: '../fonts/Inter-Regular.woff2', weight: '400' },
//     { path: '../fonts/Inter-Bold.woff2', weight: '700' },
//   ],
//   variable: '--font-primary',
//   display: 'swap',
// });
// ```


// ─── Components That Should Use dynamic() Import ─────────────────────────────
//
// Heavy components that should be dynamically imported with loading states:
//
// 1. CHART COMPONENTS (recharts is ~400KB uncompressed):
//    ```typescript
//    const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), {
//      loading: () => <ChartSkeleton />,
//      ssr: false, // Charts typically need browser APIs
//    });
//    const ProjectTimeline = dynamic(() => import('@/components/charts/ProjectTimeline'), {
//      loading: () => <ChartSkeleton />,
//      ssr: false,
//    });
//    ```
//
// 2. RICH TEXT EDITOR (~200KB):
//    ```typescript
//    const MDXEditor = dynamic(() => import('@mdxeditor/editor'), {
//      loading: () => <Skeleton className="h-64 w-full" />,
//      ssr: false,
//    });
//    ```
//
// 3. PDF VIEWER / GENERATOR:
//    ```typescript
//    const PDFViewer = dynamic(() => import('@/components/documents/PDFViewer'), {
//      loading: () => <PageLoader />,
//      ssr: false,
//    });
//    ```
//
// 4. KANBAN BOARD (dnd-kit):
//    ```typescript
//    const KanbanBoard = dynamic(() => import('@/components/projects/KanbanBoard'), {
//      loading: () => <DashboardSkeleton />,
//    });
//    ```
//
// 5. MODAL DIALOGS with heavy content:
//    ```typescript
//    const ProjectDetailsModal = dynamic(
//      () => import('@/components/projects/ProjectDetailsModal'),
//      { loading: () => <Dialog><DialogContent><Skeleton className="h-96" /></DialogContent></Dialog> }
//    );
//    ```
//
// 6. MAP / LOCATION COMPONENTS:
//    ```typescript
//    const ProjectMap = dynamic(() => import('@/components/projects/ProjectMap'), {
//      loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
//      ssr: false,
//    });
//    ```


// ─── Critical CSS Extraction ─────────────────────────────────────────────────
//
// Next.js 15 automatically handles critical CSS extraction and inlining.
// Additional recommendations:
//
// 1. AVOID LARGE INLINE STYLES in components
// 2. USE TAILWIND UTILITIES instead of custom CSS where possible
// 3. LAZY-LOAD COMPONENT STYLES for below-the-fold content
// 4. CONSIDER CSS MODULES for complex, component-specific styles
//
// Tailwind CSS 4 purges unused classes automatically in production.
// Ensure all utility classes are statically analyzable (no dynamic string concatenation).
//
// ❌ className={`text-${size}`} // Cannot be purged
// ✅ className={size === 'lg' ? 'text-lg' : 'text-sm'} // Can be purged


// ─── Bundle Analysis ─────────────────────────────────────────────────────────
//
// To analyze bundle size during development:
//
// ```bash
# Install bundle analyzer
# npm install -D @next/bundle-analyzer
#
# Add to next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# });
#
# module.exports = withBundleAnalyzer(nextConfig);
#
# Then run:
# ANALYZE=true npm run build
# ```

// ─── Recommended next.config.ts Template ─────────────────────────────────────
//
// ```typescript
// import type { NextConfig } from 'next';
//
// const nextConfig: NextConfig = {
//   // Enable standalone output for Docker deployment
//   output: 'standalone',
//
//   // Optimize package imports for smaller bundles
//   experimental: {
//     optimizePackageImports: [
//       'lucide-react',
//       'recharts',
//       'framer-motion',
//       'date-fns',
//     ],
//   },
//
//   // Image optimization
//   images: {
//     formats: ['image/avif', 'image/webp'],
//   },
//
//   // Headers for caching static assets
//   async headers() {
//     return [
//       {
//         source: '/static/:path*',
//         headers: [
//           {
//             key: 'Cache-Control',
//             value: 'public, max-age=31536000, immutable',
//           },
//         ],
//       },
//       {
//         source: '/_next/static/:path*',
//         headers: [
//           {
//             key: 'Cache-Control',
//             value: 'public, max-age=31536000, immutable',
//           },
//         ],
//       },
//     ];
//   },
//
//   // Compression
//   compress: true,
//
//   // Strict mode for better error detection
//   reactStrictMode: true,
// };
//
// export default nextConfig;
// ```

export {};
