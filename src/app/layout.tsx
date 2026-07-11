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
  title: "Star IPTV Panel — Funds",
  description: "Reseller funds management panel for Star IPTV. Add credit, manage transactions and review payment methods.",
  keywords: ["IPTV", "reseller panel", "funds", "JazzCash", "Easypaisa", "USDT", "Star IPTV"],
  authors: [{ name: "Star IPTV Store" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Star IPTV Panel — Funds",
    description: "Reseller funds management panel for Star IPTV.",
    siteName: "Star IPTV Panel",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Star IPTV Panel — Funds",
    description: "Reseller funds management panel for Star IPTV.",
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
