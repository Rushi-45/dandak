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
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900">
        <MotionProvider>
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3">
              <Link href="/" className="text-lg font-bold tracking-tight text-emerald-900">
                dandak
              </Link>
              <nav className="flex gap-4 text-sm text-stone-600">
                <Link href="/spots" className="hover:text-emerald-800">
                  All spots
                </Link>
                <Link href="/spots#dang" className="hover:text-emerald-800">
                  Dang
                </Link>
                <Link href="/spots#narmada" className="hover:text-emerald-800">
                  Narmada
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-16 border-t border-stone-200 py-8 text-center text-xs text-stone-400">
            <p className="mx-auto max-w-xl px-4">
              Dandak — an open, provenance-tracked tourism dataset for the Dandakaranya belt. Facts
              carry confidence levels; verify volatile details before you travel.
            </p>
          </footer>
        </MotionProvider>
      </body>
    </html>
  );
}
