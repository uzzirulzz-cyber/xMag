import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MaGx World Super IPTV — Reseller Panel",
  description: "MaGx World Super IPTV reseller panel. Add funds, manage IPTV lines, browse 18,000+ channels and automate payments.",
  keywords: ["MaGx", "IPTV", "reseller panel", "funds", "JazzCash", "Easypaisa", "USDT", "Bank Alfalah", "Super IPTV"],
  authors: [{ name: "MaGx World Super IPTV" }],
  icons: {
    icon: "/magx-icon.png",
    apple: "/magx-icon.png",
  },
  openGraph: {
    title: "MaGx World Super IPTV — Reseller Panel",
    description: "Reseller funds, IPTV lines, 18,000+ channels, and payment automation.",
    siteName: "MaGx World Super IPTV",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MaGx World Super IPTV — Reseller Panel",
    description: "Reseller funds, IPTV lines, 18,000+ channels, and payment automation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
