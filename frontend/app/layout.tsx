import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaHead } from "@/components/PwaHead";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Christ Medical",
  description: "Multi-tenant mission clinical workspace (PWA)",
  applicationName: "Christ Medical",
  formatDetection: { telephone: false },
};

/** Default until `PwaHead` sets tenant theme client-side. */
export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaHead />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
