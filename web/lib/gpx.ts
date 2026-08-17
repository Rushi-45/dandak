/**
 * GPX 1.1 for a planned trip: one track per day, one named waypoint per stop.
 *
 * Why this exists: the interior has no signal, and this dataset says so itself
 * (Temburgartha's ridge doubles as the local phone-signal point). A GPX opens
 * in OsmAnd or Organic Maps, both offline-first, which is exactly what the
 * audience driving into that country carries. The print view keeps the plan
 * legible on paper; this keeps it navigable on a phone with no network.
 *
 * Pure string-in, string-out so it tests without a browser. The caller decides
 * what geometry each day carries: the routed road polyline when OSRM has
 * answered, else the straight waypoint chain, the same fallback the map draws.
 */

export interface GpxStop {
  /** already globally numbered by the planner */
  order: number;
  name: string;
  lat: number;
  lng: number;
}

export interface GpxDay {
  day: number;
  /** [lat, lng] pairs, drawn in order */
  points: [number, number][];
  stops: GpxStop[];
}

/** The five XML metacharacters; GPX names carry "&" constantly ("Baaj Waterfall & View Point"). */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const coord = (n: number) => n.toFixed(5);

export function buildGpx(name: string, days: GpxDay[]): string {
  const lines: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<gpx version="1.1" creator="dandak.vercel.app" xmlns="http://www.topografix.com/GPX/1/1">`,
    `  <metadata><name>${escapeXml(name)}</name></metadata>`,
  ];

  // waypoints first: they are what an offline maps app lists and searches
  for (const d of days) {
    for (const s of d.stops) {
      lines.push(
        `  <wpt lat="${coord(s.lat)}" lon="${coord(s.lng)}"><name>${escapeXml(`#${s.order} ${s.name}`)}</name></wpt>`
      );
    }
  }

  for (const d of days) {
    if (d.points.length < 2) continue;
    lines.push(`  <trk><name>${escapeXml(`Day ${d.day}`)}</name><trkseg>`);
    for (const [lat, lng] of d.points) {
      lines.push(`    <trkpt lat="${coord(lat)}" lon="${coord(lng)}"/>`);
    }
    lines.push(`  </trkseg></trk>`);
  }

  lines.push(`</gpx>`);
  return lines.join("\n");
}
