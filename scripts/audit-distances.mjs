// Replace hand-estimated road distances with routed ones.
//
//   node scripts/audit-distances.mjs            report only
//   node scripts/audit-distances.mjs --apply    rewrite the records
//
// 61 of 106 records list "location.distances_km" under needs_verification, and
// spot checks against OSRM and Valhalla (which agree with each other to within
// 0.3 km) showed the curated figures off in both directions - Saputara->Girmal
// read 60 against 79.5 routed, Surat->Girmal 160 against 132.
//
// Two traps, both found by running this and reading the output:
//
// 1. SNAP GAPS DO NOT ADD. OSRM moves each pin to the nearest routable road;
//    for a waterfall at the end of an unmapped track that can be kilometres.
//    Adding both endpoints' gaps back looks reasonable until two pins sit in
//    the same unmapped pocket and snap to nearly the same road node - then the
//    gap is counted twice for places a few hundred metres apart. It turned
//    Saputara Lake -> Nageshwar temple, genuinely 0.3 km, into 5 km. So gaps
//    are never added. The road distance is clamped up to the straight line
//    between the real pins, which is a floor no road can beat, and pairs whose
//    gap exceeds TRUST_SNAP_M are left at their curated value rather than
//    guessed at.
//
// 2. THE RECORDS ARE HAND-FORMATTED. They inline short arrays, so
//    JSON.stringify would reformat all 106 files and bury the change. Numbers
//    are patched in the text instead, leaving every other byte untouched.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const OSRM = "https://router.project-osrm.org/table/v1/driving";
const UA = "dandak-dataset/1.0 (github.com/Rushi-45/dandak; contact: rushi.positive@gmail.com)";
const TRUST_SNAP_M = 2000; // beyond this the routed pair is not about our pins
const MAX_TABLE = 100; // demo server's max-table-size

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// ------------------------------------------------------- surgical text edits

/** Span of the {...} or [...] that starts at or after `from`. */
function braceSpan(text, from, open = "{", close = "}") {
  const start = text.indexOf(open, from);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

/** Replace `"key": <number>` inside [start,end) of text. Returns new text or null. */
function patchNumber(text, span, key, next) {
  const slice = text.slice(span.start, span.end);
  const re = new RegExp(`("${key}"\\s*:\\s*)(-?\\d+(?:\\.\\d+)?)`);
  if (!re.test(slice)) return null;
  const patched = slice.replace(re, `$1${next}`);
  return text.slice(0, span.start) + patched + text.slice(span.end);
}

function findKeySpan(text, key, open = "{", close = "}") {
  const at = text.indexOf(`"${key}"`);
  if (at < 0) return null;
  return braceSpan(text, at + key.length + 2, open, close);
}

/** Within the nearby[] array, the object whose "id" is `id`. */
function nearbyEntrySpan(text, id) {
  const arr = findKeySpan(text, "nearby", "[", "]");
  if (!arr) return null;
  let cursor = arr.start;
  while (cursor < arr.end) {
    const obj = braceSpan(text, cursor, "{", "}");
    if (!obj || obj.start >= arr.end) return null;
    if (text.slice(obj.start, obj.end).includes(`"${id}"`)) return obj;
    cursor = obj.end;
  }
  return null;
}

/**
 * Drop one string element from a JSON string array, keeping the file's own
 * layout. These arrays are written inline, so a naive regex that splices in a
 * newline leaves `["a",\n  "b"]` behind - rebuild instead of patching.
 */
function removeArrayString(text, key, value) {
  const arr = findKeySpan(text, key, "[", "]");
  if (!arr) return null;
  const slice = text.slice(arr.start, arr.end);
  let items;
  try {
    items = JSON.parse(slice);
  } catch {
    return null;
  }
  if (!Array.isArray(items) || !items.includes(value)) return null;
  const kept = items.filter((x) => x !== value);

  const multiline = slice.includes("\n");
  let patched;
  if (!multiline) {
    patched = kept.length ? `[${kept.map((x) => JSON.stringify(x)).join(", ")}]` : "[]";
  } else {
    // reuse the indentation of the first element line
    const indent = /\n(\s*)"/.exec(slice)?.[1] ?? "      ";
    const close = /\n(\s*)\]$/.exec(slice)?.[1] ?? "    ";
    patched = kept.length
      ? `[\n${kept.map((x) => indent + JSON.stringify(x)).join(",\n")}\n${close}]`
      : "[]";
  }
  return text.slice(0, arr.start) + patched + text.slice(arr.end);
}

// ---------------------------------------------------------------- load
const files = [];
for (const d of ["dang", "narmada"]) {
  const dir = path.join(ROOT, "data", "spots", d);
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    files.push(path.join(dir, f));
  }
}
const records = files.map((file) => {
  const text = readFileSync(file, "utf8");
  return { file, text, json: JSON.parse(text) };
});
const spots = records.map((r) => r.json);
const byId = new Map(records.map((r) => [r.json.id, r]));

const registry = readJson(path.join(ROOT, "scripts", "registry.json"));
const hubs = new Map();
for (const table of Object.values(registry.hubs ?? {})) {
  for (const [key, c] of Object.entries(table)) if (!hubs.has(key)) hubs.set(key, c);
}

// ---------------------------------------------------------------- OSRM
async function table(sources, destinations) {
  const coords = [...sources, ...destinations].map(([lat, lng]) => `${lng},${lat}`).join(";");
  const s = sources.map((_, i) => i).join(";");
  const d = destinations.map((_, i) => i + sources.length).join(";");
  const url = `${OSRM}/${coords}?annotations=distance&sources=${s}&destinations=${d}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`OSRM ${res.status}`);
      const j = await res.json();
      if (j.code !== "Ok") throw new Error(`OSRM ${j.code}`);
      return {
        km: j.distances,
        srcSnap: j.sources.map((x) => x.distance),
        dstSnap: j.destinations.map((x) => x.distance),
      };
    } catch (e) {
      console.log(`    retry ${attempt + 1} (${e.message})`);
      await sleep(5000);
    }
  }
  return null;
}

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
const coordOf = (s) => [s.location.coordinates.lat, s.location.coordinates.lng];

const routed = new Map();
const put = (a, b, m, snap) => routed.set(`${a}->${b}`, { m, snap });

// The matrix costs several minutes against a shared community server, and the
// rules below took a few passes to get right - so cache it and iterate offline.
const CACHE = path.join(ROOT, "scripts", ".distance-cache.json");
const REFRESH = process.argv.includes("--refresh");
let cached = null;
if (!REFRESH) {
  try {
    cached = readJson(CACHE);
  } catch {
    cached = null;
  }
}
if (cached) {
  for (const [k, v] of Object.entries(cached)) routed.set(k, v);
  console.log(`Loaded ${routed.size} routed pairs from cache (--refresh to re-fetch).`);
}

const hubKeys = [...hubs.keys()];
const hubPts = hubKeys.map((k) => hubs.get(k));
if (!routed.size) {
console.log(`Routing ${hubKeys.length} hubs against ${spots.length} spots...`);
for (const group of chunk(spots, MAX_TABLE - hubKeys.length)) {
  const r = await table(hubPts, group.map(coordOf));
  if (!r) continue;
  for (let i = 0; i < hubKeys.length; i++) {
    for (let j = 0; j < group.length; j++) {
      const m = r.km[i]?.[j];
      if (typeof m === "number") put(`h:${hubKeys[i]}`, group[j].id, m, r.srcSnap[i] + r.dstSnap[j]);
    }
  }
  await sleep(1500);
}

console.log(`Routing spot-to-spot matrix...`);
const groups = chunk(spots, Math.floor(MAX_TABLE / 2));
for (const a of groups) {
  for (const b of groups) {
    const r = await table(a.map(coordOf), b.map(coordOf));
    if (!r) continue;
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const m = r.km[i]?.[j];
        if (typeof m === "number") put(a[i].id, b[j].id, m, r.srcSnap[i] + r.dstSnap[j]);
      }
    }
    await sleep(1500);
  }
}
writeFileSync(CACHE, JSON.stringify(Object.fromEntries(routed)));
console.log(`Cached ${routed.size} routed pairs.`);
}

// ------------------------------------------------------------- compare
const tidy = (km) => (km < 10 ? Math.round(km * 10) / 10 : Math.round(km));

function lookup(fromKey, toId, fromCoord, toCoord) {
  const r = routed.get(`${fromKey}->${toId}`);
  if (!r) return null;
  // clamp to the straight line between the real pins; never add snap gaps
  const km = Math.max(r.m / 1000, haversineKm(fromCoord, toCoord));
  return { km, snap: r.snap, trusted: r.snap <= TRUST_SNAP_M };
}

/**
 * Inside a single cluster - the Statue of Unity precinct, Saputara town - people
 * walk or take the shuttle between neighbours, and private cars are restricted.
 * OSRM has to send a car the long way round the one-way visitor loop, so it
 * calls Miyawaki Forest to the Statue 9.8 km when the curated 2 km is what a
 * visitor actually experiences. Routing wins on real drives, not on these.
 */
const SHORT_HOP_KM = 4;
const isIntraCluster = (a, b) => Boolean(a) && a === b;

const changes = [];
const untrusted = [];
const keptLocal = [];

for (const rec of records) {
  const s = rec.json;
  const here = coordOf(s);
  for (const [hub, curated] of Object.entries(s.location?.distances_km ?? {})) {
    if (!hubs.has(hub)) continue;
    const r = lookup(`h:${hub}`, s.id, hubs.get(hub), here);
    if (!r) continue;
    const next = tidy(r.km);
    const row = { id: s.id, field: `distances_km.${hub}`, curated, next, snap: r.snap };
    // a spot inside the hub's own cluster is a local hop, not a drive
    const local = isIntraCluster(s.cluster, hub) || curated <= SHORT_HOP_KM;
    if (!r.trusted) untrusted.push(row);
    else if (local) keptLocal.push(row);
    else if (next !== curated) changes.push({ ...row, rec, kind: "hub", hub });
  }
  for (const n of s.nearby ?? []) {
    const other = byId.get(n.id);
    if (!other) continue;
    const r = lookup(s.id, n.id, here, coordOf(other.json));
    if (!r) continue;
    const next = tidy(r.km);
    const row = { id: s.id, field: `nearby.${n.id}`, curated: n.distance_km, next, snap: r.snap };
    const local = isIntraCluster(s.cluster, other.json.cluster) || n.distance_km <= SHORT_HOP_KM;
    if (!r.trusted) untrusted.push(row);
    else if (local) keptLocal.push(row);
    else if (next !== n.distance_km) changes.push({ ...row, rec, kind: "nearby", edge: n });
  }
}

const pct = (c) => (c.curated > 0 ? Math.round(((c.next - c.curated) / c.curated) * 100) : 0);
const sorted = [...changes].sort((a, b) => Math.abs(pct(b)) - Math.abs(pct(a)));

console.log(`\n=== ${changes.length} value(s) change, ${untrusted.length} left alone ===`);
const band = (lo, hi) => changes.filter((c) => Math.abs(pct(c)) >= lo && Math.abs(pct(c)) < hi).length;
console.log(`  under 20%: ${band(0, 20)}   20-50%: ${band(20, 50)}   over 50%: ${band(50, 1e9)}`);
console.log(`\nLargest 20 corrections:`);
for (const c of sorted.slice(0, 20)) {
  console.log(
    `  ${c.id.padEnd(32)} ${c.field.padEnd(30)} ${String(c.curated).padStart(6)} -> ${String(c.next).padStart(6)}  (${pct(c) > 0 ? "+" : ""}${pct(c)}%)  snap ${Math.round(c.snap)}m`
  );
}
console.log(`\nLeft at curated value:`);
console.log(`  ${untrusted.length} - pin more than ${TRUST_SNAP_M} m from any routable road`);
console.log(`  ${keptLocal.length} - same-cluster or under ${SHORT_HOP_KM} km, where people walk or shuttle`);
const wouldHaveMoved = keptLocal.filter((r) => r.next !== r.curated);
console.log(`     (${wouldHaveMoved.length} of those would otherwise have changed)`);

if (!APPLY) {
  console.log(`\nReport only. Re-run with --apply to write these changes.`);
  process.exit(0);
}

// --------------------------------------------------------------- apply
const byRec = new Map();
for (const c of changes) {
  if (!byRec.has(c.rec)) byRec.set(c.rec, []);
  byRec.get(c.rec).push(c);
}

let written = 0;
let patched = 0;
let failed = 0;
let cleared = 0;

for (const [rec, list] of byRec) {
  let text = rec.text;
  for (const c of list) {
    let next = null;
    if (c.kind === "hub") {
      const span = findKeySpan(text, "distances_km");
      if (span) next = patchNumber(text, span, c.hub, c.next);
    } else {
      const span = nearbyEntrySpan(text, c.edge.id);
      if (span) next = patchNumber(text, span, "distance_km", c.next);
    }
    if (next) {
      text = next;
      patched++;
    } else {
      failed++;
      console.log(`  !! could not patch ${c.id} ${c.field}`);
    }
  }

  // nearest_town duplicates one of the hub figures - keep them consistent
  const nt = rec.json.location?.nearest_town;
  if (nt?.name) {
    const key = nt.name.toLowerCase().replace(/\s+/g, "-");
    const parsedNow = JSON.parse(text);
    const v = parsedNow.location?.distances_km?.[key];
    if (typeof v === "number" && nt.distance_km !== v) {
      const span = findKeySpan(text, "nearest_town");
      const out = span && patchNumber(text, span, "distance_km", v);
      if (out) {
        text = out;
        patched++;
      }
    }
  }

  // this record's hub distances are routed now, so the flag is discharged
  const stillOpen = untrusted.some((u) => u.id === rec.json.id && u.field.startsWith("distances_km"));
  if (!stillOpen && rec.json.provenance?.needs_verification?.includes("location.distances_km")) {
    const out = removeArrayString(text, "needs_verification", "location.distances_km");
    if (out) {
      text = out;
      cleared++;
    }
  }

  // never write something that will not parse back to valid JSON
  try {
    JSON.parse(text);
  } catch (e) {
    console.log(`  !! ${path.basename(rec.file)} would not parse, skipped (${e.message})`);
    continue;
  }
  writeFileSync(rec.file, text);
  written++;
}

console.log(`\nPatched ${patched} value(s) across ${written} file(s); ${failed} could not be located.`);
console.log(`Cleared "location.distances_km" from needs_verification on ${cleared} record(s).`);
