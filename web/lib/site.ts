/**
 * One place for the canonical identity of the site.
 *
 * metadataBase matters more than it looks: without it Next emits relative
 * Open Graph image URLs, and every crawler and chat app that fetches a link
 * preview needs absolute ones. Override with NEXT_PUBLIC_SITE_URL when the
 * custom domain lands, so nothing else has to change.
 */
export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dandak.vercel.app",
  name: "Dandak",
  title: "Dandak — Dang & Narmada Travel Guide",
  description:
    "Waterfalls, forests, the Statue of Unity and living tribal heritage — a verified, source-tracked travel guide to Gujarat's Dang and Narmada districts.",
  /** 1920×1080, the ratio link previews actually want */
  ogImage: "/images/spots/dang-don-hill.jpg",
  locale: "en_IN",
} as const;

/** Absolute URL for a site-relative path. */
export function abs(path: string): string {
  return new URL(path, SITE.url).toString();
}
