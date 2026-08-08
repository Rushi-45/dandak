import { NextResponse } from "next/server";
import { getAllSpots } from "@/lib/data";

export const dynamic = "force-static";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

/** GET /api/spots — slim list of all spots. Filter client-side; full records at /api/spots/{district}/{slug}. */
export function GET() {
  const spots = getAllSpots().map((s) => ({
    id: s.id,
    slug: s.slug,
    district: s.district,
    name: s.name.en,
    category: s.category,
    cluster: s.cluster,
    tags: s.tags,
    summary: s.summary,
    coordinates: s.location.coordinates,
    best_months: s.seasonality.best_months,
    monsoon_dependent: s.seasonality.monsoon_dependent,
    confidence: s.provenance.confidence,
    last_verified: s.provenance.last_verified,
    url: `/spots/${s.district}/${s.slug}`,
    api: `/api/spots/${s.district}/${s.slug}`,
  }));

  return NextResponse.json(
    {
      meta: {
        dataset: "dandak",
        version: "1.0.0",
        count: spots.length,
        license: "Data compiled from public sources; verify volatile facts. Images CC BY / CC BY-SA via Wikimedia Commons.",
        source: "https://github.com/Rushi-45/dandak",
      },
      data: spots,
    },
    { headers: CORS }
  );
}
