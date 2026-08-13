#!/usr/bin/env node
/**
 * Generates docs/photo-backlog.md — the spots with no staged photograph,
 * grouped into field trips and ordered by road distance from each trip's base.
 *
 * This is a derived document. Every photograph added makes it stale, so it is
 * regenerated (`npm run photo-backlog`) rather than hand-edited.
 *
 * Ordering is by `location.distances_km[base]` — real road distance — and not
 * by straight-line distance between spots, which lies badly in this terrain:
 * Ahwa to Chikhalda is 12 km as the crow flies and 54 km by road. Where a
 * record has no road distance to its base, a straight-line figure is used and
 * marked with `~`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGES = path.join(ROOT, "web", "public", "images", "spots");
const OUT = path.join(ROOT, "docs", "photo-backlog.md");

/** Trip bases. Key is the `location.distances_km` key; coords are the fallback. */
const RUNS = [
  { area: "Interior Dang", base: "ahwa", town: "Ahwa", lat: 20.7539, lng: 73.6845,
    clusters: ["dang-interior"],
    note: "The highest-value run in the dataset and the hardest. Fuel in Ahwa — there are no pumps on the interior stretch — and treat every distance here as a road figure, not a map figure." },
  { area: "Waghai", base: "waghai", town: "Waghai", lat: 20.7727, lng: 73.5010,
    clusters: ["waghai"],
    note: "Compact and mostly tar. The best half-day-per-photo ratio of any run." },
  { area: "Saputara", base: "saputara", town: "Saputara", lat: 20.5716, lng: 73.7514,
    clusters: ["saputara"],
    note: "Walkable or a short drive apart. Low photographic value — all of these are already pictured on a dozen travel sites — but cheap to collect while you are there." },
  { area: "Statue of Unity", base: "ekta-nagar", town: "Ekta Nagar", lat: 21.8380, lng: 73.7191,
    clusters: ["sou-complex", "ekta-nagar-area"],
    note: "One ticketed precinct on a one-way visitor loop, so walking order beats driving order. Same caveat as Saputara: heavily photographed elsewhere." },
  { area: "Rajpipla", base: "rajpipla", town: "Rajpipla", lat: 21.8700, lng: 73.5000,
    clusters: ["rajpipla", "poicha"],
    note: "Town heritage plus a scatter of falls and reservoirs to the south-east." },
  { area: "Dediapada", base: "dediapada", town: "Dediapada", lat: 21.6300, lng: 73.6000,
    clusters: ["dediapada-belt"],
    note: "One outstanding record; fold it into a Rajpipla or Shoolpaneshwar day." },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Sources that establish a fact but do not mean a place has been written up. */
const WEAK = /google maps|youtube|maintainer|openstreetmap|instagram|wikimapia/i;

const name = (s) => (typeof s.name === "string" ? s.name : (s.name?.en ?? s.id));

const uncontested = (s) => {
  const src = (s.provenance?.sources ?? []).map((x) => `${x.publisher ?? ""} ${x.title ?? ""}`);
  return src.length > 0 && src.every((t) => WEAK.test(t));
};

/** [7,8,9,10] -> "Jul–Oct"; handles year-wrap and gaps. */
function season(months) {
  if (!months?.length) return "any";
  if (months.length === 12) return "any";
  const set = [...months].sort((a, b) => a - b);
  const runs = [];
  let start = set[0], prev = set[0];
  for (const m of set.slice(1)) {
    if (m === prev + 1) { prev = m; continue; }
    runs.push([start, prev]); start = m; prev = m;
  }
  runs.push([start, prev]);
  // stitch a Dec->Jan wrap into one run
  if (runs.length > 1 && runs[0][0] === 1 && runs.at(-1)[1] === 12) {
    const first = runs.shift(), last = runs.pop();
    runs.push([last[0], first[1]]);
  }
  return runs
    .map(([a, b]) => (a === b ? MONTHS[a - 1] : `${MONTHS[a - 1]}–${MONTHS[b - 1]}`))
    .join(", ");
}

function haversine(a, b, c, d) {
  const R = 6371, r = Math.PI / 180;
  const dLat = (c - a) * r, dLng = (d - b) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ---------------------------------------------------------------- load

const staged = new Set(fs.readdirSync(IMAGES));
const spots = [];
for (const d of ["dang", "narmada"]) {
  const dir = path.join(ROOT, "data", "spots", d);
  for (const f of fs.readdirSync(dir)) {
    spots.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  }
}

const missing = spots.filter((s) => !staged.has(`${s.id}.jpg`));
const have = spots.length - missing.length;

// ---------------------------------------------------------------- render

const L = [];
const pct = ((have / spots.length) * 100).toFixed(0);

L.push("# Photo backlog");
L.push("");
L.push(`**${missing.length} of ${spots.length} spots have no photograph.** ${have} are done (${pct}%).`);
L.push("");
L.push("In travel search results the thumbnail drives click-through harder than anything");
L.push("in the text, and these are places you have actually been. This is the highest-value");
L.push("work left on the project.");
L.push("");
L.push("Generated by `npm run photo-backlog` — regenerate after adding photographs rather");
L.push("than editing by hand.");
L.push("");
L.push("## How to read it");
L.push("");
L.push("Each run starts from a base town and is ordered by **road** distance from it, so");
L.push("working down a list is roughly working outward. Straight-line distances would");
L.push("mislead here: Ahwa to Chikhalda is 12 km on a map and 54 km on the road.");
L.push("");
L.push("- **★** marks a spot with no competing coverage anywhere — every source is a map");
L.push("  pin, a vlog or your own visit. A photograph of these is worth several of the rest,");
L.push("  because the page can rank first on the strength of being the only real answer.");
L.push("- **Season** is the window the record itself declares. Monsoon-fed falls outside it");
L.push("  are a dry rock face, so a trip in the wrong month is wasted.");
L.push("- Coordinates are given to paste straight into a maps app.");
L.push("");
L.push("## While you are there: fix the coordinates too");
L.push("");
const prec = {};
for (const s of missing) prec[s.location?.coordinates?.precision ?? "none"] = (prec[s.location?.coordinates?.precision ?? "none"] ?? 0) + 1;
L.push(`None of these ${missing.length} records has an \`exact\` coordinate — they are ` +
  Object.entries(prec).map(([k, v]) => `${v} \`${k}\``).join(", ") + ".");
L.push("A GPS fix taken at the spot costs nothing on top of the photograph and upgrades");
L.push("`location.coordinates.precision` to `exact`, which is what makes the map and the");
L.push("trip planner trustworthy. Take the reading at the viewpoint or the parking place,");
L.push("whichever a visitor actually needs, and say which in `access.last_mile`.");
L.push("");

for (const run of RUNS) {
  const list = missing.filter((s) => run.clusters.includes(s.cluster));
  if (!list.length) continue;

  const withKm = list.map((s) => {
    const road = s.location?.distances_km?.[run.base];
    const c = s.location?.coordinates;
    const km = road ?? (c ? haversine(run.lat, run.lng, c.lat, c.lng) : null);
    return { s, km, approx: road === undefined };
  }).sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));

  const stars = list.filter(uncontested).length;
  const wet = list.filter((s) => s.seasonality?.monsoon_dependent).length;

  L.push(`## ${run.area} — ${list.length} to shoot`);
  L.push("");
  L.push(`Base: **${run.town}**${stars ? ` · **${stars}★** with no competing coverage` : ""}${wet ? ` · ${wet} monsoon-dependent` : ""}`);
  L.push("");
  L.push(run.note);
  L.push("");

  for (const { s, km, approx } of withKm) {
    const c = s.location?.coordinates;
    const star = uncontested(s) ? " ★" : "";
    const dist = km == null ? "?" : `${approx ? "~" : ""}${Math.round(km)} km`;
    const when = season(s.seasonality?.best_months);
    const tod = s.visit?.best_time_of_day ? ` · ${s.visit.best_time_of_day}` : "";
    const coords = c ? `\`${c.lat}, ${c.lng}\`` : "`no coords`";
    // Continuation lines sit at a 2-space indent, aligned with the list item's
    // content. Four spaces beyond it would render as a code block on GitHub.
    L.push(`- [ ] **${name(s)}**${star} · ${dist} · ${when}${tod} · ${coords}`);
    const lastMile = s.access?.last_mile;
    const url = `https://dandak.vercel.app/spots/${s.district}/${s.slug}`;
    L.push(`  ${lastMile ? `${lastMile} · ` : ""}[page](${url})`);
  }
  L.push("");
}

L.push("## Adding a photograph");
L.push("");
L.push("1. Drop the file at `web/public/images/spots/<spot-id>.jpg` — the **id**, not the");
L.push("   slug. They differ more often than you would expect: Karanjwa Waterfall is");
L.push("   `dang-mahal-falls`, Rajpipla Old Town is `narmada-rajpipla-heritage-walk`. The id");
L.push("   is the `id` field of the record. Extra angles are `<spot-id>-2.jpg`, `-3.jpg`.");
L.push("2. Add a matching entry to `media.images` in the record, **in the same order**.");
L.push("   Pairing is strictly by index — `media.images[0]` describes `<id>.jpg`,");
L.push("   `media.images[1]` describes `<id>-2.jpg`. Your own photographs take");
L.push("   `\"license\": \"own\"`; anything from Commons carries its own licence, the");
L.push("   photographer's name in `credit`, and a `source_url`.");
L.push("3. Run `npm run validate`. A declared count that disagrees with the staged count");
L.push("   raises a warning — and it matters more than the word suggests, because a surplus");
L.push("   entry silently hands its credit to the next photograph added. That is an");
L.push("   attribution problem, not an untidiness. Warnings only fail the run under");
L.push("   `--strict`, so read the output rather than trusting the exit code.");
L.push("4. Check every frame for identifiable faces before it is published. These are");
L.push("   inhabited villages, not scenery.");
L.push("");
L.push("Licensing terms for media are in [`LICENSE-DATA`](../LICENSE-DATA).");
L.push("");

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, L.join("\n"), "utf8");

console.log(`photo-backlog: ${missing.length} missing of ${spots.length} -> ${path.relative(ROOT, OUT)}`);
for (const run of RUNS) {
  const n = missing.filter((s) => run.clusters.includes(s.cluster)).length;
  const st = missing.filter((s) => run.clusters.includes(s.cluster) && uncontested(s)).length;
  if (n) console.log(`  ${run.area.padEnd(18)} ${String(n).padStart(2)}  (${st} uncontested)`);
}
