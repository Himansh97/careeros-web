import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Noto_Sans_Devanagari } from "next/font/google";
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
 * Archivo is a grotesque with a genuine expanded axis, which is the vernacular
 * of NASA signage and of the 1975 Graphics Standards Manual that this palette
 * comes from. It replaces Bricolage, which was chosen for a different brief:
 * Bricolage's charm is that it looks hand-drawn, and nothing about flight
 * operations is hand-drawn.
 *
 * Deliberately not a high-contrast serif — that is the default gesture rather
 * than a choice, and it would read as a magazine, not an instrument.
 */
const displayFont = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Devanagari, for the Hindi layer on concept cards.
 *
 * Geist, Geist Mono and Archivo all load `subsets: ["latin"]` and carry no
 * Devanagari glyphs at all, so Hindi set in them renders as tofu boxes or falls
 * through to whatever the OS happens to have. A second script needs a second
 * face; there is no way around it.
 *
 * Applied through `.font-devanagari` rather than the body stack, because it is
 * wanted on specific passages and nowhere else.
 */
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
