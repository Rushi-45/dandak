# 00 — Vision & Scope

Status: Draft v0.1 · Last updated: 2026-08-08 · Normative

## Vision

Build the most complete, structured, and honest dataset of tourist places in **Dang** and **Narmada** districts (Gujarat, India) — good enough to power a consumer travel website/app directly, and clean enough to publish as a standalone dataset/API.

Existing information about these districts is scattered, stale, and thin: headline spots (Statue of Unity, Saputara lake) drown out everything else, practical details (fees, timings, network coverage, monsoon behavior) are unreliable, and offbeat places (Don hill, Girmal falls, Ninai falls, Sagai–Malsamot) are nearly invisible. This project fixes that with structured records, explicit provenance, and deliberate coverage of the long tail.

## Audience & consumers

**End audience** (who the data ultimately serves):
- Gujarat/Maharashtra weekend travellers (Surat, Vadodara, Ahmedabad, Nashik, Mumbai catchments)
- Pan-India visitors to the Statue of Unity extending into the district
- Monsoon-season nature travellers; pilgrimage travellers (Shabari Dham, Nilkanthdham, Devmogra)

**Technical consumers** (what reads the data):
1. A first-party travel website/app (pages, filters, maps, itineraries)
2. A reusable dataset/API (JSON files are the source of truth; exports derived from them)

Both consumers shape the schema: filterable enums and stable IDs for the app, provenance and versioning for the dataset.

## Geographic scope

- **In scope:** all of Dang district and all of Narmada district.
- **Flagged adjacents:** a spot outside the two districts may be included only if it is a standard part of these circuits (e.g., Hatgadh Fort ~5 km from Saputara in Nashik/MH; Vansda National Park bordering Waghai; Kabirvad paired with Poicha). Such records set `location.outside_district: true` and record the real administrative district. Cap: ≤5 per district.
- **Out of scope:** everything else, until the expansion criteria in [spec 09](09-roadmap.md) are met.

## Content scope

- **Spot records** — the core entity: identity, classification, narrative, geo, access, visit logistics, seasonality, experience, amenities, safety, relations, media metadata, SEO, provenance. Defined in [spec 02](02-spot-schema.md).
- **Companion entities** — districts, itineraries, events, stays, food. Defined in [spec 03](03-companion-schemas.md).
- **Granularity rule:** each visitable sub-attraction is its own record (e.g., Valley of Flowers is a record, not a bullet inside Statue of Unity), grouped via `cluster`. Folding rules and the definitive list live in [spec 08](08-spot-inventory.md).

## Non-goals (v1)

- No booking engine, no live pricing or availability.
- No user-generated reviews or ratings (deferred — see decisions log D7 and [spec 09](09-roadmap.md)).
- No real-time feeds (weather, crowd levels) — the schema leaves hooks; apps can layer live data.
- No media hosting — only image/video *metadata* with explicit licensing; no scraped copyrighted content, text or images.
- No non-English prose (structure is multilingual-ready; content is English-first).

## Success criteria (v1.0 tag)

1. ≥ 60 spot records, 100% passing validation levels L1–L2 ([spec 07](07-quality-and-verification.md)).
2. Every Tier-1 spot ([spec 08](08-spot-inventory.md)) `last_verified` within 90 days of the v1.0 tag.
3. Every record has: summary, description, coordinates (precision ≥ approximate), category, 3–8 tags.
4. Companion sets shipped: 2 district files, ≥ 6 itineraries, ≥ 8 events, ≥ 15 stays, ≥ 10 food items.
5. Zero schema errors; all sanity-lint warnings triaged (fixed or explicitly waived in the record's provenance notes).

## Decisions log

Decisions are appended, never silently edited. Reversals get a new row referencing the old one.

| # | Date | Decision | Rationale |
|---|------|----------|-----------|
| D1 | 2026-08-08 | Specs-first: this repo defines everything before data production | Cheap to change specs now; expensive to migrate 60+ records later |
| D2 | 2026-08-08 | Source of truth = one JSON file per spot, JSON-Schema validated | Diff-friendly, reviewable, renders to MD/SQLite/API later |
| D3 | 2026-08-08 | English-only prose in v1; `name` is a language-keyed object (`{"en": …}`) | Fast to build; gu/hi slot in later with zero migration on names |
| D4 | 2026-08-08 | Facts drafted from model knowledge, then volatile fields web-verified; provenance mandatory on every record | Balance of speed and defensibility; staleness is the #1 risk |
| D5 | 2026-08-08 | Dual consumers: first-party website/app + dataset/API | Shapes schema toward filterable enums + stable IDs + versioning |
| D6 | 2026-08-08 | Granularity: sub-attractions are individual records grouped by `cluster` | App can list/filter/group either way; no mega-records |
| D7 | 2026-08-08 | Ratings/crowd-level estimates deferred to roadmap | Keep v1 factual; estimates need a defensible method first |
| D8 | 2026-08-08 | IDs are `{district}-{slug}` and immutable; renames happen via `aliases`, closures via `status`, never by changing `id` | API/URL stability |
