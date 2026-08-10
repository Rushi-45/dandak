# Dandak — Saputara–Narmada Tourism Dataset

A structured, verifiable tourism dataset for the **Dang** and **Narmada** districts of Gujarat, India — covering 70+ tourist spots (Saputara hill station, the Statue of Unity complex, waterfalls, sanctuaries, temples, and offbeat interior sites) plus companion data (itineraries, events, stays, food).

*The name comes from **Dandakaranya**, the epic forest that once covered this belt — whose living Ramayana geography (Shabari Dham, Pampa Sarovar, Anjan Kund) is part of the dataset itself.*

**This repo is specs-first.** Everything under `specs/` is written *before* data production begins, and is normative: data files, tooling, and reviews must conform to it. The dataset itself (`data/`, `scripts/`) is added in later phases of the pipeline defined in the specs.

## Status

| | |
|---|---|
| Dataset release | **v1.0.0** (2026-08-08) |
| Phase | 6 complete — pipeline phases 0–6 all shipped |
| Data records | 83 spots (67 verified: T1 100%, T2 81%) + 44 companions (2 districts, 9 itineraries, 8 events, 15 stays, 10 foods); 22 spots with imagery (CC/Commons + maintainer's own) |
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

- **Website** — `web/` is a Next.js app rendering the whole dataset (~90 static pages): spot explorer with filters, itinerary timelines, district guides, events. `cd web && npm install && npm run dev`.
- **API** — served by the same app: `GET /api/spots` (slim list), `/api/spots/{district}/{slug}` (full record), `/api/itineraries`, `/api/events`. All static-generated, CORS-open, versioned in the response `meta`.
- **GeoJSON** — `exports/geojson/` for map layers.

## Ground rules (summary)

- One JSON file per spot; file = `data/spots/{district}/{slug}.json`; `id = {district}-{slug}`, stable forever.
- English-first prose; `name` is a language-keyed object so Gujarati/Hindi slot in later.
- Every record carries `provenance` — confidence level, sources, and a `needs_verification` ledger. Volatile facts (fees, timings, booking URLs) are web-verified before being stamped `last_verified`.
- All enums and vocabularies live in [spec 04](specs/04-taxonomies.md); changing them is a governed edit, not an ad-hoc one.

## Changing the specs

Specs are living documents until v1.0 is tagged. Edit → validate consistency (schema ↔ spec 02 ↔ spec 04) → commit with a `docs(specs):` message. Decisions that reverse an entry in the [decisions log](specs/00-vision-and-scope.md#decisions-log) get a new log row, never a silent edit.
