import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaServiceWorkerRegister } from "@/components/shared/PwaServiceWorkerRegister";
import { PreferencesProvider } from "@/lib/context/PreferencesContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "MessHub", template: "%s | MessHub" },
  description: "Manage your mess — meals, expenses, bazar, payments, and community all in one place.",
  keywords: ["mess management", "expense tracker", "meal tracker", "bazar", "settlement"],
  manifest: "/manifest.json",
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
  themeColor: "#4f46e5",
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
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <PreferencesProvider>
          <TooltipProvider delay={300}>
            {children}
            <Toaster />
            <PwaServiceWorkerRegister />
          </TooltipProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
