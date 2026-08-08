#!/usr/bin/env node
/**
 * GeoJSON export - one FeatureCollection per district plus a combined file,
 * written to exports/geojson/. Properties carry the filter-relevant fields;
 * apps join the full record by id.
 * Usage: node scripts/export-geojson.mjs
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readJson } from "./lib.mjs";

const OUT = join(ROOT, "exports", "geojson");
mkdirSync(OUT, { recursive: true });

const collections = { dang: [], narmada: [], all: [] };
for (const district of ["dang", "narmada"]) {
  const dir = join(ROOT, "data", "spots", district);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    const rec = readJson(join(dir, f));
    const co = rec.location?.coordinates;
    if (!co || typeof co.lat !== "number") continue;
    const feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [co.lng, co.lat] },
      properties: {
        id: rec.id,
        name: rec.name.en,
        category: rec.category,
        cluster: rec.cluster,
        district: rec.district,
        status: rec.status,
        tags: rec.tags,
        precision: co.precision,
        summary: rec.summary,
        monsoon_dependent: rec.seasonality?.monsoon_dependent ?? null,
        confidence: rec.provenance?.confidence ?? null,
      },
    };
    collections[district].push(feature);
    collections.all.push(feature);
  }
}

for (const [name, features] of Object.entries(collections)) {
  const file = `${name === "all" ? "all-spots" : name}.geojson`;
  const fc = { type: "FeatureCollection", features };
  writeFileSync(join(OUT, file), JSON.stringify(fc, null, 2) + "\n", "utf8");
  console.log(`exports/geojson/${file}: ${features.length} feature(s)`);
}
