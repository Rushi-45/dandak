// Fetch real driving geometry for every curated itinerary day and emit
// web/lib/routes.json, so trip pages draw roads instead of straight lines
// without any request at page load.
//
// Run once (or re-run after editing an itinerary): node scripts/fetch-routes.mjs
//
// Routing comes from OSRM over OpenStreetMap data - ODbL, and the map credits
// OpenStreetMap. `overview=simplified` is deliberate: for one five-stop day it
// returns 58 points in 2.7 KB where `full` returns 3472 points in 77 KB, with
// an identical distance. At the zooms these maps use, nobody can tell.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OSRM = "https://router.project-osrm.org/route/v1/driving";
const UA = "dandak-dataset/1.0 (github.com/Rushi-45/dandak; contact: rushi.positive@gmail.com)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

function readDir(dir) {
  const full = path.join(ROOT, "data", dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(full, f)));
}

const spots = new Map();
for (const d of ["spots/dang", "spots/narmada"]) {
  for (const s of readDir(d)) spots.set(s.id, s);
}
const itineraries = readDir("itineraries");
console.log(`${spots.size} spots, ${itineraries.length} itineraries`);

/** One OSRM call for an ordered list of [lat, lng]. Returns [lat, lng][] or null. */
async function route(points) {
  if (points.length < 2) return null;
  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `${OSRM}/${coords}?overview=simplified&geometries=geojson`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const j = await res.json();
      if (j.code !== "Ok" || !j.routes?.length) throw new Error(`OSRM ${j.code}`);
      const r = j.routes[0];
      return {
        points: r.geometry.coordinates.map(([lng, lat]) => [round(lat), round(lng)]),
        km: Math.round((r.distance / 1000) * 10) / 10,
        min: Math.round(r.duration / 60),
      };
    } catch (e) {
      console.log(`    retry ${attempt + 1} (${e.message})`);
      await sleep(4000);
    }
  }
  return null;
}

const round = (n) => Math.round(n * 1e5) / 1e5;

const out = {};
let calls = 0;
let missing = 0;

for (const it of itineraries) {
  const days = {};
  const byDay = new Map();
  for (const stop of it.stops) {
    if (!byDay.has(stop.day)) byDay.set(stop.day, []);
    byDay.get(stop.day).push(stop);
  }

  for (const [day, list] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    const pts = list
      .sort((a, b) => a.order - b.order)
      .map((s) => spots.get(s.spot_id))
      .filter(Boolean)
      .map((s) => [s.location.coordinates.lat, s.location.coordinates.lng]);

    if (pts.length < 2) continue;
    const r = await route(pts);
    calls++;
    await sleep(1200); // the OSRM demo server is a shared community resource
    if (!r) {
      missing++;
      console.log(`  ${it.slug} day ${day}: FAILED - page will fall back to straight lines`);
      continue;
    }
    days[day] = r.points;
    console.log(
      `  ${it.slug} day ${day}: ${r.points.length} pts, ${r.km} km, ${r.min} min (${pts.length} stops)`
    );
  }
  if (Object.keys(days).length) out[it.slug] = days;
}

const payload = {
  _license: "Route geometry derived from OpenStreetMap via OSRM, ODbL 1.0 - simplified",
  fetched: new Date().toISOString().slice(0, 10),
  routes: out,
};
const dest = path.join(ROOT, "web", "lib", "routes.json");
writeFileSync(dest, JSON.stringify(payload));
const kb = Math.round(JSON.stringify(payload).length / 1024);
console.log(
  `\nWrote ${dest} (${kb} KB) - ${Object.keys(out).length} itineraries, ${calls} routed, ${missing} failed`
);
