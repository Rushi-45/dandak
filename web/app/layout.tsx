import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-stone-200">
        <MotionProvider>
          {/* gradient hairline */}
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080c0b]/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3.5">
              <Link
                href="/"
                className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-lg font-black tracking-tight text-transparent"
              >
                dandak
              </Link>
              <nav className="flex items-center gap-5 text-sm text-stone-400">
                <Link href="/spots" className="transition-colors hover:text-emerald-300">
                  All spots
                </Link>
                <Link href="/spots#dang" className="transition-colors hover:text-emerald-300">
                  Dang
                </Link>
                <Link href="/spots#narmada" className="transition-colors hover:text-emerald-300">
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
          <main className="flex-1">{children}</main>
          <footer className="mt-20 border-t border-white/[0.06] py-10 text-center text-xs text-stone-500">
            <p className="mx-auto max-w-xl px-4 leading-relaxed">
              <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text font-bold text-transparent">
                dandak
              </span>{" "}
              — an open, provenance-tracked tourism dataset for the Dandakaranya belt. Facts carry
              confidence levels; verify volatile details before you travel.
            </p>
          </footer>
        </MotionProvider>
      </body>
    </html>
  );
}
