import { NextResponse } from "next/server";
import { getAllSpots, getSpot } from "@/lib/data";

export const dynamic = "force-static";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

export function generateStaticParams() {
  return getAllSpots().map((s) => ({ district: s.district, slug: s.slug }));
}

/** GET /api/spots/{district}/{slug}, the full record, straight from the dataset. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ district: string; slug: string }> }
) {
  const { district, slug } = await params;
  const spot = getSpot(district, slug);
  if (!spot) {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: CORS });
  }
  return NextResponse.json(
    { meta: { dataset: "dandak", version: "1.1.0" }, data: spot },
    { headers: CORS }
  );
}
