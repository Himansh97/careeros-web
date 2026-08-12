import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The display face, used with restraint — page titles and the score assay only.
 *
 * Everything was Geist Sans, which is a fine neutral and also the reason the
 * app read as any Next.js dashboard built this year. Bricolage is a grotesque
 * with deliberately imperfect proportions; on a product whose entire claim is
 * that a human verified every number, a face that looks drawn rather than
 * generated is the right one. Deliberately not a high-contrast serif — that is
 * the default gesture, not a choice.
 */
const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerOS",
  // Names what it does, not what it is built from.
  description: "Find roles worth applying to, and know why.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
