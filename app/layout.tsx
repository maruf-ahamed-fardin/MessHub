import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "MessHub", template: "%s | MessHub" },
  description: "Manage your mess — meals, expenses, bazar, payments, and community all in one place.",
  keywords: ["mess management", "expense tracker", "meal tracker", "bazar", "settlement"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MessHub",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "MessHub",
    title: "MessHub — Digital Mess Management",
    description: "Your mess, digitally managed.",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B4FBF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <TooltipProvider delay={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
