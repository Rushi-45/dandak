# Dandak — Saputara–Narmada Tourism Dataset

A structured, verifiable tourism dataset for the **Dang** and **Narmada** districts of Gujarat, India — covering **106 tourist spots** (Saputara hill station, the Statue of Unity complex, waterfalls, sanctuaries, temples, and offbeat interior sites) plus **52 companion records** across districts, itineraries, events, stays and food. Every claim carries a source and a confidence level.

Around a third of the spots — the interior Dang waterfalls especially — cite nothing but map pins, vlogs and first-hand visits, because no publisher has written them up. Chikhalda, Baaj, Dhulda, Ritu, Advait and a dozen more are documented here and almost nowhere else.

*The name comes from **Dandakaranya**, the epic forest that once covered this belt — whose living Ramayana geography (Shabari Dham, Pampa Sarovar, Anjan Kund) is part of the dataset itself.*

**This repo is specs-first.** Everything under `specs/` was written *before* data production began, and remains normative: data files, tooling and reviews must conform to it. `scripts/validate.mjs` checks conformance mechanically — run `npm run validate` before committing data changes. The dataset currently passes at 0 errors and 0 warnings across 106 records, 52 companions and 106 seed rows.

## Status

| | |
|---|---|
| Dataset release | **v1.1.0** (2026-08-10) |
| Phase | 6 complete — pipeline phases 0–6 all shipped; post-v1 expansion ongoing |
| Data records | 106 spots (91 verified: T1 100%, T2 81%) + 52 companions (2 districts, 12 itineraries, 8 events, 20 stays, 10 foods); 28 spots with imagery (CC/Commons + maintainer's own) |
| Site | 247 prerendered pages, live at [dandak.vercel.app](https://dandak.vercel.app) |
| Exports | GeoJSON (`exports/geojson/`), stats snapshot (`exports/STATS.md`) |

## Spec index

| Spec | Contents |
|---|---|
| [00 — Vision & Scope](specs/00-vision-and-scope.md) | Goals, audience, consumers, non-goals, decisions log |
| [01 — Data Model](specs/01-data-model.md) | Entities & relations, ID/slug rules, null semantics, repo layout, formatting |
| [02 — Spot Record Schema](specs/02-spot-schema.md) | Field-by-field spec of the core spot record + full example |
| [03 — Companion Schemas](specs/03-companion-schemas.md) | District, Itinerary, Event, Stay, Food entities |
| [04 — Taxonomies](specs/04-taxonomies.md) | Categories, tags, clusters, hubs, activities, all enums + governance |
| [05 — Content Guidelines](specs/05-content-guidelines.md) | Voice, field recipes, style rules, sensitivity, banned fluff |
| [06 — Pipeline & Workflow](specs/06-pipeline-and-workflow.md) | Build phases, per-record workflow, tooling, commits, releases |
| [07 — Quality & Verification](specs/07-quality-and-verification.md) | Provenance, confidence levels, verification policy, validation levels L1–L4 |
| [08 — Spot Inventory](specs/08-spot-inventory.md) | The master seed list: every candidate spot with category, cluster, tier |
| [09 — Roadmap](specs/09-roadmap.md) | Post-v1: languages, GeoJSON, SQLite, media, ratings, expansion |

Machine-readable schemas (normative): [`schema/spot.schema.json`](schema/spot.schema.json) plus `district`, `itinerary`, `event`, `stay` and `food` schemas in the same folder.

## Target repo layout

```
specs/                  ← normative documents (phase 0)
schema/                 ← JSON Schemas for all six entity types
seed/spots-master.csv   ← the drafting seed list
data/
  districts/            ← dang.json, narmada.json
  spots/dang/           ← one JSON file per spot
  spots/narmada/
  itineraries/  events/  stays/  food/
exports/                ← GeoJSON + stats snapshot (regenerable)
scripts/                ← validate, stats, export-geojson
web/                    ← Next.js app consuming ../data (npm run dev inside web/)
```

## Consumers

- **Website** — `web/` is a Next.js app rendering the whole dataset as **247 prerendered pages**: spot explorer with filters, itinerary timelines, district and area guides, an interactive map with road routing, a trip planner that packs stops into days, stays and events. `cd web && npm install && npm run dev`.
- **API** — served by the same app: `GET /api/spots` (slim list), `/api/spots/{district}/{slug}` (full record), `/api/itineraries`, `/api/events`. All static-generated, CORS-open, versioned in the response `meta`.
- **GeoJSON** — `exports/geojson/` for map layers.

## Ground rules (summary)

- One JSON file per spot; file = `data/spots/{district}/{slug}.json`; `id = {district}-{slug}`, stable forever.
- English-first prose; `name` is a language-keyed object so Gujarati/Hindi slot in later.
- Every record carries `provenance` — confidence level, sources, and a `needs_verification` ledger. Volatile facts (fees, timings, booking URLs) are web-verified before being stamped `last_verified`.
- All enums and vocabularies live in [spec 04](specs/04-taxonomies.md); changing them is a governed edit, not an ad-hoc one.

## Licence

Three licences, because this repo holds three genuinely different kinds of material. Full terms in [`LICENSE`](LICENSE) and [`LICENSE-DATA`](LICENSE-DATA).

| What | Where | Licence |
|---|---|---|
| Source code | `web/`, `scripts/`, `schema/` | **MIT** |
| Dataset, specs, exports | `data/`, `specs/`, `exports/`, `seed/` | **CC BY-SA 4.0** |
| Geometry from OpenStreetMap | `web/lib/geo.json`, `web/lib/routes.json` | **ODbL 1.0** — © OpenStreetMap contributors |
| Photographs & video | `web/public/images/`, `web/public/videos/` | **per file** — see each record's `media.images[].license` |

Attributing the dataset:

```
Data from the dandak dataset by Rushi Chudasama, CC BY-SA 4.0
https://github.com/Rushi-45/dandak
```

Three things worth knowing before you reuse any of it:

- **Photographs are licensed individually, and most are not ours.** Each entry in `media.images` carries a `license`, a `credit` naming the photographer, and a `source_url` to the original on Wikimedia Commons. Carry the credit — dropping it breaks the licence against that photographer, not against this project.
- **The OSM carve-out survives extraction.** Boundary and route geometry is ODbL, and ODbL's share-alike attaches to derived databases. Lift those files into your own product and the ODbL travels with them, regardless of the CC BY-SA on everything else.
- **Republish provenance with records.** Every claim carries a confidence level and a source list. A dandak record stripped of its provenance asserts something this project did not.

Sources cited in `provenance.sources` are credited for facts, not text. Nothing from them is reproduced and no rights in their work transfer here.

## Changing the specs

Specs are living documents until v1.0 is tagged. Edit → validate consistency (schema ↔ spec 02 ↔ spec 04) → commit with a `docs(specs):` message. Decisions that reverse an entry in the [decisions log](specs/00-vision-and-scope.md#decisions-log) get a new log row, never a silent edit.
