#!/usr/bin/env node
/**
 * Progress dashboard - drafting progress vs seed, confidence mix, verification
 * staleness (spec 07 cadences), and the needs_verification leaderboard.
 * Usage: node scripts/stats.mjs
 */
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readJson, loadSeed } from "./lib.mjs";

const registry = readJson(join(ROOT, "scripts", "registry.json"));
const report = (level, file, msg) => console.log(`  [seed ${level}] ${file}: ${msg}`);
const seedPath = join(ROOT, "seed", "spots-master.csv");
const seed = existsSync(seedPath) ? loadSeed(seedPath, registry, report) : new Map();

// load drafted records
const records = [];
for (const district of ["dang", "narmada"]) {
  const dir = join(ROOT, "data", "spots", district);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    try {
      records.push(readJson(join(dir, f)));
    } catch {
      console.log(`  [broken JSON] data/spots/${district}/${f}`);
    }
  }
}
const draftedIds = new Set(records.map((r) => r.id));

const count = (arr, fn) => arr.reduce((acc, x) => ((acc[fn(x)] = (acc[fn(x)] ?? 0) + 1), acc), {});
const seedRows = [...seed.values()];
const byDistrict = count(seedRows, (r) => r.district);
const byTier = count(seedRows, (r) => `T${r.tier}`);

console.log("=== Saputara-Narmada dataset stats ===\n");
console.log(`Seed: ${seed.size} spots (dang ${byDistrict.dang ?? 0} / narmada ${byDistrict.narmada ?? 0}) | tiers: T1 ${byTier.T1 ?? 0}, T2 ${byTier.T2 ?? 0}, T3 ${byTier.T3 ?? 0}`);

const draftedSeed = seedRows.filter((r) => draftedIds.has(r.id));
const dTier = count(draftedSeed, (r) => `T${r.tier}`);
console.log(`Drafted: ${records.length}/${seed.size} | T1 ${dTier.T1 ?? 0}/${byTier.T1 ?? 0}, T2 ${dTier.T2 ?? 0}/${byTier.T2 ?? 0}, T3 ${dTier.T3 ?? 0}/${byTier.T3 ?? 0}`);

if (records.length) {
  const conf = count(records, (r) => r.provenance?.confidence ?? "unset");
  console.log(`Confidence: high ${conf.high ?? 0}, medium ${conf.medium ?? 0}, low ${conf.low ?? 0}${conf.unset ? `, unset ${conf.unset}` : ""}`);

  const now = Date.now();
  const days = (iso) => (now - new Date(iso + "T00:00:00Z").getTime()) / 86400000;
  const verified = records.filter((r) => r.provenance?.last_verified);
  const stale = verified.filter((r) => days(r.provenance.last_verified) > (r.cluster === "sou-complex" ? 90 : 180));
  console.log(`Verified: ${verified.length}/${records.length}; stale per cadence (sou-complex 90d / others 180d): ${stale.length}${stale.length ? " -> " + stale.map((r) => r.id).join(", ") : ""}`);

  const paths = {};
  for (const r of records) for (const p of r.provenance?.needs_verification ?? []) paths[p] = (paths[p] ?? 0) + 1;
  const top = Object.entries(paths).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`\nneeds_verification leaderboard:${top.length ? "" : " (empty)"}`);
  for (const [p, n] of top) console.log(`  ${String(n).padStart(3)}  ${p}`);
}

const pending = seedRows.filter((r) => !draftedIds.has(r.id)).sort((a, b) => a.tier - b.tier);
console.log(`\nNext up (tier order): ${pending.slice(0, 10).map((r) => r.id).join(", ")}${pending.length > 10 ? ` (+${pending.length - 10} more)` : ""}`);
