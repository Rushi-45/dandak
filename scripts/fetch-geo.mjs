// Fetch district boundaries + main rivers from OpenStreetMap (Overpass),
// stitch, simplify, and emit web/lib/geo.json for the schematic maps.
// Run once (or re-run to refresh): node scripts/fetch-geo.mjs
// Output is ODbL - the map UI must credit OpenStreetMap contributors.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const UA = "dandak-dataset/1.0 (github.com/Rushi-45/dandak; contact: rushi.positive@gmail.com)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = MIRRORS[attempt % MIRRORS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error(`Overpass ${res.status} @ ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      console.log(`  retry ${attempt + 1} (${e.message})...`);
      await sleep(12000);
    }
  }
  throw lastErr;
}

// --- Douglas-Peucker simplification on [lat, lng] points ---
function perpDist(p, a, b) {
  const dx = b[1] - a[1];
  const dy = b[0] - a[0];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[1] - a[1], p[0] - a[0]);
  return Math.abs(dx * (a[0] - p[0]) - dy * (a[1] - p[1])) / len;
}
function simplify(points, tol) {
  if (points.length <= 2) return points;
  let maxD = 0;
  let idx = 0;
  const last = points.length - 1;
  for (let i = 1; i < last; i++) {
    const d = perpDist(points[i], points[0], points[last]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= tol) return [points[0], points[last]];
  const left = simplify(points.slice(0, idx + 1), tol);
  const right = simplify(points.slice(idx), tol);
  return left.slice(0, -1).concat(right);
}

const r5 = (n) => Math.round(n * 1e5) / 1e5;

// --- stitch a relation's outer ways into closed rings ---
function stitchRings(members) {
  const ways = members
    .filter((m) => m.type === "way" && (m.role === "outer" || m.role === "") && m.geometry)
    .map((m) => m.geometry.map((g) => [g.lat, g.lon]));
  const rings = [];
  const pool = ways.slice();
  const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7;
  while (pool.length) {
    let ring = pool.shift().slice();
    let grew = true;
    while (grew && !same(ring[0], ring[ring.length - 1])) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const w = pool[i];
        const end = ring[ring.length - 1];
        if (same(w[0], end)) {
          ring = ring.concat(w.slice(1));
        } else if (same(w[w.length - 1], end)) {
          ring = ring.concat(w.slice(0, -1).reverse());
        } else if (same(w[w.length - 1], ring[0])) {
          ring = w.slice(0, -1).concat(ring);
        } else if (same(w[0], ring[0])) {
          ring = w.slice(1).reverse().concat(ring);
        } else {
          continue;
        }
        pool.splice(i, 1);
        grew = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

console.log("Fetching district boundaries...");
const boundaries = await overpass(`
[out:json][timeout:120];
area["name"="Gujarat"]["admin_level"="4"]->.gj;
(
  relation(area.gj)["boundary"="administrative"]["admin_level"~"^(5|6)$"]["name"~"^(The Dangs|Dang|Dangs|Narmada)$"];
);
out geom;
`);

const districts = [];
for (const rel of boundaries.elements) {
  const name = /dang/i.test(rel.tags?.name ?? "") ? "dang" : "narmada";
  const rings = stitchRings(rel.members ?? [])
    .map((ring) => simplify(ring, 0.0035).map(([a, b]) => [r5(a), r5(b)]))
    .filter((ring) => ring.length >= 8);
  if (rings.length) {
    districts.push({ name, osm_relation: rel.id, rings });
    console.log(
      `  ${rel.tags.name} (rel ${rel.id}, level ${rel.tags.admin_level}): ${rings.length} ring(s), ${rings.reduce((a, r) => a + r.length, 0)} pts`
    );
  }
}

console.log("Fetching rivers...");
let riversRaw = { elements: [] };
try {
  riversRaw = await overpass(`
[out:json][timeout:180];
(
  way["waterway"="river"]["name"~"Purna|Gira|Ambika|Karjan",i](20.30,73.00,21.30,74.10);
  way["waterway"="river"]["name"~"Narmada"](21.45,73.00,22.15,74.10);
);
out geom;
`);
} catch (e) {
  console.log(`  rivers unavailable (${e.message}) - emitting districts only`);
}

const riverMap = new Map();
for (const w of riversRaw.elements) {
  if (!w.geometry) continue;
  const name = (w.tags?.name ?? "river").toLowerCase().includes("narmada")
    ? "Narmada"
    : w.tags?.name ?? "river";
  const pts = simplify(w.geometry.map((g) => [g.lat, g.lon]), 0.003).map(([a, b]) => [r5(a), r5(b)]);
  if (pts.length < 3) continue;
  if (!riverMap.has(name)) riverMap.set(name, []);
  riverMap.get(name).push(pts);
}
const rivers = [...riverMap.entries()].map(([name, segments]) => ({ name, segments }));
for (const r of rivers) {
  console.log(`  ${r.name}: ${r.segments.length} segment(s), ${r.segments.reduce((a, s) => a + s.length, 0)} pts`);
}

const out = {
  _license: "Boundary and river geometry (c) OpenStreetMap contributors, ODbL 1.0 - simplified",
  fetched: new Date().toISOString().slice(0, 10),
  districts,
  rivers,
};

const dest = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "web", "lib", "geo.json");
writeFileSync(dest, JSON.stringify(out));
const kb = Math.round(JSON.stringify(out).length / 1024);
console.log(`\nWrote ${dest} (${kb} KB)`);
