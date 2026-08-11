import type { MetadataRoute } from "next";
import { getAllSpots, getItineraries } from "@/lib/data";
import { SITE } from "@/lib/site";

/**
 * Every page the site wants found. The dataset already tracks when a record was
 * last verified, so lastModified is a real date rather than build time — which
 * means a crawler re-reads what actually changed instead of the whole corpus.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const spots = getAllSpots();
  const itineraries = getItineraries();
  const today = spots
    .map((s) => s.provenance.last_verified ?? s.provenance.created)
    .sort()
    .at(-1);

  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: SITE.url, changeFrequency: "weekly", priority: 1 },
      { url: `${SITE.url}/spots`, changeFrequency: "weekly", priority: 0.9 },
      { url: `${SITE.url}/itineraries`, changeFrequency: "monthly", priority: 0.9 },
      { url: `${SITE.url}/plan`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${SITE.url}/stays`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${SITE.url}/map`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE.url}/events`, changeFrequency: "monthly", priority: 0.7 },
      { url: `${SITE.url}/districts/dang`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${SITE.url}/districts/narmada`, changeFrequency: "monthly", priority: 0.8 },
    ] as const
  ).map((p) => ({ ...p, lastModified: today }));

  return [
    ...staticPages,
    ...spots.map((s) => ({
      url: `${SITE.url}/spots/${s.district}/${s.slug}`,
      lastModified: s.provenance.last_verified ?? s.provenance.created,
      changeFrequency: "monthly" as const,
      // the ones we have photographed and verified are the ones worth ranking
      priority: s.provenance.confidence === "high" ? 0.8 : 0.6,
    })),
    ...itineraries.map((i) => ({
      url: `${SITE.url}/itineraries/${i.slug}`,
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
