#!/usr/bin/env node
/**
 * Dataset validator - implements the validation levels from specs/07-quality-and-verification.md:
 *   L1 schema (ajv) . L2 referential integrity . L3 sanity lints . seed-file checks
 * Fixtures under schema/examples/ get L1 + L3 only (their refs may point to undrafted records).
 *
 * Usage: node scripts/validate.mjs [--strict]     (--strict: warnings also fail the run)
 * Exit codes: 0 clean . 1 errors (or warnings in strict mode)
 */
import { readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { ROOT, readText, readJson, loadSeed, haversineKm } from "./lib.mjs";

const STRICT = process.argv.includes("--strict");
const problems = { error: [], warn: [] };
const report = (level, file, msg) => problems[level].push({ file, msg });

const registry = readJson(join(ROOT, "scripts", "registry.json"));
const schema = readJson(join(ROOT, "schema", "spot.schema.json"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateL1 = ajv.compile(schema);

// ---------- seed checks ----------
const seedPath = join(ROOT, "seed", "spots-master.csv");
const seed = existsSync(seedPath) ? loadSeed(seedPath, registry, report) : new Map();
if (!existsSync(seedPath)) report("warn", "seed/spots-master.csv", "seed file missing");

// ---------- collect record files ----------
const files = [];
for (const district of ["dang", "narmada"]) {
  const dir = join(ROOT, "data", "spots", district);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json")))
    files.push({ path: join(dir, f), rel: `data/spots/${district}/${f}`, folderDistrict: district, fileSlug: basename(f, ".json"), fixture: false });
}
const exDir = join(ROOT, "schema", "examples");
if (existsSync(exDir))
  for (const f of readdirSync(exDir).filter((n) => n.endsWith(".json")))
    files.push({ path: join(exDir, f), rel: `schema/examples/${f}`, folderDistrict: null, fileSlug: null, fixture: true });

// ---------- parse + L1 ----------
const parsed = [];
const datasetIds = new Set();
for (const meta of files) {
  const { text, hadBom } = readText(meta.path);
  if (hadBom) report("warn", meta.rel, "L3 file has UTF-8 BOM - save without BOM (spec 01)");
  let rec;
  try {
    rec = JSON.parse(text);
  } catch (e) {
    report("error", meta.rel, `invalid JSON: ${e.message}`);
    continue;
  }
  if (!validateL1(rec))
    for (const e of validateL1.errors) report("error", meta.rel, `L1 ${e.instancePath || "/"} ${e.message}`);
  parsed.push({ meta, rec });
  if (!meta.fixture && typeof rec.id === "string") {
    if (datasetIds.has(rec.id)) report("error", meta.rel, `L2 duplicate id "${rec.id}"`);
    datasetIds.add(rec.id);
  }
}

// ---------- L2 referential (dataset records only) ----------
const itinDir = join(ROOT, "data", "itineraries");
const itinSlugs = existsSync(itinDir) ? new Set(readdirSync(itinDir).filter((n) => n.endsWith(".json")).map((n) => basename(n, ".json"))) : null;
const staysDir = join(ROOT, "data", "stays");
const stayIds = existsSync(staysDir) ? new Set(readdirSync(staysDir).filter((n) => n.endsWith(".json")).map((n) => basename(n, ".json"))) : null;

for (const { meta, rec } of parsed) {
  if (meta.fixture || typeof rec.id !== "string") continue;
  const rel = meta.rel;
  if (rec.district !== meta.folderDistrict) report("error", rel, `L2 district "${rec.district}" does not match folder "${meta.folderDistrict}"`);
  if (rec.slug !== meta.fileSlug) report("error", rel, `L2 slug "${rec.slug}" does not match filename "${meta.fileSlug}"`);
  if (rec.id !== `${rec.district}-${rec.slug}`) report("error", rel, `L2 id must equal "{district}-{slug}"`);
  if (seed.size && !seed.has(rec.id)) report("warn", rel, "L2 id not in seed - add it to seed/spots-master.csv and specs/08");

  if (rec.cluster != null) {
    const c = registry.clusters[rec.cluster];
    if (!c) report("error", rel, `L2 unknown cluster "${rec.cluster}"`);
    else if (c.district !== rec.district) report("error", rel, `L2 cluster "${rec.cluster}" belongs to ${c.district}`);
  }
  for (const n of rec.nearby ?? []) {
    if (datasetIds.has(n.id)) continue;
    if (seed.has(n.id)) report("warn", rel, `L2 nearby "${n.id}" is seeded but not drafted yet`);
    else report("error", rel, `L2 nearby "${n.id}" unknown (not in dataset or seed)`);
  }
  for (const s of rec.amenities?.stay_nearby ?? []) {
    if (datasetIds.has(s) || seed.has(s) || (stayIds && stayIds.has(s))) continue;
    report(stayIds ? "error" : "warn", rel, `L2 stay_nearby "${s}" unresolved${stayIds ? "" : " (stays not built yet - phase 5)"}`);
  }
  for (const it of rec.itineraries ?? []) {
    if (itinSlugs) {
      if (!itinSlugs.has(it)) report("error", rel, `L2 itinerary "${it}" not found`);
    } else report("warn", rel, `L2 itinerary "${it}" unresolvable (itineraries not built yet - phase 5)`);
  }
}

// ---------- L3 sanity lints (records + fixtures) ----------
for (const { meta, rec } of parsed) {
  const rel = meta.rel;
  const loc = rec.location ?? {};
  const co = loc.coordinates;
  const district = rec.district;

  if (co && typeof co.lat === "number" && district) {
    const box = loc.outside_district ? registry.bboxes.widened : registry.bboxes[district];
    if (box && (co.lat < box.latMin || co.lat > box.latMax || co.lng < box.lngMin || co.lng > box.lngMax))
      report("warn", rel, `L3 coordinates outside the ${loc.outside_district ? "widened" : district} bounding box`);
  }

  const tags = Array.isArray(rec.tags) ? rec.tags : [];
  for (const t of tags) if (!registry.tags.includes(t)) report("warn", rel, `L3 tag "${t}" not in vocabulary (spec 04)`);
  if (tags.includes("offbeat") && tags.includes("popular")) report("warn", rel, "L3 tags offbeat+popular are mutually exclusive");
  const fees = rec.visit?.fees;
  if (tags.includes("ticketed") && Array.isArray(fees) && fees.length === 0) report("warn", rel, "L3 tagged ticketed but fees say free");
  if (tags.includes("free-entry") && Array.isArray(fees) && fees.some((f) => f.type === "entry" && f.amount_inr > 0))
    report("warn", rel, "L3 tagged free-entry but has an entry fee");

  for (const a of rec.experience?.activities ?? [])
    if (!registry.activities.includes(a)) report("warn", rel, `L3 activity "${a}" not in vocabulary (spec 04)`);
  const allowedSub = registry.subcategories[rec.category] ?? [];
  for (const s of rec.subcategories ?? [])
    if (!allowedSub.includes(s)) report("warn", rel, `L3 subcategory "${s}" not allowed for category "${rec.category}"`);

  const hubTable = registry.hubs[district] ?? {};
  for (const [hub, km] of Object.entries(loc.distances_km ?? {})) {
    if (!(hub in hubTable)) {
      report("warn", rel, `L3 hub "${hub}" not valid for ${district} (spec 04)`);
      continue;
    }
    if (co && typeof km === "number") {
      const straight = haversineKm([co.lat, co.lng], hubTable[hub]);
      // 3x was the old ceiling, set when these numbers were hand-estimated. Now
      // that they are routed on OpenStreetMap, dissected ghat terrain genuinely
      // exceeds it: Ahwa to Chikhalda Falls is 12 km straight and 54 km by road
      // (4.5x), the route swinging 10 km east and 8 km south around the ridges,
      // with both ends snapping within 116 m of a road and Valhalla agreeing to
      // 0.1 km. Poicha to Rajpipla is 3.4x because the Narmada is in between.
      // The lower bound is the one that still catches impossible values.
      if (straight >= 5 && (km < 0.8 * straight || km > 6 * straight))
        report("warn", rel, `L3 distance to ${hub} (${km} km) implausible vs ~${straight.toFixed(0)} km straight-line`);
    }
  }

  /**
   * media.images is paired with the staged files BY INDEX (see getSpotGallery in
   * web/lib/data.ts), so a count mismatch is an attribution hazard, not an
   * untidiness: the next photo staged for this spot silently inherits whatever
   * credit and licence the surplus entry carries. Two records drifted this way
   * when photographs were discarded but their entries were left behind.
   */
  const declaredImages = (rec.media?.images ?? []).length;
  if (declaredImages > 0) {
    const dir = join(ROOT, "web", "public", "images", "spots");
    let staged = existsSync(join(dir, `${rec.id}.jpg`)) ? 1 : 0;
    for (let i = 2; i <= 8; i++) if (existsSync(join(dir, `${rec.id}-${i}.jpg`))) staged++;
    if (staged !== declaredImages)
      report(
        "warn",
        rel,
        `L3 media.images declares ${declaredImages} image(s) but ${staged} are staged — the extra credit will attach to the next photo added`
      );
  }

  if (typeof rec.summary === "string" && rec.summary.length > registry.lints.summaryTargetChars)
    report("warn", rel, `L3 summary over ${registry.lints.summaryTargetChars} chars`);

  const prose = [
    rec.summary, rec.description, rec.history_legend, rec.experience?.photography_notes,
    ...(rec.highlights ?? []), ...(rec.tips ?? []),
    ...((rec.faqs ?? []).flatMap((f) => [f?.q, f?.a])),
  ].filter((s) => typeof s === "string").join("\n").toLowerCase();
  for (const b of registry.bannedPhrases) if (prose.includes(b)) report("warn", rel, `L3 banned phrase "${b}" (spec 05)`);

  const dur = rec.visit?.duration_min;
  const [dLo, dHi] = registry.lints.durationMinRange;
  if (typeof dur === "number" && (dur < dLo || dur > dHi)) report("warn", rel, `L3 duration_min ${dur} outside ${dLo}-${dHi}`);
  for (const f of Array.isArray(fees) ? fees : [])
    if (typeof f?.amount_inr === "number" && f.amount_inr > registry.lints.feeWarnAboveInr)
      report("warn", rel, `L3 fee of ${f.amount_inr} INR unusually high - confirm`);

  const best = new Set(rec.seasonality?.best_months ?? []);
  for (const m of rec.seasonality?.avoid_months ?? [])
    if (best.has(m)) report("warn", rel, `L3 month ${m} appears in both best_months and avoid_months`);

  const keys = Object.keys(rec);
  const wanted = registry.topLevelKeyOrder.filter((k) => keys.includes(k));
  const actual = keys.filter((k) => registry.topLevelKeyOrder.includes(k));
  if (wanted.join() !== actual.join()) report("warn", rel, "L3 top-level keys not in template order (spec 02)");
}

// ---------- companion entities (districts, itineraries, events, stays, food) ----------
const companionKinds = [
  { kind: "district", dir: "districts", schemaFile: "district.schema.json" },
  { kind: "itinerary", dir: "itineraries", schemaFile: "itinerary.schema.json" },
  { kind: "event", dir: "events", schemaFile: "event.schema.json" },
  { kind: "stay", dir: "stays", schemaFile: "stay.schema.json" },
  { kind: "food", dir: "food", schemaFile: "food.schema.json" },
];
const companions = {}; // kind -> [{rel, fileSlug, rec}]
let nCompanions = 0;
for (const { kind, dir, schemaFile } of companionKinds) {
  companions[kind] = [];
  const dPath = join(ROOT, "data", dir);
  if (!existsSync(dPath)) continue;
  const sPath = join(ROOT, "schema", schemaFile);
  const check = existsSync(sPath) ? ajv.compile(readJson(sPath)) : null;
  if (!check) report("warn", `schema/${schemaFile}`, `missing schema for ${kind} records`);
  for (const f of readdirSync(dPath).filter((n) => n.endsWith(".json"))) {
    const rel = `data/${dir}/${f}`;
    const { text, hadBom } = readText(join(dPath, f));
    if (hadBom) report("warn", rel, "L3 file has UTF-8 BOM - save without BOM (spec 01)");
    let rec;
    try {
      rec = JSON.parse(text);
    } catch (e) {
      report("error", rel, `invalid JSON: ${e.message}`);
      continue;
    }
    if (check && !check(rec))
      for (const e of check.errors) report("error", rel, `L1 ${e.instancePath || "/"} ${e.message}`);
    companions[kind].push({ rel, fileSlug: basename(f, ".json"), rec });
    nCompanions++;
  }
}

// L2 for companions
const eventIds = new Set(companions.event.map((c) => c.rec.id));
const foodIds = new Set(companions.food.map((c) => c.rec.id));
const allHubKeys = new Set([...Object.keys(registry.hubs.dang), ...Object.keys(registry.hubs.narmada)]);
const stayIdSet = new Set(companions.stay.map((c) => c.rec.id));

for (const { rel, fileSlug, rec } of companions.district) {
  if (rec.id !== fileSlug) report("error", rel, `L2 id "${rec.id}" does not match filename`);
  for (const s of rec.hero_spots ?? []) if (!datasetIds.has(s)) report("error", rel, `L2 hero_spot "${s}" unknown`);
  for (const ev of rec.festivals ?? []) if (!eventIds.has(ev)) report("error", rel, `L2 festival "${ev}" not found in events`);
  for (const fd of rec.foods ?? []) if (!foodIds.has(fd)) report("error", rel, `L2 food "${fd}" not found in food records`);
}
for (const { rel, fileSlug, rec } of companions.itinerary) {
  if (rec.id !== fileSlug || rec.slug !== fileSlug) report("error", rel, "L2 id/slug must match filename");
  for (const st of rec.stops ?? []) {
    if (!datasetIds.has(st.spot_id)) report("error", rel, `L2 stop spot_id "${st.spot_id}" unknown`);
    if (st.day > rec.duration_days) report("error", rel, `L2 stop day ${st.day} exceeds duration_days`);
  }
  if (rec.base_hub && !allHubKeys.has(rec.base_hub) && !stayIdSet.has(rec.base_hub))
    report("warn", rel, `L2 base_hub "${rec.base_hub}" is neither a registry hub nor a stay id`);
  for (const t of rec.themes ?? []) if (!registry.tags.includes(t)) report("warn", rel, `L3 theme "${t}" not in tag vocabulary`);
}
for (const { rel, fileSlug, rec } of companions.event) {
  if (rec.id !== fileSlug || rec.slug !== fileSlug) report("error", rel, "L2 id/slug must match filename");
  if (rec.spot_id && !datasetIds.has(rec.spot_id)) report("error", rel, `L2 spot_id "${rec.spot_id}" unknown`);
  if (rec.spot_id == null && rec.place == null) report("warn", rel, "L3 event has neither spot_id nor place");
}
for (const { rel, fileSlug, rec } of companions.stay) {
  if (rec.id !== fileSlug || rec.slug !== fileSlug) report("error", rel, "L2 id/slug must match filename");
  if (rec.cluster != null) {
    const c = registry.clusters[rec.cluster];
    if (!c) report("error", rel, `L2 unknown cluster "${rec.cluster}"`);
    else if (c.district !== rec.district) report("error", rel, `L2 cluster "${rec.cluster}" belongs to ${c.district}`);
  }
  if (rec.spot_id && !datasetIds.has(rec.spot_id)) report("error", rel, `L2 spot_id "${rec.spot_id}" unknown`);
  for (const n of rec.nearest_spots ?? []) if (!datasetIds.has(n.id)) report("error", rel, `L2 nearest_spot "${n.id}" unknown`);
}
for (const { rel, fileSlug, rec } of companions.food) {
  if (rec.id !== fileSlug || rec.slug !== fileSlug) report("error", rel, "L2 id/slug must match filename");
}

// ---------- report ----------
const touched = [...new Set([...problems.error, ...problems.warn].map((p) => p.file))].sort();
for (const f of touched) {
  console.log(`\n${f}`);
  for (const e of problems.error.filter((p) => p.file === f)) console.log(`  ERROR  ${e.msg}`);
  for (const w of problems.warn.filter((p) => p.file === f)) console.log(`  warn   ${w.msg}`);
}
const nRecords = parsed.filter((p) => !p.meta.fixture).length;
const nFixtures = parsed.length - nRecords;
console.log(
  `\nvalidate: ${nRecords} record(s), ${nCompanions} companion(s), ${nFixtures} fixture(s), ${seed.size} seed row(s) -> ` +
  `${problems.error.length} error(s), ${problems.warn.length} warning(s)${STRICT ? " [strict]" : ""}`
);
process.exit(problems.error.length > 0 || (STRICT && problems.warn.length > 0) ? 1 : 0);
