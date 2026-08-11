import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { MotionProvider } from "@/components/motion-provider";
import "leaflet/dist/leaflet.css";
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
  title: {
    default: "Dandak — Dang & Narmada Travel Guide",
    template: "%s | Dandak",
  },
  description:
    "Waterfalls, forests, the Statue of Unity and living tribal heritage — a verified travel dataset for Gujarat's Dang and Narmada districts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-stone-200">
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
