import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
import { PwaHead } from "@/components/PwaHead";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Tabular figures for DOB, vitals, and legacy IDs. */
const tabularMono = Public_Sans({
  variable: "--font-tabular-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Christ Medical",
  description: "Multi-tenant mission clinical workspace (PWA)",
  applicationName: "Christ Medical",
  formatDetection: { telephone: false },
};

/** Default until `PwaHead` sets tenant theme client-side. */
export const viewport: Viewport = {
  themeColor: "#cd7f32",
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
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${publicSans.variable} ${tabularMono.variable} antialiased`}
      >
        <PwaHead />
        <ConnectivityBanner />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
