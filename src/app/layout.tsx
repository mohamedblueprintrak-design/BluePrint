import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

// Geist Sans - Primary font for English/Latin text
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Geist Mono - Monospace font for code
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Noto Sans Arabic - Font for Arabic text
const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Viewport configuration for mobile responsiveness
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Metadata for SEO
export const metadata: Metadata = {
  title: {
    default: "BluePrint - نظام إدارة الاستشارات الهندسية",
    template: "%s | BluePrint",
  },
  description: "نظام إدارة متكامل لشركات الاستشارات الهندسية - إدارة المشاريع، الفواتير، العقود، والمزيد",
  keywords: [
    "BluePrint",
    "Engineering Consultancy",
    "Project Management",
    "إدارة المشاريع",
    "استشارات هندسية",
    "فواتير",
    "عقود",
    "BluePrint Engineering",
  ],
  authors: [{ name: "BluePrint Team", url: "https://blueprint.engineering" }],
  creator: "BluePrint Engineering Consultancy",
  publisher: "BluePrint Engineering Consultancy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
    languages: {
      "ar-SA": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "BluePrint - نظام إدارة الاستشارات الهندسية",
    description: "نظام إدارة متكامل لشركات الاستشارات الهندسية",
    url: "/",
    siteName: "BluePrint",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BluePrint - نظام إدارة الاستشارات الهندسية",
    description: "نظام إدارة متكامل لشركات الاستشارات الهندسية",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ar" 
      dir="rtl" 
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          ${notoSansArabic.variable}
          font-sans
          antialiased 
          bg-background 
          text-foreground
          min-h-screen
          selection:bg-primary/20
        `}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
