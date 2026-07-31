/**
 * Copyright (C) 2026 Jamey McElveen
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This file is part of Christ Medical.
 * Christ Medical is free software under the GNU Affero General Public License
 * v3.0 or later. See the LICENSE file or <https://www.gnu.org/licenses/>.
 */

import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { ConnectivityBanner } from "@/components/ConnectivityBanner";
import { FeedbackModeHost } from "@/components/feedback/FeedbackModeHost";
import { PwaHead } from "@/components/PwaHead";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { CHRIST_MEDICAL_ICONS } from "@/lib/branding";
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
  icons: {
    icon: [
      { url: CHRIST_MEDICAL_ICONS.favicon32, sizes: "32x32", type: "image/png" },
      { url: CHRIST_MEDICAL_ICONS.pwa192, sizes: "192x192", type: "image/png" },
      { url: CHRIST_MEDICAL_ICONS.pwa512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: CHRIST_MEDICAL_ICONS.appleTouch, sizes: "180x180", type: "image/png" }],
  },
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
        <FeedbackModeHost />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
