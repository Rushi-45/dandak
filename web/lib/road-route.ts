/**
 * Live road geometry for planner routes.
 *
 * The curated trips get their geometry baked at build time by
 * scripts/fetch-routes.mjs, but /plan builds arbitrary routes, so those have to
 * be fetched in the browser. OSRM sends `Access-Control-Allow-Origin: *`, so a
 * static site can call it directly, no server, no API key.
 *
 * `overview=simplified` keeps a five-stop day to ~58 points / 2.7 KB and ~200 ms,
 * against 3472 points / 77 KB for the full geometry at the same distance.
 *
 * Every failure path is silent on purpose: the map already draws straight lines
 * and says so, which is a worse map, not a broken one. This is a shared
 * community server with no SLA, so it must never be load-bearing.
 */
const OSRM = "https://router.project-osrm.org/route/v1/driving";

export interface RoadLeg {
  points: [number, number][];
  km: number;
  min: number;
}

/** Same waypoints → same answer, so never ask twice in a session. */
const cache = new Map<string, RoadLeg | null>();

const keyOf = (waypoints: [number, number][]) =>
  waypoints.map(([a, b]) => `${a.toFixed(4)},${b.toFixed(4)}`).join(";");

export async function fetchRoadRoute(
  waypoints: [number, number][],
  signal?: AbortSignal
): Promise<RoadLeg | null> {
  if (waypoints.length < 2) return null;
  const key = keyOf(waypoints);
  if (cache.has(key)) return cache.get(key)!;

  // OSRM caps the URL, and a day never has more than 8 stops plus two endpoints
  if (waypoints.length > 12) return null;

  try {
    const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const res = await fetch(`${OSRM}/${coords}?overview=simplified&geometries=geojson`, {
      signal,
    });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = await res.json();
    if (json.code !== "Ok" || !json.routes?.length) throw new Error(`OSRM ${json.code}`);
    const r = json.routes[0];
    const leg: RoadLeg = {
      points: (r.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
      km: r.distance / 1000,
      min: Math.round(r.duration / 60),
    };
    cache.set(key, leg);
    return leg;
  } catch (err) {
    // an aborted request is a superseded one, not a failure, don't poison the cache
    if ((err as Error)?.name !== "AbortError") cache.set(key, null);
    return null;
  }
}
