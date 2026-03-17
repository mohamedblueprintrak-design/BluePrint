import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Enhanced Metadata with Arabic support
export const metadata: Metadata = {
  title: {
    default: "BluePrint | نظام إدارة الاستشارات الهندسية",
    template: "%s | BluePrint"
  },
  description: "منصة متكاملة لإدارة مكاتب الاستشارات الهندسية - المشاريع، العقود، الفواتير، الموارد البشرية والمزيد",
  keywords: [
    "الاستشارات الهندسية",
    "إدارة المشاريع",
    "الفواتير",
    "العقود",
    "إدارة الموارد",
    "Engineering Consultancy",
    "Project Management",
    "ERP",
    "SaaS"
  ],
  authors: [{ name: "BluePrint Team" }],
  creator: "BluePrint",
  publisher: "BluePrint",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "BluePrint | نظام إدارة الاستشارات الهندسية",
    description: "منصة متكاملة لإدارة مكاتب الاستشارات الهندسية",
    url: "https://blueprint.app",
    siteName: "BluePrint",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BluePrint | نظام إدارة الاستشارات الهندسية",
    description: "منصة متكاملة لإدارة مكاتب الاستشارات الهندسية",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}
      >
        {children}
        {/* Toast notifications */}
        <Toaster />
        <Sonner position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
