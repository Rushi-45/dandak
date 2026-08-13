import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { MotionProvider } from "@/components/motion-provider";
import { SITE, abs } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s | Dandak",
  },
  description: SITE.description,
  applicationName: SITE.name,
  // No canonical here on purpose. Metadata is inherited, so a canonical on the
  // root layout makes every page that does not override it claim to be the
  // homepage — which told Google that /spots, /stays, /map, /events,
  // /itineraries, /plan and both districts were all duplicates of "/". Each
  // page declares its own; see app/page.tsx for the homepage's.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: "Don hill, interior Dang" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  /**
   * Search Console / Bing verification, from the environment rather than the
   * source. A *.vercel.app subdomain cannot be verified by DNS — we do not own
   * the zone — so the meta tag is the route. Set GOOGLE_SITE_VERIFICATION (and
   * BING_SITE_VERIFICATION) in the Vercel project and redeploy; no code change,
   * and the tokens stay out of a public repo.
   */
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : {},
  },
  category: "travel",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-stone-200">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": abs("/#website"),
                url: SITE.url,
                name: SITE.name,
                description: SITE.description,
                inLanguage: "en-IN",
                publisher: { "@id": abs("/#publisher") },
              },
              {
                "@type": "Organization",
                "@id": abs("/#publisher"),
                name: SITE.name,
                url: SITE.url,
                description:
                  "An open, provenance-tracked tourism dataset for the Dandakaranya belt of Gujarat.",
                sameAs: ["https://github.com/Rushi-45/dandak"],
              },
            ],
          }}
        />
        <MotionProvider>
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080c0b]/75 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3.5 sm:gap-6">
              <Link
                href="/"
                className="shrink-0 bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text font-serif text-xl font-black italic tracking-tight text-transparent"
              >
                dandak
              </Link>
              {/* Six links no longer fit a 390px phone. Scroll the nav rather than
                  drop a section from it — [&>a]:shrink-0 stops flex squeezing them. */}
              <nav className="no-scrollbar flex min-w-0 items-center gap-4 overflow-x-auto text-sm text-stone-400 [&>a]:shrink-0 sm:gap-5">
                <Link href="/spots" className="transition-colors hover:text-emerald-300">
                  Spots
                </Link>
                <Link href="/itineraries" className="transition-colors hover:text-emerald-300">
                  Trips
                </Link>
                <Link href="/map" className="transition-colors hover:text-emerald-300">
                  Map
                </Link>
                <Link href="/plan" className="transition-colors hover:text-emerald-300">
                  Plan
                </Link>
                <Link href="/stays" className="transition-colors hover:text-emerald-300">
                  Stays
                </Link>
                <Link href="/events" className="transition-colors hover:text-emerald-300">
                  Events
                </Link>
                <Link href="/districts/dang" className="hidden transition-colors hover:text-emerald-300 sm:block">
                  Dang
                </Link>
                <Link href="/districts/narmada" className="hidden transition-colors hover:text-emerald-300 sm:block">
                  Narmada
                </Link>
              </nav>
              <a
                href="https://github.com/Rushi-45/dandak"
                className="ml-auto hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-stone-400 transition-colors hover:border-emerald-400/40 hover:text-emerald-300 sm:block"
                target="_blank"
                rel="noopener noreferrer"
              >
                v1.0 · GitHub
              </a>
            </div>
          </header>
          <main className="flex-1 overflow-x-clip">{children}</main>
          <footer className="relative mt-24 overflow-hidden border-t border-white/[0.06] pb-10 pt-14">
            <p
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -bottom-10 select-none text-center font-serif text-[26vw] font-black italic leading-none text-stroke sm:text-[18vw]"
            >
              dandak
            </p>
            <div className="relative text-center text-xs text-stone-500">
              <p className="mx-auto max-w-xl px-4 leading-relaxed">
                <span className="bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text font-serif font-bold italic text-transparent">
                  dandak
                </span>{" "}
                — an open, provenance-tracked tourism dataset for the Dandakaranya belt. Facts
                carry confidence levels; verify volatile details before you travel.
              </p>
              <p className="mt-2 px-4 text-[11px] text-stone-600">
                Photography by contributors on Wikimedia Commons (CC BY / CC BY-SA) — credited and
                linked on every image.
              </p>
            </div>
          </footer>
        </MotionProvider>
      </body>
    </html>
  );
}
