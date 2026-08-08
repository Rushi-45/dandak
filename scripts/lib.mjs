/** Shared helpers for dataset scripts. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Read a text file; strip and flag a UTF-8 BOM (spec 01 forbids BOMs). */
export function readText(path) {
  let text = readFileSync(path, "utf8");
  const hadBom = text.charCodeAt(0) === 0xfeff;
  if (hadBom) text = text.slice(1);
  return { text, hadBom };
}

export function readJson(path) {
  return JSON.parse(readText(path).text);
}

/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF). */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows;
}

/** Great-circle distance in km between [lat, lng] pairs. */
export function haversineKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Load the seed CSV into a Map(id -> row); reports problems via cb(level, file, msg). */
export function loadSeed(seedPath, registry, report) {
  const seed = new Map();
  const { text } = readText(seedPath);
  const rows = parseCsv(text);
  const header = rows.shift() ?? [];
  const expected = ["id", "name", "category", "cluster", "tier", "outside_district", "notes"];
  if (header.join(",") !== expected.join(",")) {
    report("error", "seed/spots-master.csv", `header must be exactly: ${expected.join(",")}`);
    return seed;
  }
  rows.forEach((r, i) => {
    const loc = `seed/spots-master.csv:${i + 2}`;
    const [id, name, category, cluster, tier, od, notes] = r;
    if (!/^(dang|narmada)-[a-z0-9]+(-[a-z0-9]+)*$/.test(id ?? "")) report("error", loc, `bad id "${id}"`);
    if (seed.has(id)) report("error", loc, `duplicate id "${id}"`);
    if (!registry.categories.includes(category)) report("error", loc, `unknown category "${category}"`);
    const cl = registry.clusters[cluster];
    if (!cl) report("error", loc, `unknown cluster "${cluster}"`);
    else if (!id.startsWith(cl.district + "-")) report("error", loc, `cluster "${cluster}" belongs to ${cl.district} but id says otherwise`);
    if (!["1", "2", "3"].includes(tier)) report("error", loc, `tier must be 1|2|3, got "${tier}"`);
    if (!["true", "false"].includes(od)) report("error", loc, `outside_district must be true|false, got "${od}"`);
    seed.set(id, {
      id, name, category, cluster,
      tier: Number(tier),
      outside_district: od === "true",
      notes: notes ?? "",
      district: id.startsWith("dang-") ? "dang" : "narmada",
    });
  });
  return seed;
}
