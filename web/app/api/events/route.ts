import { NextResponse } from "next/server";
import { getEvents } from "@/lib/data";

export const dynamic = "force-static";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};

/** GET /api/events — fairs, festivals and season windows, month-ordered. */
export function GET() {
  const events = getEvents();
  return NextResponse.json(
    {
      meta: { dataset: "dandak", version: "1.0.0", count: events.length },
      data: events,
    },
    { headers: CORS }
  );
}
