import { NextResponse } from "next/server";
import { getItineraries } from "@/lib/data";

export const dynamic = "force-static";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

/** GET /api/itineraries â€” all trips with their stops (spot ids resolve via /api/spots). */
export function GET() {
  const itineraries = getItineraries();
  return NextResponse.json(
    {
      meta: { dataset: "dandak", version: "1.1.0", count: itineraries.length },
      data: itineraries,
    },
    { headers: CORS }
  );
}
